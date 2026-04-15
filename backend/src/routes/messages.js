const express = require('express')
const router  = express.Router()
const supabase = require('../config/supabase')
const { requireAuth } = require('../middleware/auth')

// Nombre de messages non lus
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)

    if (!convs || convs.length === 0) return res.json({ count: 0 })

    const convIds = convs.map(c => c.id)

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .neq('sender_id', req.user.id)
      .eq('is_read', false)

    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
})

module.exports = router
