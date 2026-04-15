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

    <!-- Bannière avis disponible -->
    <div v-if="transaction" class="bg-green-50 px-4 py-2.5 border-b border-green-100 shrink-0 flex items-center justify-between gap-3">
      <p class="text-sm text-green-800 font-medium">✅ Transaction validée — laissez un avis !</p>
      <button @click="showReviewModal = true" class="btn-primary btn-sm shrink-0">
        ⭐ Laisser un avis
      </button>
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
        :can-respond="canRespondToOffer(msg)"
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
    <div v-if="conv.listings?.status === 'active'" class="bg-white border-t border-gray-100 p-3 shrink-0">
      <!-- Proposer un prix (acheteur ET vendeur) -->
      <div class="mb-2">
        <button
          v-if="!showOfferInput"
          @click="showOfferInput = true"
          class="btn-secondary btn-sm text-xs"
        >
          <Tag class="w-3 h-3" /> Proposer un prix
        </button>
        <div v-else class="flex items-center gap-2 mb-2">
          <div class="relative flex-1">
            <input v-model.number="offerAmount" type="number" min="0.01" step="0.01" class="input py-2 pr-8" placeholder="Montant en €" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
          </div>
          <button class="btn-primary btn-sm" @click="sendOffer" :disabled="!offerAmount || offerSending">
            <Loader v-if="offerSending" class="w-3 h-3 animate-spin" />
            <span v-else>Envoyer</span>
          </button>
          <button class="btn-secondary btn-sm" @click="showOfferInput = false; offerAmount = null">✕</button>
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
          @keydown.enter.exact.prevent="sendText"
          @input="handleTyping"
          @blur="stopTyping"
        />

        <!-- Envoyer -->
        <button
          class="btn-primary p-2.5 rounded-xl shrink-0"
          :disabled="!messageText.trim()"
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
              <input v-model.number="counterAmount" type="number" min="0.01" step="0.01" class="input pr-8" placeholder="Votre prix" />
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
            <p class="text-sm text-gray-500 mb-4">L'annonce passera en "Trouvée". Vous pourrez ensuite laisser un avis.</p>
            <div class="relative mb-4">
              <input v-model.number="agreedPrice" type="number" min="0" class="input pr-8" placeholder="Prix final (optionnel)" />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showValidateModal = false">Annuler</button>
              <button class="btn-primary flex-1" :disabled="validating" @click="handleValidate">
                <Loader v-if="validating" class="w-4 h-4 animate-spin" />
                <span v-else>Confirmer</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal laisser un avis -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showReviewModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-1">Laisser un avis</h3>
            <p class="text-sm text-gray-500 mb-4">Comment s'est passée la transaction avec <strong>{{ otherUser?.username }}</strong> ?</p>

            <!-- Étoiles -->
            <div class="flex gap-2 justify-center mb-4">
              <button
                v-for="star in 5"
                :key="star"
                @click="reviewRating = star"
                class="text-3xl transition-transform hover:scale-110"
                :class="star <= reviewRating ? 'text-yellow-400' : 'text-gray-200'"
              >★</button>
            </div>
            <p v-if="reviewRating" class="text-center text-sm text-gray-500 mb-3">
              {{ ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'][reviewRating] }}
            </p>

            <textarea
              v-model="reviewComment"
              class="input resize-none mb-4"
              rows="3"
              placeholder="Décrivez votre expérience (optionnel)..."
              maxlength="1000"
            />

            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showReviewModal = false">Annuler</button>
              <button class="btn-primary flex-1" :disabled="!reviewRating || reviewSending" @click="submitReview">
                <Loader v-if="reviewSending" class="w-4 h-4 animate-spin" />
                <span v-else>Publier l'avis</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import {
  ArrowLeft, MoreVertical, Package, User, Flag, Tag,
  Image as ImageIcon, Send, Loader
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

const conv             = ref(null)
const messages         = ref([])
const transaction      = ref(null)
const loading          = ref(true)
const loadingMore      = ref(false)
const messageText      = ref('')
const offerAmount      = ref(null)
const counterAmount    = ref(null)
const agreedPrice      = ref(null)
const showOfferInput   = ref(false)
const showCounterModal = ref(false)
const showValidateModal = ref(false)
const showReviewModal  = ref(false)
const showMenu         = ref(false)
const otherTyping      = ref(false)
const pendingOffer     = ref(null)
const menuRef          = ref(null)
const msgContainer     = ref(null)
const offerSending     = ref(false)
const validating       = ref(false)
const reviewRating     = ref(0)
const reviewComment    = ref('')
const reviewSending    = ref(false)

onClickOutside(menuRef, () => { showMenu.value = false })

const convId   = route.params.id
const isBuyer  = computed(() => conv.value?.buyer_id === auth.profile?.id)
const isSeller = computed(() => conv.value?.seller_id === auth.profile?.id)
const otherUser = computed(() => {
  if (!conv.value) return null
  return isBuyer.value ? conv.value.seller : conv.value.buyer
})

function canRespondToOffer(msg) {
  return msg.sender_id !== auth.profile?.id
    && (msg.type === 'offer' || msg.type === 'counter_offer')
    && (msg.offer_status === 'pending' || msg.offer_status == null)
}

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

    // Charger la transaction existante (si elle existe)
    try {
      const txRes = await api.get(`/api/conversations/${convId}/transaction`)
      transaction.value = txRes.data
    } catch {}

    // Écouter les nouveaux messages
    const socket = getSocket()
    if (socket) {
      socket.on('new:message', (msg) => {
        if (msg.conversation_id === convId) {
          // Éviter les doublons
          const exists = messages.value.find(m => m.id === msg.id)
          if (!exists) {
            messages.value.push(msg)
            nextTick(scrollToBottom)
            markMessagesRead(convId)
            convStore.fetchUnreadCount()
          }
        }
      })

      // Mise à jour du statut d'une offre
      socket.on('offer:updated', ({ message_id, offer_status }) => {
        const msg = messages.value.find(m => m.id === message_id)
        if (msg) msg.offer_status = offer_status
      })

      // Transaction validée par l'autre personne
      socket.on('transaction:validated', ({ transaction: tx }) => {
        transaction.value = tx
        if (conv.value?.listings) conv.value.listings.status = 'found'
        toast.success('La transaction a été validée !')
      })

      socket.on('typing:start', ({ user_id }) => {
        if (user_id !== auth.profile?.id) otherTyping.value = true
      })
      socket.on('typing:stop', ({ user_id }) => {
        if (user_id !== auth.profile?.id) otherTyping.value = false
      })
      socket.on('error:message', ({ message }) => {
        toast.error(message || 'Erreur lors de l\'envoi')
      })
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  leaveConversation(convId)
  const socket = getSocket()
  if (socket) {
    socket.off('new:message')
    socket.off('offer:updated')
    socket.off('transaction:validated')
    socket.off('typing:start')
    socket.off('typing:stop')
    socket.off('error:message')
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

async function sendOffer() {
  if (!offerAmount.value || offerSending.value) return
  offerSending.value = true
  try {
    // Utiliser l'API REST pour fiabilité + socket émis côté backend
    const msg = await convStore.sendMessage(convId, {
      type: 'offer',
      offer_amount: offerAmount.value
    })
    // Ajouter localement (le socket l'ajoutera pour l'autre personne)
    const exists = messages.value.find(m => m.id === msg.id)
    if (!exists) messages.value.push(msg)
    scrollToBottom()
    offerAmount.value = null
    showOfferInput.value = false
  } catch (err) {
    toast.error(err.response?.data?.error || 'Impossible d\'envoyer l\'offre')
  } finally {
    offerSending.value = false
  }
}

async function sendImage(e) {
  const file = e.target.files[0]
  if (!file) return
  e.target.value = ''

  const reader = new FileReader()
  reader.onload = async (ev) => {
    const base64 = ev.target.result.split(',')[1]
    try {
      const uploadRes = await api.post(`/api/conversations/${convId}/images`, {
        base64,
        filename: file.name
      })
      // Envoyer via REST pour que le backend émette le socket
      const msg = await convStore.sendMessage(convId, {
        type: 'image',
        image_url: uploadRes.data.url,
        content: null
      })
      const exists = messages.value.find(m => m.id === msg.id)
      if (!exists) messages.value.push(msg)
      scrollToBottom()
    } catch {
      toast.error('Erreur lors de l\'envoi de l\'image')
    }
  }
  reader.readAsDataURL(file)
}

async function handleAcceptOffer(offer) {
  try {
    const res = await convStore.respondToOffer(convId, offer.id, 'accept')
    // Mise à jour locale du statut (le socket va aussi le faire)
    const updated = messages.value.find(m => m.id === offer.id)
    if (updated) updated.offer_status = 'accepted'
    // Ajouter le message système localement si retourné
    if (res.system_message) {
      const exists = messages.value.find(m => m.id === res.system_message.id)
      if (!exists) {
        messages.value.push(res.system_message)
        scrollToBottom()
      }
    }
    toast.success('Offre acceptée ! Organisez votre rendez-vous.')
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
    const updated = messages.value.find(m => m.id === pendingOffer.value.id)
    if (updated) updated.offer_status = 'countered'
    if (res.counter_message) {
      const exists = messages.value.find(m => m.id === res.counter_message.id)
      if (!exists) messages.value.push(res.counter_message)
      scrollToBottom()
    }
    showCounterModal.value = false
    counterAmount.value = null
    toast.success('Contre-offre envoyée')
  } catch { toast.error('Erreur') }
}

async function handleValidate() {
  if (validating.value) return
  validating.value = true
  try {
    const res = await convStore.validateTransaction(convId, agreedPrice.value)
    transaction.value = res.transaction
    if (conv.value?.listings) conv.value.listings.status = 'found'
    showValidateModal.value = false
    toast.success('Transaction validée ! Vous pouvez maintenant laisser un avis.')
    // Recharger les messages pour voir le message système
    messages.value = await convStore.fetchMessages(convId)
    scrollToBottom()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur lors de la validation')
  } finally {
    validating.value = false
  }
}

async function submitReview() {
  if (!reviewRating.value || reviewSending.value) return
  reviewSending.value = true
  try {
    await api.post('/api/reviews', {
      transaction_id: transaction.value.id,
      rating: reviewRating.value,
      comment: reviewComment.value || null
    })
    showReviewModal.value = false
    reviewRating.value = 0
    reviewComment.value = ''
    toast.success('Avis publié ! Merci pour votre retour.')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur lors de la publication de l\'avis')
  } finally {
    reviewSending.value = false
  }
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
