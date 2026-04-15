const { createClient } = require('@supabase/supabase-js')

module.exports = function (io) {
  // Client Supabase pour le socket (service key)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Map userId → Set<socketId>
  const userSockets = new Map()

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentification requise'))

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return next(new Error('Token invalide'))

    socket.userId = user.id
    next()
  })

  io.on('connection', (socket) => {
    const userId = socket.userId
    console.log(`Socket connecté: ${userId} (${socket.id})`)

    // Enregistrer le socket
    if (!userSockets.has(userId)) userSockets.set(userId, new Set())
    userSockets.get(userId).add(socket.id)

    // Rejoindre les rooms des conversations actives
    socket.on('join:conversation', async (conversationId) => {
      // Vérifier que l'utilisateur fait partie de la conversation
      const { data: conv } = await supabase
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single()

      if (conv && (conv.buyer_id === userId || conv.seller_id === userId)) {
        socket.join(`conv:${conversationId}`)
        socket.emit('joined:conversation', conversationId)
      }
    })

    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`)
    })

    // Envoi d'un message via socket
    socket.on('send:message', async ({ conversation_id, type, content, image_url, offer_amount }) => {
      try {
        // Vérifier accès
        const { data: conv } = await supabase
          .from('conversations')
          .select('buyer_id, seller_id, listing_id, listings:listing_id(status)')
          .eq('id', conversation_id)
          .single()

        if (!conv || (conv.buyer_id !== userId && conv.seller_id !== userId)) return
        if (conv.listings?.status !== 'active') {
          socket.emit('error:message', { message: 'Annonce non active' })
          return
        }

        const { data: msg } = await supabase
          .from('messages')
          .insert({
            conversation_id,
            sender_id: userId,
            type: type || 'text',
            content,
            image_url,
            offer_amount: offer_amount ? parseFloat(offer_amount) : null
          })
          .select(`*, sender:sender_id (id, username, avatar_url)`)
          .single()

        if (msg) {
          // Mettre à jour last_message_at
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversation_id)

          // Émettre à tous les membres de la conversation
          io.to(`conv:${conversation_id}`).emit('new:message', msg)

          // Émettre une notification push au destinataire s'il n'est pas dans la room
          const recipientId = userId === conv.buyer_id ? conv.seller_id : conv.buyer_id
          const recipientSocketIds = userSockets.get(recipientId)

          if (recipientSocketIds) {
            recipientSocketIds.forEach(sid => {
              const recipientSocket = io.sockets.sockets.get(sid)
              if (recipientSocket) {
                recipientSocket.emit('notification:message', {
                  conversation_id,
                  sender_username: msg.sender?.username,
                  preview: type === 'offer' ? `Offre: ${offer_amount}€` : content?.slice(0, 80)
                })
              }
            })
          }
        }
      } catch (err) {
        console.error('socket:send:message error', err)
        socket.emit('error:message', { message: 'Erreur lors de l\'envoi' })
      }
    })

    // Indicateur "en train d'écrire"
    socket.on('typing:start', ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit('typing:start', { user_id: userId })
    })

    socket.on('typing:stop', ({ conversation_id }) => {
      socket.to(`conv:${conversation_id}`).emit('typing:stop', { user_id: userId })
    })

    // Marquer les messages comme lus
    socket.on('messages:read', async ({ conversation_id }) => {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversation_id)
        .neq('sender_id', userId)
        .eq('is_read', false)

      socket.to(`conv:${conversation_id}`).emit('messages:read', { conversation_id, reader_id: userId })
    })

    // Déconnexion
    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) userSockets.delete(userId)
      }
      console.log(`Socket déconnecté: ${userId} (${socket.id})`)
    })
  })
}
