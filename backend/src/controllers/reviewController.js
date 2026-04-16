const supabase     = require('../config/supabase')
const emailService = require('../services/emailService')

exports.createReview = async (req, res) => {
  try {
    const { transaction_id, rating, comment } = req.body
    const ratingInt = parseInt(rating, 10)

    if (!ratingInt || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ error: 'La note doit être entre 1 et 5' })
    }

    // Vérifier que la transaction existe et que l'utilisateur en fait partie
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select('id, buyer_id, seller_id, listing_id, buyer_reviewed, seller_reviewed')
      .eq('id', transaction_id)
      .single()

    if (txError || !tx) {
      console.error('[createReview] tx not found:', txError)
      return res.status(404).json({ error: 'Transaction introuvable' })
    }

    const isBuyer  = tx.buyer_id  === req.user.id
    const isSeller = tx.seller_id === req.user.id

    console.log(`[createReview] user=${req.user.id} isBuyer=${isBuyer} isSeller=${isSeller} tx.buyer=${tx.buyer_id} tx.seller=${tx.seller_id}`)

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    // Vérifier qu'il n'a pas déjà laissé un avis
    if (isBuyer && tx.buyer_reviewed) {
      return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour cette transaction' })
    }
    if (isSeller && tx.seller_reviewed) {
      return res.status(400).json({ error: 'Vous avez déjà laissé un avis pour cette transaction' })
    }

    const reviewed_id = isBuyer ? tx.seller_id : tx.buyer_id

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        transaction_id,
        reviewer_id: req.user.id,
        reviewed_id,
        rating: ratingInt,
        comment: comment || null
      })
      .select()
      .single()

    if (error) {
      console.error('[createReview] insert error:', JSON.stringify(error))
      return res.status(500).json({
        error: 'Erreur lors de la publication de l\'avis',
        details: error.message,
        code: error.code
      })
    }

    // Marquer la transaction
    if (isBuyer) {
      await supabase.from('transactions').update({ buyer_reviewed: true }).eq('id', transaction_id)
    } else {
      await supabase.from('transactions').update({ seller_reviewed: true }).eq('id', transaction_id)
    }

    // Notification email (non bloquant)
    try {
      const { data: listingData } = await supabase
        .from('listings').select('title').eq('id', tx.listing_id).single()
      const { data: reviewedAuth } = await supabase.auth.admin.getUserById(reviewed_id)
      const { data: reviewedProfile } = await supabase
        .from('profiles').select('username').eq('id', reviewed_id).single()

      if (reviewedAuth?.user?.email) {
        await emailService.sendNewReviewEmail(
          reviewedAuth.user.email,
          reviewedProfile?.username,
          req.user.username,
          ratingInt,
          listingData?.title
        )
      }
    } catch (emailErr) {
      console.warn('[createReview] email notification failed:', emailErr.message)
    }

    res.status(201).json(review)
  } catch (err) {
    console.error('[createReview] unexpected error:', err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body

    const { data: existing } = await supabase
      .from('reviews')
      .select('reviewer_id')
      .eq('id', id)
      .single()

    if (!existing) return res.status(404).json({ error: 'Avis introuvable' })
    if (existing.reviewer_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' })

    const updates = {}
    if (rating !== undefined) updates.rating = rating
    if (comment !== undefined) updates.comment = comment

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}
