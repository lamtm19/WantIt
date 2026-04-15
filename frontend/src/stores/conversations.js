import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useConversationStore = defineStore('conversations', () => {
  const conversations  = ref([])
  const activeConv     = ref(null)
  const messages       = ref([])
  const unreadCount    = ref(0)
  const loading        = ref(false)

  async function fetchConversations() {
    loading.value = true
    try {
      const res = await api.get('/api/conversations')
      conversations.value = res.data.data || []
    } finally {
      loading.value = false
    }
  }

  async function getConversation(id) {
    const res = await api.get(`/api/conversations/${id}`)
    activeConv.value = res.data
    return res.data
  }

  async function startConversation(listingId, initialMessage) {
    const res = await api.post('/api/conversations', {
      listing_id: listingId,
      initial_message: initialMessage
    })
    conversations.value.unshift(res.data.conversation)
    return res.data
  }

  async function fetchMessages(conversationId, before = null) {
    const params = { limit: 50 }
    if (before) params.before = before
    const res = await api.get(`/api/conversations/${conversationId}/messages`, { params })
    return res.data.data || []
  }

  async function sendMessage(conversationId, payload) {
    const res = await api.post(`/api/conversations/${conversationId}/messages`, payload)
    return res.data
  }

  async function respondToOffer(conversationId, messageId, action, counterAmount = null) {
    const payload = { action }
    if (counterAmount) payload.counter_amount = counterAmount
    const res = await api.patch(`/api/conversations/${conversationId}/messages/${messageId}/offer`, payload)
    return res.data
  }

  async function validateTransaction(conversationId, agreedPrice = null) {
    const res = await api.post(`/api/conversations/${conversationId}/validate`, {
      agreed_price: agreedPrice
    })
    return res.data
  }

  async function fetchUnreadCount() {
    try {
      const res = await api.get('/api/messages/unread-count')
      unreadCount.value = res.data.count || 0
    } catch {}
  }

  function addMessage(msg) {
    messages.value.push(msg)
    const conv = conversations.value.find(c => c.id === msg.conversation_id)
    if (conv) {
      conv.last_message_at = msg.created_at
      conv.messages = [msg]
    }
  }

  function updateConvOrder() {
    conversations.value.sort((a, b) =>
      new Date(b.last_message_at) - new Date(a.last_message_at)
    )
  }

  return {
    conversations, activeConv, messages, unreadCount, loading,
    fetchConversations, getConversation, startConversation,
    fetchMessages, sendMessage, respondToOffer, validateTransaction,
    fetchUnreadCount, addMessage, updateConvOrder
  }
})
