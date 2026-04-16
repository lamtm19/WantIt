const supabase = require('../config/supabase')

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  const token = authHeader.split(' ')[1]

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Token invalide' })
  }

  // Vérifier que l'utilisateur n'est pas banni
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, is_banned')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return res.status(401).json({ error: 'Profil introuvable' })
  }

  if (profile.is_banned) {
    return res.status(403).json({ error: 'Compte suspendu' })
  }

  req.user = { ...user, ...profile }
  next()
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(token)
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, is_banned')
      .eq('id', user.id)
      .single()
    if (profile && !profile.is_banned) {
      req.user = { ...user, ...profile }
    }
  }
  next()
}

module.exports = { requireAuth, optionalAuth }
