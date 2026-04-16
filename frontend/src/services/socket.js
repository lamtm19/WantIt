import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

let socket = null
// Callbacks à appeler à chaque connexion/reconnexion
const onConnectCallbacks = new Set()

export function getSocket() {
  return socket
}

export function onSocketConnect(cb) {
  onConnectCallbacks.add(cb)
  // Si déjà connecté, appeler immédiatement
  if (socket?.connected) cb(socket)
  // Retourne une fonction de nettoyage
  return () => onConnectCallbacks.delete(cb)
}

export function connectSocket() {
  const auth = useAuthStore()
  if (!auth.token || socket?.connected) return

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
    auth: { token: auth.token },
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  })

  socket.on('connect', () => {
    console.log('Socket connecté')
    // Notifier tous les abonnés (permet de re-enregistrer les listeners après reconnexion)
    onConnectCallbacks.forEach(cb => cb(socket))
  })
  socket.on('disconnect', () => console.log('Socket déconnecté'))
  socket.on('connect_error', (err) => console.error('Socket error:', err.message))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinConversation(conversationId) {
  socket?.emit('join:conversation', conversationId)
}

export function leaveConversation(conversationId) {
  socket?.emit('leave:conversation', conversationId)
}

export function sendSocketMessage(payload) {
  socket?.emit('send:message', payload)
}

export function emitTypingStart(conversationId) {
  socket?.emit('typing:start', { conversation_id: conversationId })
}

export function emitTypingStop(conversationId) {
  socket?.emit('typing:stop', { conversation_id: conversationId })
}

export function markMessagesRead(conversationId) {
  socket?.emit('messages:read', { conversation_id: conversationId })
}
