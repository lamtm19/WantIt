const supabase = require('../config/supabase')

exports.reportListing = async (req, res) => {
  try {
    const { listing_id, reason } = req.body

    await supabase.from('reports').insert({
      reporter_id: req.user.id,
      type: 'listing',
      target_id: listing_id,
      reason
    })

    res.json({ message: 'Annonce signalée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.reportMessage = async (req, res) => {
  try {
    const { message_id, reason } = req.body

    await supabase.from('reports').insert({
      reporter_id: req.user.id,
      type: 'message',
      target_id: message_id,
      reason
    })

    res.json({ message: 'Message signalé' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}
