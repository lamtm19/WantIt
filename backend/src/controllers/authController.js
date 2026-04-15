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

    // Créer le compte Supabase Auth
    // On utilise signUp pour déclencher l'envoi du mail de confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, city, postal_code, region, latitude, longitude }
      }
    })

    if (authError) {
      if (authError.message.includes('rate limit') || authError.message.includes('rate-limit')) {
        return res.status(429).json({ error: 'Trop de tentatives. Attendez 60s et réessayez.' })
      }
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Une erreur est survenue lors de la création du compte' })
    }

    // Vérifier que l'utilisateur existe (timing Supabase)
    await new Promise(resolve => setTimeout(resolve, 500))
    const { data: userCheck } = await supabase.auth.admin.getUserById(authData.user.id)
    if (!userCheck.user) {
      return res.status(500).json({ error: 'Utilisateur non créé (retry)' })
    }

    // Créer le profil (id maintenant garanti)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      username,
      city,
      postal_code,
      region,
      latitude,
      longitude
    })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      try {
        // Rollback sûr
        await supabase.from('profiles').delete().eq('id', authData.user.id)
      } catch (delErr) {
        console.error('Cleanup failed:', delErr)
      }
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erreur profil : ' + profileError.message + '. Réessayez.' })
    }

    // Si on attend une confirmation par mail, on ne retourne pas de session
    // (L'utilisateur ne pourra pas se connecter tant que le mail n'est pas validé)
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

exports.logout = async (req, res) => {
  res.json({ message: 'Déconnecté' })
}

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`
    })
    // Toujours retourner succès pour ne pas exposer les emails
    res.json({ message: 'Si un compte existe, un email a été envoyé.' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body
    const token = req.headers.authorization?.split(' ')[1]

    const { error } = await supabase.auth.admin.updateUserById(
      // Le token est fourni via le lien de reset
      req.body.access_token,
      { password }
    )

    if (error) return res.status(400).json({ error: error.message })
    res.json({ message: 'Mot de passe mis à jour' })
  } catch (err) {
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
    // Supprimer le profil (cascade sur les données liées)
    await supabase.from('profiles').delete().eq('id', req.user.id)
    // Supprimer l'utilisateur Auth
    await supabase.auth.admin.deleteUser(req.user.id)
    res.json({ message: 'Compte supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
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
