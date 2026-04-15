const supabase = require('../config/supabase')

exports.register = async (req, res) => {
  try {
    const { email, password, username, city, postal_code, region, latitude, longitude } = req.body

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
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    // Créer le profil
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
      // Rollback : supprimer l'utilisateur Auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erreur lors de la création du profil' })
    }

    // Connexion automatique après inscription
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return res.status(500).json({ error: 'Compte créé, veuillez vous connecter' })
    }

    res.status(201).json({
      user: { id: authData.user.id, email, username },
      session: session.session
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
