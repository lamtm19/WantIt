const supabase    = require('../config/supabase')
const emailService = require('../services/emailService')

exports.register = async (req, res) => {
  try {
    const { email, password, username, city, postal_code, region, latitude, longitude } = req.body

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' })
    }

    // Vérifier unicité du pseudo
    const { data: existingUser } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (existingUser) {
      return res.status(400).json({ error: 'Ce pseudo est déjà utilisé' })
    }

    // Si REQUIRE_EMAIL_CONFIRMATION=true → l'utilisateur doit confirmer son email via Resend
    // Si false ou absent → auto-connexion immédiate (utile pour tests rapides)
    const requireConfirmation = process.env.REQUIRE_EMAIL_CONFIRMATION === 'true'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: !requireConfirmation,
      user_metadata: { username, city, postal_code, region, latitude, longitude }
    })

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('duplicate')) {
        return res.status(400).json({ error: 'Un compte existe déjà avec cet email' })
      }
      console.error('admin.createUser error:', authError)
      return res.status(400).json({ error: 'Erreur lors de la création du compte : ' + authError.message })
    }

    if (!authData?.user) {
      return res.status(500).json({ error: 'Une erreur est survenue lors de la création du compte' })
    }

    // Créer le profil
    const { error: profileError } = await supabase.rpc('create_user_profile', {
      p_id:          authData.user.id,
      p_username:    username,
      p_city:        city        || null,
      p_postal_code: postal_code || null,
      p_region:      region      || null,
      p_latitude:    latitude    || null,
      p_longitude:   longitude   || null
    })

    if (profileError) {
      console.error('Profile RPC error:', profileError)
      const { error: directError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        city: city || null, postal_code: postal_code || null,
        region: region || null, latitude: latitude || null, longitude: longitude || null
      })
      if (directError) {
        console.error('Profile direct insert error:', directError)
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
        return res.status(500).json({ error: 'Erreur lors de la création du profil. Réessayez.' })
      }
    }

    // ── Auto-connexion si confirmation non requise ─────────────
    if (!requireConfirmation) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError && signInData?.session) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single()
        return res.status(201).json({
          message: 'Inscription réussie',
          session: signInData.session,
          profile
        })
      }
    }

    // ── Envoyer le lien de confirmation via Resend ─────────────
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        options: { redirectTo: `${process.env.FRONTEND_URL}/confirm-email` }
      })

      if (linkData?.properties?.action_link) {
        const link = linkData.properties.action_link
        // En dev, afficher le lien dans le terminal pour tester sans email réel
        if (process.env.NODE_ENV !== 'production') {
          console.log('\n========== LIEN DE CONFIRMATION (DEV) ==========')
          console.log(`Email : ${email}`)
          console.log(`Lien  : ${link}`)
          console.log('=================================================\n')
        }
        await emailService.sendConfirmationEmail(email, username, link)
      } else {
        console.warn('generateLink error:', linkError)
      }
    } catch (linkErr) {
      console.error('generateLink exception:', linkErr)
      // Non bloquant : le compte est créé
    }

    res.status(201).json({
      message: 'Inscription réussie. Vérifiez votre boîte mail pour confirmer votre compte.',
      user: { id: authData.user.id, email, username }
    })
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Compte non confirmé
      if (error.message?.toLowerCase().includes('email not confirmed')) {
        return res.status(401).json({ error: 'Veuillez confirmer votre email avant de vous connecter.' })
      }
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', data.user.id).single()

    if (profile?.is_banned) {
      return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' })
    }

    res.json({ session: data.session, profile })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.logout = async (_req, res) => {
  res.json({ message: 'Déconnecté' })
}

// Mot de passe oublié → génère le lien via Supabase + envoie via Resend
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requis' })

    // Toujours répondre succès pour ne pas exposer si l'email existe
    res.json({ message: 'Si un compte existe, un email a été envoyé.' })

    // Vérifier que le compte existe
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    if (!user) return

    // Générer un lien de réinitialisation
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${process.env.FRONTEND_URL}/reset-password` }
    })

    if (linkData?.properties?.action_link) {
      await sendResetEmail(email, linkData.properties.action_link)
    }
  } catch (err) {
    console.error('forgotPassword error:', err)
    // Ne pas exposer l'erreur (déjà répondu succès)
  }
}

async function sendResetEmail(to, resetLink) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const EMAIL_FROM     = process.env.EMAIL_FROM || 'WantIt <onboarding@resend.dev>'
  if (!RESEND_API_KEY) return

  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>body{font-family:-apple-system,sans-serif;background:#f5f5f5;padding:20px;}
.card{background:white;border-radius:12px;padding:32px;max-width:560px;margin:0 auto;}
.logo{font-size:28px;font-weight:800;color:#09b668;margin-bottom:24px;}
.btn{display:inline-block;background:#09b668;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;}
</style></head><body><div class="card">
<div class="logo">WantIt</div>
<h2 style="color:#1a1a1a">Réinitialisation de votre mot de passe</h2>
<p style="color:#555">Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
<a class="btn" href="${resetLink}">Réinitialiser mon mot de passe</a>
<p style="color:#999;font-size:12px;margin-top:16px">Ce lien expire dans 1h. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
</div></body></html>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject: 'Réinitialisation de votre mot de passe WantIt', html })
    })
  } catch (err) {
    console.error('sendResetEmail error:', err.message)
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { password, access_token } = req.body

    const { error } = await supabase.auth.admin.updateUserById(access_token, { password })
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Mot de passe mis à jour' })
  } catch (err) {
    console.error('resetPassword error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { new_password } = req.body
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: new_password })
    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id

    const { error: profileDelError } = await supabase
      .from('profiles').delete().eq('id', userId)
    if (profileDelError) console.error('deleteAccount - profile error:', profileDelError)

    const { error: authDelError } = await supabase.auth.admin.deleteUser(userId)
    if (authDelError) {
      console.error('deleteAccount - auth error:', authDelError)
      return res.status(500).json({ error: 'Erreur lors de la suppression du compte' })
    }

    res.json({ message: 'Compte supprimé définitivement' })
  } catch (err) {
    console.error('deleteAccount error:', err)
    res.status(500).json({ error: 'Erreur lors de la suppression du compte' })
  }
}

exports.getMe = async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', req.user.id).single()
    res.json(profile)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.confirmEmail = async (req, res) => {
  try {
    const { token_hash, type = 'signup' } = req.body

    if (!token_hash) {
      return res.status(400).json({ error: 'Token requis' })
    }

    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (error) {
      console.error('Token verification error:', error)
      return res.status(400).json({ error: 'Token invalide ou expiré. Demandez un nouveau lien.' })
    }

    const { data: profile } = await supabase
      .from('profiles').select('username').eq('id', data.user.id).single()

    res.json({
      success: true,
      message: 'Email confirmé avec succès !',
      user: profile
    })
  } catch (err) {
    console.error('confirmEmail error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

// Renvoyer l'email de confirmation
exports.resendConfirmation = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requis' })

    // Générer un nouveau lien
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: `${process.env.FRONTEND_URL}/confirm-email` }
    })

    if (linkError || !linkData?.properties?.action_link) {
      console.error('resendConfirmation generateLink error:', linkError)
      return res.status(400).json({ error: 'Impossible de générer le lien. Le compte est peut-être déjà confirmé.' })
    }

    // Récupérer le username
    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    const username = user?.user_metadata?.username || 'utilisateur'

    const link = linkData.properties.action_link
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n========== LIEN DE CONFIRMATION (DEV) ==========')
      console.log(`Email : ${email}`)
      console.log(`Lien  : ${link}`)
      console.log('=================================================\n')
    }
    await emailService.sendConfirmationEmail(email, username, link)

    res.json({ message: 'Email de confirmation renvoyé.' })
  } catch (err) {
    console.error('resendConfirmation error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}
