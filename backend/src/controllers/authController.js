const supabase = require('../config/supabase')

exports.register = async (req, res) => {
  try {
    const { email, password, username, city, postal_code, region, latitude, longitude } = req.body

    // Validations de base
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit faire au moins 8 caractères' })
    }

    // Vérifier unicité du pseudo
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: 'Ce pseudo est déjà utilisé' })
    }

    // En développement (NODE_ENV != production) : auto-confirmer le compte
    // → pas d'email, connexion immédiate possible
    // En production : email_confirm: false → envoi du lien de confirmation
    const isDev = process.env.NODE_ENV !== 'production'

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: isDev, // true en dev (pas de confirmation), false en prod
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

    // En production : générer et envoyer le lien de confirmation
    if (!isDev) {
      try {
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email,
          options: { redirectTo: `${process.env.FRONTEND_URL}/confirm-email` }
        })
        if (linkData?.properties?.action_link) {
          console.log(`[CONFIRMATION LINK] ${email} → ${linkData.properties.action_link}`)
          await emailService.sendConfirmationEmail(email, username, linkData.properties.action_link)
        } else {
          console.warn('generateLink error:', linkError)
        }
      } catch (linkErr) {
        console.error('generateLink exception:', linkErr)
        // Non bloquant : le compte est créé
      }
    }

    // Créer le profil via la fonction SECURITY DEFINER (contourne les RLS)
    // Cette fonction doit être créée via database/migrations/001_fixes.sql
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
      // Tenter une insertion directe comme fallback (si service key configurée)
      const { error: directError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        city:        city        || null,
        postal_code: postal_code || null,
        region:      region      || null,
        latitude:    latitude    || null,
        longitude:   longitude   || null
      })

      if (directError) {
        console.error('Profile direct insert error:', directError)
        // Rollback : supprimer l'utilisateur auth créé
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
        } catch (rollbackErr) {
          console.error('Rollback failed (deleteUser):', rollbackErr)
        }
        if (directError.code === '42501') {
          return res.status(500).json({
            error: 'Erreur de configuration base de données. Exécutez database/migrations/001_fixes.sql dans Supabase.'
          })
        }
        return res.status(500).json({ error: 'Erreur lors de la création du profil. Réessayez.' })
      }
    }

    // En dev (email auto-confirmé) → connecter directement l'utilisateur
    if (isDev) {
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

    // En production : attendre confirmation par mail
    res.status(201).json({
      message: 'Inscription réussie. Veuillez vérifier votre boîte mail pour confirmer votre compte.',
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
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })
    // Toujours retourner succès pour ne pas exposer les emails
    res.json({ message: 'Si un compte existe, un email a été envoyé.' })
  } catch (err) {
    console.error('forgotPassword error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { password, access_token } = req.body

    const { error } = await supabase.auth.admin.updateUserById(
      access_token,
      { password }
    )

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

    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: new_password
    })

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Supprimer le profil : cascade DB supprime listings, conversations, messages
    const { error: profileDelError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileDelError) {
      console.error('deleteAccount - profile delete error:', profileDelError)
      // On continue quand même pour supprimer l'auth user
    }

    // 2. Supprimer l'utilisateur Auth (nécessite la service key)
    const { error: authDelError } = await supabase.auth.admin.deleteUser(userId)
    if (authDelError) {
      console.error('deleteAccount - auth delete error:', authDelError)
      return res.status(500).json({ error: 'Erreur lors de la suppression du compte auth' })
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
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

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

    // Vérifier le token avec Supabase (magic link confirmation)
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type
    })

    if (error) {
      console.error('Token verification error:', error)
      return res.status(400).json({ error: 'Token invalide ou expiré. Veuillez demander un nouveau lien.' })
    }

    // Récupérer le profil pour réponse
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', data.user.id)
      .single()

    res.json({
      success: true,
      message: 'Email confirmé avec succès!',
      user: profile
    })
  } catch (err) {
    console.error('confirmEmail error:', err)
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}
