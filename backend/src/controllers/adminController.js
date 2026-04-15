const supabase = require('../config/supabase')

exports.getStats = async (req, res) => {
  try {
    const [users, listings, reports, conversations] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('conversations').select('id', { count: 'exact', head: true })
    ])

    res.json({
      total_users: users.count || 0,
      total_listings: listings.count || 0,
      pending_reports: reports.count || 0,
      total_conversations: conversations.count || 0
    })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, is_banned } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (search) query = query.ilike('username', `%${search}%`)
    if (is_banned !== undefined) query = query.eq('is_banned', is_banned === 'true')

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data: data || [], total: count, page: parseInt(page) })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    if (id === req.user.id) return res.status(400).json({ error: 'Impossible de se bannir soi-même' })

    await supabase.from('profiles').update({ is_banned: true, ban_reason: reason || 'Violation des CGU' }).eq('id', id)
    res.json({ message: 'Utilisateur banni' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('profiles').update({ is_banned: false, ban_reason: null }).eq('id', id)
    res.json({ message: 'Utilisateur débanni' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('profiles').delete().eq('id', id)
    await supabase.auth.admin.deleteUser(id)
    res.json({ message: 'Utilisateur supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('listings')
      .select(`*, profiles:user_id (username), categories:category_id (name)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data: data || [], total: count, page: parseInt(page) })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('listings').update({ status: 'cancelled' }).eq('id', id)
    res.json({ message: 'Annonce supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'pending', type } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let query = supabase
      .from('reports')
      .select(`*, reporter:reporter_id (id, username)`, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1)

    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data: data || [], total: count, page: parseInt(page) })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.reviewReport = async (req, res) => {
  try {
    const { id } = req.params
    const { action, note } = req.body

    await supabase.from('reports').update({
      status: action === 'dismiss' ? 'dismissed' : 'actioned',
      admin_note: note
    }).eq('id', id)

    res.json({ message: 'Signalement traité' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getCategories = async (req, res) => {
  try {
    const { data } = await supabase.from('categories').select('*').order('sort_order')
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.createCategory = async (req, res) => {
  try {
    const { name, icon, sort_order } = req.body
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, slug, icon, sort_order: sort_order || 99 })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { name, icon, sort_order, is_active } = req.body

    const updates = {}
    if (name !== undefined) {
      updates.name = name
      updates.slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
    }
    if (icon !== undefined) updates.icon = icon
    if (sort_order !== undefined) updates.sort_order = sort_order
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('categories').update({ is_active: false }).eq('id', id)
    res.json({ message: 'Catégorie désactivée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getBrands = async (req, res) => {
  try {
    const { approved } = req.query
    let query = supabase.from('brands').select('*').order('name')
    if (approved !== undefined) query = query.eq('is_approved', approved === 'true')
    const { data } = await query
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.approveBrand = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('brands').update({ is_approved: true }).eq('id', id)
    res.json({ message: 'Marque approuvée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('brands').delete().eq('id', id)
    res.json({ message: 'Marque supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getForbiddenWords = async (req, res) => {
  try {
    const { data } = await supabase.from('forbidden_words').select('*').order('word')
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.addForbiddenWord = async (req, res) => {
  try {
    const { word } = req.body
    const { data, error } = await supabase
      .from('forbidden_words')
      .insert({ word, created_by: req.user.id })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return res.status(400).json({ error: 'Mot déjà existant' })
      throw error
    }
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteForbiddenWord = async (req, res) => {
  try {
    const { id } = req.params
    await supabase.from('forbidden_words').delete().eq('id', id)
    res.json({ message: 'Mot supprimé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getFlaggedConversations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listings:listing_id (title),
        buyer:buyer_id (id, username),
        seller:seller_id (id, username),
        messages (id, type, content, sender_id, created_at)
      `)
      .eq('is_flagged', true)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}
