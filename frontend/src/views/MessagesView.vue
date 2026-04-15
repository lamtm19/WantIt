<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Messages</h1>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="card p-4 animate-pulse flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-gray-200" />
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-200 rounded w-1/3" />
          <div class="h-3 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>

    <div v-else-if="convStore.conversations.length" class="space-y-2">
      <RouterLink
        v-for="conv in convStore.conversations"
        :key="conv.id"
        :to="`/messages/${conv.id}`"
        class="card p-4 flex items-center gap-3 hover:shadow-md transition block"
      >
        <UserAvatar :profile="otherUser(conv)" size="md" class="shrink-0" />

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-0.5">
            <p class="font-semibold text-gray-900 truncate">{{ otherUser(conv)?.username }}</p>
            <span class="text-xs text-gray-400 shrink-0 ml-2">{{ timeAgo(conv.last_message_at) }}</span>
          </div>
          <p class="text-xs text-gray-500 truncate mb-1">📦 {{ conv.listings?.title }}</p>
          <p class="text-sm text-gray-600 truncate">{{ lastMessage(conv) }}</p>
        </div>

        <!-- Indicateurs -->
        <div class="flex flex-col items-end gap-1 shrink-0">
          <span v-if="hasUnread(conv)" class="w-2.5 h-2.5 rounded-full bg-primary-500" />
          <span v-if="conv.listings?.status !== 'active'" class="badge" :class="conv.listings?.status === 'found' ? 'badge-green' : 'badge-gray'">
            {{ conv.listings?.status === 'found' ? 'Trouvée' : 'Annulée' }}
          </span>
        </div>
      </RouterLink>
    </div>

    <div v-else class="text-center py-20">
      <MessageSquare class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500 font-medium">Aucun message</p>
      <p class="text-gray-400 text-sm mt-1">Vos conversations apparaîtront ici</p>
      <RouterLink to="/" class="btn-primary mt-4 inline-flex">Explorer les recherches</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { MessageSquare } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversations'
import UserAvatar from '@/components/common/UserAvatar.vue'

const auth      = useAuthStore()
const convStore = useConversationStore()
const loading   = ref(true)

onMounted(async () => {
  await convStore.fetchConversations()
  loading.value = false
})

function otherUser(conv) {
  return conv.buyer_id === auth.profile?.id ? conv.seller : conv.buyer
}

function lastMessage(conv) {
  const msgs = conv.messages || []
  if (!msgs.length) return ''
  const msg = msgs[msgs.length - 1]
  if (msg.type === 'offer') return `💰 Offre: ${msg.offer_amount}€`
  if (msg.type === 'image') return '📷 Photo'
  return msg.content || ''
}

function hasUnread(conv) {
  return (conv.messages || []).some(m => !m.is_read && m.sender_id !== auth.profile?.id)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>
