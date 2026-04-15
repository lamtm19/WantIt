<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Conversations signalées</h1>

    <div class="space-y-4">
      <div v-for="conv in conversations" :key="conv.id" class="card p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-gray-900">{{ conv.listings?.title }}</p>
            <p class="text-sm text-gray-500">
              <strong>{{ conv.buyer?.username }}</strong> (acheteur) ↔
              <strong>{{ conv.seller?.username }}</strong> (vendeur)
            </p>
          </div>
          <span class="badge badge-red">Signalée</span>
        </div>

        <!-- Messages récents -->
        <div class="bg-gray-50 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto mb-3">
          <div v-for="msg in (conv.messages || []).slice(-10)" :key="msg.id" class="text-sm">
            <span class="font-medium text-gray-700">{{ msg.sender_id === conv.buyer_id ? conv.buyer?.username : conv.seller?.username }} :</span>
            <span class="ml-1 text-gray-600">
              {{ msg.type === 'offer' ? `💰 ${msg.offer_amount}€` : msg.content }}
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <RouterLink
            :to="`/messages/${conv.id}`"
            class="btn-secondary btn-sm text-xs"
          >
            Voir la conversation complète
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-400"><Loader class="w-6 h-6 animate-spin mx-auto" /></div>
    <div v-else-if="!conversations.length" class="text-center py-12 text-gray-400">Aucune conversation signalée</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loader } from 'lucide-vue-next'
import api from '@/services/api'

const conversations = ref([])
const loading       = ref(true)

onMounted(async () => {
  const res = await api.get('/api/admin/conversations/flagged')
  conversations.value = res.data.data || []
  loading.value = false
})
</script>
