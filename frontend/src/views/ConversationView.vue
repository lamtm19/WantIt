<template>
  <div class="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem)]" v-if="conv">
    <!-- Header -->
    <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
      <RouterLink to="/messages" class="text-gray-500 hover:text-gray-700">
        <ArrowLeft class="w-5 h-5" />
      </RouterLink>
      <RouterLink :to="`/users/${otherUser?.id}`" class="flex items-center gap-2 flex-1 min-w-0">
        <UserAvatar :profile="otherUser" size="sm" />
        <div class="min-w-0">
          <p class="font-semibold text-gray-900 text-sm">{{ otherUser?.username }}</p>
          <p class="text-xs text-gray-400 truncate">{{ conv.listings?.title }}</p>
        </div>
      </RouterLink>

      <!-- Status annonce -->
      <span v-if="conv.listings?.status !== 'active'" class="badge"
        :class="conv.listings?.status === 'found' ? 'badge-green' : 'badge-gray'">
        {{ conv.listings?.status === 'found' ? '✓ Trouvée' : 'Annulée' }}
      </span>

      <!-- Menu -->
      <div class="relative" ref="menuRef">
        <button @click="showMenu = !showMenu" class="p-2 rounded-xl hover:bg-gray-100">
          <MoreVertical class="w-5 h-5 text-gray-500" />
        </button>
        <Transition name="slide-up">
          <div v-if="showMenu" class="absolute right-0 top-10 w-48 bg-white shadow-lg rounded-xl border border-gray-100 py-1 z-20">
            <RouterLink :to="`/listings/${conv.listing_id}`" class="menu-item" @click="showMenu = false">
              <Package class="w-4 h-4" /> Voir l'annonce
            </RouterLink>
            <RouterLink :to="`/users/${otherUser?.id}`" class="menu-item" @click="showMenu = false">
              <User class="w-4 h-4" /> Voir le profil
            </RouterLink>
            <button @click="reportConv" class="menu-item w-full text-red-500">
              <Flag class="w-4 h-4" /> Signaler
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Bannière annonce clôturée -->
    <div v-if="conv.listings?.status !== 'active'" class="bg-amber-50 px-4 py-2 border-b border-amber-100 text-sm text-amber-700 text-center shrink-0">
      ⚠️ Cette annonce n'est plus active
    </div>

    <!-- Messages -->
    <div ref="msgContainer" class="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
      <div v-if="loadingMore" class="text-center py-2">
        <Loader class="w-5 h-5 animate-spin text-gray-400 mx-auto" />
      </div>

      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :can-respond="isBuyer && msg.type === 'offer' || msg.type === 'counter_offer'"
        @accept="handleAcceptOffer"
        @reject="handleRejectOffer"
        @counter="showCounterModal = true; pendingOffer = $event"
      />

      <!-- Indicateur "en train d'écrire" -->
      <div v-if="otherTyping" class="flex items-center gap-2 text-gray-400 text-sm">
        <UserAvatar :profile="otherUser" size="xs" />
        <span>est en train d'écrire...</span>
      </div>
    </div>

    <!-- Bouton "Transaction réalisée" -->
    <div v-if="isBuyer && conv.listings?.status === 'active' && !transaction" class="bg-white border-t border-gray-100 px-4 py-2 shrink-0">
      <button @click="showValidateModal = true" class="btn-primary w-full btn-sm">
        ✅ Valider la transaction
      </button>
    </div>

    <!-- Zone de saisie -->
    <div class="bg-white border-t border-gray-100 p-3 shrink-0">
      <!-- Offre (vendeur uniquement) -->
      <div v-if="isSeller && conv.listings?.status === 'active'" class="mb-2">
        <button
          v-if="!showOfferInput"
          @click="showOfferInput = true"
          class="btn-secondary btn-sm text-xs"
        >
          <Tag class="w-3 h-3" /> Proposer un prix
        </button>
        <div v-else class="flex items-center gap-2 mb-2">
          <div class="relative flex-1">
            <input v-model.number="offerAmount" type="number" min="0" step="0.01" class="input py-2 pr-8" placeholder="Montant" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
          </div>
          <button class="btn-primary btn-sm" @click="sendOffer" :disabled="!offerAmount">Envoyer</button>
          <button class="btn-secondary btn-sm" @click="showOfferInput = false">✕</button>
        </div>
      </div>

      <div class="flex items-end gap-2">
        <!-- Image -->
        <label class="cursor-pointer p-2 rounded-xl hover:bg-gray-100 transition shrink-0">
          <ImageIcon class="w-5 h-5 text-gray-500" />
          <input type="file" accept="image/*" class="hidden" @change="sendImage" />
        </label>

        <!-- Saisie texte -->
        <textarea
          v-model="messageText"
          class="input flex-1 resize-none py-2.5 max-h-32"
          rows="1"
          placeholder="Votre message..."
          :disabled="conv.listings?.status !== 'active'"
          @keydown.enter.exact.prevent="sendText"
          @input="handleTyping"
          @blur="stopTyping"
        />

        <!-- Envoyer -->
        <button
          class="btn-primary p-2.5 rounded-xl shrink-0"
          :disabled="!messageText.trim() || conv.listings?.status !== 'active'"
          @click="sendText"
        >
          <Send class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Modal contre-offre -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCounterModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showCounterModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-4">Faire une contre-offre</h3>
            <div class="relative mb-4">
              <input v-model.number="counterAmount" type="number" min="0" step="0.01" class="input pr-8" placeholder="Votre prix" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showCounterModal = false">Annuler</button>
              <button class="btn-primary flex-1" :disabled="!counterAmount" @click="handleCounter">Envoyer</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal validation transaction -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showValidateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showValidateModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-2">Valider la transaction</h3>
            <p class="text-sm text-gray-500 mb-4">L'annonce passera en "Trouvée" et vous pourrez laisser un avis.</p>
            <div class="relative mb-4">
              <input v-model.number="agreedPrice" type="number" min="0" class="input pr-8" placeholder="Prix final (optionnel)" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showValidateModal = false">Annuler</button>
              <button class="btn-primary flex-1" @click="handleValidate">Confirmer</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import {
  ArrowLeft, MoreVertical, Package, User, Flag, Tag,
  Image as ImageIcon, Send, Loader, MoreHorizontal
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversations'
import { getSocket, joinConversation, leaveConversation, sendSocketMessage, emitTypingStart, emitTypingStop, markMessagesRead } from '@/services/socket'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import api from '@/services/api'

const route     = useRoute()
const toast     = useToast()
const auth      = useAuthStore()
const convStore = useConversationStore()

const conv           = ref(null)
const messages       = ref([])
const transaction    = ref(null)
const loading        = ref(true)
const loadingMore    = ref(false)
const messageText    = ref('')
const offerAmount    = ref(null)
const counterAmount  = ref(null)
const agreedPrice    = ref(null)
const showOfferInput  = ref(false)
const showCounterModal = ref(false)
const showValidateModal = ref(false)
const showMenu       = ref(false)
const otherTyping    = ref(false)
const pendingOffer   = ref(null)
const menuRef        = ref(null)
const msgContainer   = ref(null)

onClickOutside(menuRef, () => { showMenu.value = false })

const convId  = route.params.id
const isBuyer = computed(() => conv.value?.buyer_id === auth.profile?.id)
const isSeller = computed(() => conv.value?.seller_id === auth.profile?.id)
const otherUser = computed(() => {
  if (!conv.value) return null
  return isBuyer.value ? conv.value.seller : conv.value.buyer
})

let typingTimer = null

onMounted(async () => {
  try {
    conv.value     = await convStore.getConversation(convId)
    messages.value = await convStore.fetchMessages(convId)
    scrollToBottom()

    // Rejoindre la room socket
    joinConversation(convId)
    markMessagesRead(convId)
    convStore.fetchUnreadCount()

    // Écouter les nouveaux messages
    const socket = getSocket()
    if (socket) {
      socket.on('new:message', (msg) => {
        if (msg.conversation_id === convId) {
          messages.value.push(msg)
          nextTick(scrollToBottom)
          markMessagesRead(convId)
          convStore.fetchUnreadCount()
        }
      })
      socket.on('typing:start', ({ user_id }) => {
        if (user_id !== auth.profile?.id) otherTyping.value = true
      })
      socket.on('typing:stop', ({ user_id }) => {
        if (user_id !== auth.profile?.id) otherTyping.value = false
      })
    }

    // Vérifier si transaction existante
    const txRes = await api.get(`/api/conversations/${convId}/transaction`).catch(() => null)
    if (txRes) transaction.value = txRes.data
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  leaveConversation(convId)
  const socket = getSocket()
  if (socket) {
    socket.off('new:message')
    socket.off('typing:start')
    socket.off('typing:stop')
  }
})

function scrollToBottom() {
  nextTick(() => {
    if (msgContainer.value) {
      msgContainer.value.scrollTop = msgContainer.value.scrollHeight
    }
  })
}

function handleTyping() {
  emitTypingStart(convId)
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => emitTypingStop(convId), 2000)
}
function stopTyping() {
  clearTimeout(typingTimer)
  emitTypingStop(convId)
}

function sendText() {
  if (!messageText.value.trim()) return
  sendSocketMessage({ conversation_id: convId, type: 'text', content: messageText.value.trim() })
  messageText.value = ''
  stopTyping()
}

function sendOffer() {
  if (!offerAmount.value) return
  sendSocketMessage({ conversation_id: convId, type: 'offer', offer_amount: offerAmount.value })
  offerAmount.value = null
  showOfferInput.value = false
}

async function sendImage(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1]
    try {
      const res = await api.post(`/api/conversations/${convId}/messages`, {
        type: 'image',
        image_url: null,
        content: null
      })
      // TODO: upload image to Supabase Storage and send URL
      toast.info('Upload d\'image en cours de développement')
    } catch {}
  }
  reader.readAsDataURL(file)
}

async function handleAcceptOffer(offer) {
  try {
    await convStore.respondToOffer(convId, offer.id, 'accept')
    const updated = messages.value.find(m => m.id === offer.id)
    if (updated) updated.offer_status = 'accepted'
    toast.success('Offre acceptée !')
  } catch { toast.error('Erreur') }
}

async function handleRejectOffer(offer) {
  try {
    await convStore.respondToOffer(convId, offer.id, 'reject')
    const updated = messages.value.find(m => m.id === offer.id)
    if (updated) updated.offer_status = 'rejected'
  } catch { toast.error('Erreur') }
}

async function handleCounter() {
  if (!counterAmount.value || !pendingOffer.value) return
  try {
    const res = await convStore.respondToOffer(convId, pendingOffer.value.id, 'counter', counterAmount.value)
    if (res.counter_message) messages.value.push(res.counter_message)
    showCounterModal.value = false
    counterAmount.value = null
    toast.success('Contre-offre envoyée')
  } catch { toast.error('Erreur') }
}

async function handleValidate() {
  try {
    const res = await convStore.validateTransaction(convId, agreedPrice.value)
    transaction.value = res.transaction
    conv.value.listings.status = 'found'
    showValidateModal.value = false
    toast.success('Transaction validée ! Pensez à laisser un avis.')
    // Recharger les messages pour voir le message système
    messages.value = await convStore.fetchMessages(convId)
    scrollToBottom()
  } catch { toast.error('Erreur') }
}

async function reportConv() {
  showMenu.value = false
  try {
    await api.post(`/api/conversations/${convId}/report`, { reason: 'Contenu inapproprié' })
    toast.success('Conversation signalée')
  } catch {}
}
</script>

<style scoped>
.menu-item {
  @apply flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer;
}
</style>
