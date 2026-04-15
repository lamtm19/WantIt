const express = require('express')
const router  = express.Router()
const supabase = require('../config/supabase')

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) return res.status(500).json({ error: 'Erreur interne' })
  res.json({ data: data || [] })
})

module.exports = router
