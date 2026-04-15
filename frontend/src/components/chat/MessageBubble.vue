<template>
  <div :class="['flex gap-2 mb-3', isOwn ? 'flex-row-reverse' : 'flex-row']">
    <UserAvatar v-if="!isOwn" :profile="message.sender" size="xs" class="mt-auto shrink-0" />

    <div :class="['max-w-[75%] group', isOwn ? 'items-end' : 'items-start', 'flex flex-col']">
      <!-- Message système -->
      <div v-if="message.type === 'system'" class="text-xs text-center text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5 mx-auto">
        {{ message.content }}
      </div>

      <!-- Offre -->
      <div v-else-if="message.type === 'offer' || message.type === 'counter_offer'"
        class="card p-4 border-2 border-primary-200 bg-primary-50 min-w-[200px]"
      >
        <div class="flex items-center gap-2 mb-2">
          <Tag class="w-4 h-4 text-primary-600" />
          <span class="text-sm font-bold text-primary-700">
            {{ message.type === 'counter_offer' ? 'Contre-offre' : 'Offre de prix' }}
          </span>
        </div>
        <p class="text-2xl font-black text-primary-600">{{ message.offer_amount }} €</p>

        <!-- Statut de l'offre -->
        <div class="mt-2">
          <span v-if="message.offer_status === 'accepted'" class="badge badge-green">✓ Acceptée</span>
          <span v-else-if="message.offer_status === 'rejected'" class="badge badge-red">✕ Refusée</span>
          <span v-else-if="message.offer_status === 'countered'" class="badge badge-orange">↩ Contre-offre envoyée</span>
          <span v-else class="badge badge-gray">En attente</span>
        </div>

        <!-- Actions si on peut répondre (offre en attente) -->
        <div v-if="canRespond" class="mt-3 flex flex-col gap-2">
          <div class="flex gap-2">
            <button class="btn-primary btn-sm flex-1" @click="$emit('accept', message)">Accepter</button>
            <button class="btn-secondary btn-sm flex-1" @click="$emit('reject', message)">Refuser</button>
          </div>
          <button class="btn-secondary btn-sm w-full" @click="$emit('counter', message)">Contre-offre</button>
        </div>
      </div>

      <!-- Image -->
      <div v-else-if="message.type === 'image'" class="rounded-2xl overflow-hidden max-w-[240px]">
        <img :src="message.image_url" alt="Image" class="w-full object-cover" @click="$emit('viewImage', message.image_url)" />
      </div>

      <!-- Texte -->
      <div
        v-else
        :class="[
          'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
          isOwn
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm'
        ]"
      >
        {{ message.content }}
      </div>

      <span class="text-[10px] text-gray-400 mt-1 px-1">
        {{ formatTime(message.created_at) }}
        <span v-if="isOwn && message.is_read" class="ml-1 text-primary-400">✓✓</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Tag } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '../common/UserAvatar.vue'

const props = defineProps({
  message:    { type: Object, required: true },
  canRespond: { type: Boolean, default: false }
})
defineEmits(['accept', 'reject', 'counter', 'viewImage'])

const auth  = useAuthStore()
const isOwn = computed(() => props.message.sender_id === auth.profile?.id)

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>
