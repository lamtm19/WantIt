const supabase      = require('../config/supabase')
const emailService  = require('../services/emailService')
const { v4: uuidv4 } = require('uuid')

// Référence à l'instance Socket.io (injectée depuis index.js)
let _io = null
exports.setIo = (io) => { _io = io }

exports.getConversations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listings:listing_id (id, title, status, price_min, price_max, listing_images(url)),
        buyer:buyer_id (id, username, avatar_url),
        seller:seller_id (id, username, avatar_url),
        messages (id, type, content, offer_amount, created_at, sender_id, is_read)
      `)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listings:listing_id (*, listing_images(url, sort_order)),
        buyer:buyer_id (id, username, avatar_url, city, postal_code),
        seller:seller_id (id, username, avatar_url, city, postal_code)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Conversation introuvable' })

    // Vérifier accès
    if (data.buyer_id !== req.user.id && data.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.createConversation = async (req, res) => {
  try {
    const { listing_id, initial_message } = req.body

    // Récupérer l'annonce
    const { data: listing } = await supabase
      .from('listings')
      .select('id, user_id, title, status, profiles:user_id(username, id)')
      .eq('id', listing_id)
      .single()

    if (!listing) return res.status(404).json({ error: 'Annonce introuvable' })
    if (listing.status !== 'active') return res.status(400).json({ error: 'Annonce non disponible' })
    if (listing.user_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous contacter vous-même' })

    // Vérifier si une conversation existe déjà
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('seller_id', req.user.id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'Vous avez déjà une conversation pour cette annonce', conversation_id: existing.id })
    }

    // Vérifier que l'utilisateur n'est pas bloqué
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('blocker_id')
      .eq('blocker_id', listing.user_id)
      .eq('blocked_id', req.user.id)
      .single()

    if (blocked) return res.status(403).json({ error: 'Vous ne pouvez pas contacter cet utilisateur' })

    // Créer la conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        listing_id,
        buyer_id: listing.user_id,
        seller_id: req.user.id
      })
      .select()
      .single()

    if (convError) throw convError

    // Envoyer le premier message
    const { data: msg } = await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        sender_id: req.user.id,
        type: 'text',
        content: initial_message
      })
      .select()
      .single()

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conv.id)

    // Notification email à l'acheteur
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', listing.user_id)
      .single()

    const { data: buyerAuth } = await supabase.auth.admin.getUserById(listing.user_id)

    if (buyerAuth?.user?.email) {
      await emailService.sendNewMessageEmail(
        buyerAuth.user.email,
        buyerProfile?.username || 'utilisateur',
        req.user.username,
        listing.title,
        conv.id
      )
    }

    res.status(201).json({ conversation: conv, message: msg })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params
    const { before, limit = 50 } = req.query

    // Vérifier accès
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (!conv || (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    let query = supabase
      .from('messages')
      .select(`*, sender:sender_id (id, username, avatar_url)`)
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (before) query = query.lt('created_at', before)

    const { data, error } = await query
    if (error) throw error

    // Marquer comme lu
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', id)
      .neq('sender_id', req.user.id)
      .eq('is_read', false)

    res.json({ data: (data || []).reverse() })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.sendMessage = async (req, res) => {
  try {
    const { id } = req.params
    const { type, content, image_url, offer_amount, offer_parent_id } = req.body

    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id, listing_id, listings:listing_id(title, status)')
      .eq('id', id)
      .single()

    if (!conv || (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    if (conv.listings?.status !== 'active') {
      return res.status(400).json({ error: 'Cette annonce n\'est plus active' })
    }

    // Les offres peuvent venir du vendeur OU de l'acheteur
    if (type === 'offer' && req.user.id !== conv.seller_id && req.user.id !== conv.buyer_id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: id,
        sender_id: req.user.id,
        type,
        content,
        image_url,
        offer_amount: offer_amount ? parseFloat(offer_amount) : null,
        offer_parent_id: offer_parent_id || null
      })
      .select(`*, sender:sender_id (id, username, avatar_url)`)
      .single()

    if (error) throw error

    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', id)

    // Émettre le message via socket pour la mise à jour en temps réel
    if (_io) {
      _io.to(`conv:${id}`).emit('new:message', msg)
    }

    // Notification email
    const recipientId = req.user.id === conv.buyer_id ? conv.seller_id : conv.buyer_id
    const { data: recipientAuth } = await supabase.auth.admin.getUserById(recipientId)
    const { data: recipientProfile } = await supabase.from('profiles').select('username').eq('id', recipientId).single()

    if (recipientAuth?.user?.email) {
      if (type === 'offer') {
        await emailService.sendNewOfferEmail(
          recipientAuth.user.email,
          recipientProfile?.username,
          req.user.username,
          conv.listings?.title,
          offer_amount,
          id
        )
      } else {
        await emailService.sendNewMessageEmail(
          recipientAuth.user.email,
          recipientProfile?.username,
          req.user.username,
          conv.listings?.title,
          id
        )
      }
    }

    res.status(201).json(msg)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.respondToOffer = async (req, res) => {
  try {
    const { id, msgId } = req.params
    const { action, counter_amount } = req.body

    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (!conv || (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const { data: offer } = await supabase
      .from('messages')
      .select('*')
      .eq('id', msgId)
      .eq('conversation_id', id)
      .single()

    if (!offer || (offer.type !== 'offer' && offer.type !== 'counter_offer')) {
      return res.status(404).json({ error: 'Offre introuvable' })
    }

    // On ne peut pas répondre à sa propre offre
    if (offer.sender_id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas répondre à votre propre offre' })
    }

    let offerStatus = 'pending'
    if (action === 'accept') offerStatus = 'accepted'
    else if (action === 'reject') offerStatus = 'rejected'
    else if (action === 'counter') offerStatus = 'countered'

    await supabase
      .from('messages')
      .update({ offer_status: offerStatus })
      .eq('id', msgId)

    const now = new Date().toISOString()

    // Si offre acceptée → message système pour organiser le RDV
    if (action === 'accept') {
      const { data: acceptorProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', req.user.id)
        .single()

      const { data: sysMsg } = await supabase.from('messages').insert({
        conversation_id: id,
        sender_id: req.user.id,
        type: 'system',
        content: `🤝 Prix de ${offer.offer_amount}€ accepté par ${acceptorProfile?.username} ! Organisez votre rendez-vous en main propre. Une fois l'échange effectué, l'acheteur pourra valider la transaction et vous pourrez vous laisser des avis mutuellement.`
      }).select().single()

      await supabase.from('conversations').update({ last_message_at: now }).eq('id', id)

      // Émettre la mise à jour du statut et le message système via socket
      if (_io) {
        _io.to(`conv:${id}`).emit('offer:updated', { message_id: msgId, offer_status: 'accepted' })
        if (sysMsg) _io.to(`conv:${id}`).emit('new:message', sysMsg)
      }

      return res.json({ status: 'accepted', agreed_price: offer.offer_amount, system_message: sysMsg })
    }

    // Si contre-offre, créer un nouveau message
    if (action === 'counter' && counter_amount) {
      const { data: counterMsg } = await supabase
        .from('messages')
        .insert({
          conversation_id: id,
          sender_id: req.user.id,
          type: 'counter_offer',
          offer_amount: parseFloat(counter_amount),
          offer_parent_id: msgId
        })
        .select(`*, sender:sender_id (id, username, avatar_url)`)
        .single()

      await supabase.from('conversations').update({ last_message_at: now }).eq('id', id)

      if (_io && counterMsg) {
        _io.to(`conv:${id}`).emit('new:message', counterMsg)
      }

      return res.json({ status: 'countered', counter_message: counterMsg })
    }

    // Si refus → notifier via socket
    if (_io) {
      _io.to(`conv:${id}`).emit('offer:updated', { message_id: msgId, offer_status: 'rejected' })
    }

    await supabase.from('conversations').update({ last_message_at: now }).eq('id', id)
    res.json({ status: offerStatus })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.validateTransaction = async (req, res) => {
  try {
    const { id } = req.params
    const { agreed_price } = req.body

    const { data: conv } = await supabase
      .from('conversations')
      .select('*, listings:listing_id(user_id, title)')
      .eq('id', id)
      .single()

    // Seul l'acheteur valide la transaction
    if (!conv || conv.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Seul l\'acheteur peut valider la transaction' })
    }

    // Vérifier qu'il n'y a pas déjà une transaction
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('conversation_id', id)
      .single()

    if (existing) return res.status(400).json({ error: 'Transaction déjà validée' })

    // Créer la transaction
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        conversation_id: id,
        listing_id: conv.listing_id,
        buyer_id: conv.buyer_id,
        seller_id: conv.seller_id,
        agreed_price: agreed_price ? parseFloat(agreed_price) : null
      })
      .select()
      .single()

    if (txError) throw txError

    // Passer l'annonce en "trouvée"
    await supabase.from('listings').update({ status: 'found' }).eq('id', conv.listing_id)

    // Message système dans la conversation
    const { data: sysMsg } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: req.user.id,
      type: 'system',
      content: `✅ Transaction validée ! Vous pouvez maintenant laisser un avis à l'autre utilisateur.`
    }).select().single()

    // Émettre via socket pour mise à jour en temps réel
    if (_io) {
      if (sysMsg) _io.to(`conv:${id}`).emit('new:message', sysMsg)
      _io.to(`conv:${id}`).emit('transaction:validated', { transaction: tx })
    }

    // Notification email au vendeur
    const { data: sellerAuth } = await supabase.auth.admin.getUserById(conv.seller_id)
    const { data: sellerProfile } = await supabase.from('profiles').select('username').eq('id', conv.seller_id).single()
    const { data: buyerProfile } = await supabase.from('profiles').select('username').eq('id', req.user.id).single()

    if (sellerAuth?.user?.email) {
      await emailService.sendTransactionValidatedEmail(
        sellerAuth.user.email,
        sellerProfile?.username,
        buyerProfile?.username,
        conv.listings?.title,
        tx.id
      )
    }

    res.json({ transaction: tx })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.reportConversation = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    await supabase.from('conversations').update({ is_flagged: true }).eq('id', id)
    await supabase.from('reports').insert({
      reporter_id: req.user.id,
      type: 'conversation',
      target_id: id,
      reason
    })

    res.json({ message: 'Conversation signalée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params

    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (!conv || (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('conversation_id', id)
      .single()

    if (!tx) return res.status(404).json({ error: 'Aucune transaction' })
    res.json(tx)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.uploadChatImage = async (req, res) => {
  try {
    const { id } = req.params
    const { base64, filename } = req.body

    // Vérifier accès
    const { data: conv } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', id)
      .single()

    if (!conv || (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const buffer = Buffer.from(base64, 'base64')
    const ext = filename.split('.').pop() || 'jpg'
    const path = `chat/${id}/${uuidv4()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('wantit-images')
      .upload(path, buffer, { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`, upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('wantit-images')
      .getPublicUrl(path)

    res.json({ url: publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
}
