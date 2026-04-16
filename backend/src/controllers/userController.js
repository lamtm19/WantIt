const supabase = require('../config/supabase')
const { v4: uuidv4 } = require('uuid')

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, city, postal_code, region, created_at')
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Profil introuvable' })

    // Note moyenne
    const { data: ratingData } = await supabase
      .rpc('get_user_rating', { user_id: id })

    // Compteurs
    const { count: activeCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'active')

    const { count: foundCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('status', 'found')

    res.json({
      ...data,
      rating: ratingData,
      active_listings_count: activeCount || 0,
      found_listings_count: foundCount || 0
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['username', 'city', 'postal_code', 'region', 'latitude', 'longitude']
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    )

    if (updates.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', req.user.id)
        .single()

      if (existing) return res.status(400).json({ error: 'Ce pseudo est déjà pris' })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.uploadAvatar = async (req, res) => {
  try {
    const { base64, filename } = req.body
    if (!base64) return res.status(400).json({ error: 'Image manquante' })

    const buffer = Buffer.from(base64, 'base64')
    const path   = `avatars/${req.user.id}/${uuidv4()}-${filename}`

    const { error: uploadError } = await supabase.storage
      .from('wantit-images')
      .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('wantit-images').getPublicUrl(path)

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', req.user.id)

    res.json({ avatar_url: publicUrl })
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
}

exports.getUserRating = async (req, res) => {
  try {
    const { id } = req.params
    const { data } = await supabase.rpc('get_user_rating', { user_id: id })
    res.json({ rating: data })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getUserReviews = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 10 } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:reviewer_id (id, username, avatar_url),
        transactions:transaction_id (listing_id, listings:listing_id(title))
      `)
      .eq('reviewed_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.blockUser   = (_req, res) => res.status(501).json({ error: 'Fonctionnalité non disponible' })
exports.unblockUser = (_req, res) => res.status(501).json({ error: 'Fonctionnalité non disponible' })
exports.getBlockedUsers = (_req, res) => res.json({ data: [] })
exports.reportUser  = (_req, res) => res.status(501).json({ error: 'Fonctionnalité non disponible' })
