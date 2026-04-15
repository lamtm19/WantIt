const express  = require('express')
const router   = express.Router()
const supabase = require('../config/supabase')
const { requireAuth } = require('../middleware/auth')

// Recherche de marques (auto-complétion)
router.get('/search', async (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ data: [] })

  const { data, error } = await supabase
    .from('brands')
    .select('id, name')
    .ilike('name', `%${q}%`)
    .eq('is_approved', true)
    .limit(10)

  if (error) return res.status(500).json({ error: 'Erreur interne' })
  res.json({ data: data || [] })
})

// Suggérer une marque
router.post('/suggest', requireAuth, async (req, res) => {
  const { name } = req.body
  if (!name || name.length < 2) return res.status(400).json({ error: 'Nom invalide' })

  const { data: existing } = await supabase.from('brands').select('id').ilike('name', name).single()
  if (existing) return res.json({ brand: existing, message: 'Marque déjà existante' })

  const { data, error } = await supabase
    .from('brands')
    .insert({ name, is_approved: false })
    .select()
    .single()

  if (error) return res.status(500).json({ error: 'Erreur interne' })
  res.status(201).json({ brand: data })
})

module.exports = router
