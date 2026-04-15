<template>
  <div class="max-w-5xl mx-auto px-4 py-8" v-if="listing">
    <!-- Statut -->
    <div v-if="listing.status !== 'active'" class="mb-4 p-4 rounded-xl border"
      :class="listing.status === 'found' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'"
    >
      <p class="font-semibold" :class="listing.status === 'found' ? 'text-green-700' : 'text-gray-600'">
        {{ listing.status === 'found' ? '✅ Cette recherche a été satisfaite' : '❌ Cette recherche est annulée' }}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Images + infos -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Galerie -->
        <div class="card overflow-hidden">
          <div v-if="images.length" class="relative">
            <div class="aspect-[16/9] bg-gray-100">
              <img :src="images[activeImg].url" class="w-full h-full object-contain" />
            </div>
            <div v-if="images.length > 1" class="flex gap-2 p-3 overflow-x-auto">
              <button
                v-for="(img, i) in images"
                :key="i"
                @click="activeImg = i"
                class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition"
                :class="i === activeImg ? 'border-primary-500' : 'border-transparent'"
              >
                <img :src="img.url" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
          <div v-else class="aspect-[16/9] bg-gray-50 flex items-center justify-center">
            <div class="text-center text-gray-300">
              <ImageOff class="w-16 h-16 mx-auto mb-2" />
              <p class="text-sm">Pas d'image fournie</p>
            </div>
          </div>
        </div>

        <!-- Détails -->
        <div class="card p-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span v-if="listing.is_urgent" class="badge bg-red-500 text-white"><Zap class="w-3 h-3" /> Urgent</span>
                <span v-if="listing.categories" class="badge badge-gray">{{ listing.categories.name }}</span>
              </div>
              <h1 class="text-2xl font-black text-gray-900">{{ listing.title }}</h1>
            </div>

            <!-- Actions propriétaire -->
            <div v-if="isOwner" class="flex gap-2 shrink-0">
              <RouterLink :to="`/listings/${listing.id}/edit`" class="btn-secondary btn-sm">
                <Pencil class="w-4 h-4" />
              </RouterLink>
            </div>
          </div>

          <!-- Prix -->
          <div class="flex items-center gap-2 mb-4">
            <p class="text-3xl font-black text-primary-600">
              {{ formatPrice(listing.price_min, listing.price_max) }}
            </p>
          </div>

          <!-- Localisation -->
          <div class="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin class="w-4 h-4 text-primary-500" />
            <span>{{ locationLabel }}</span>
            <span class="text-gray-400">·</span>
            <Navigation class="w-4 h-4 text-gray-400" />
            <span class="text-gray-500">{{ listing.max_distance_km }} km max</span>
          </div>

          <!-- États -->
          <div class="mb-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">États acceptés :</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="c in listing.conditions" :key="c" class="badge badge-green">{{ conditionLabel(c) }}</span>
            </div>
          </div>

          <!-- Marques -->
          <div v-if="brands.length" class="mb-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">Marques recherchées :</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="b in brands" :key="b" class="badge badge-gray">{{ b }}</span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="listing.description" class="border-t border-gray-100 pt-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">Description</p>
            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{{ listing.description }}</p>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Profil acheteur -->
        <div class="card p-5">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Recherche publiée par</p>
          <RouterLink :to="`/users/${listing.profiles?.id}`" class="flex items-center gap-3 hover:opacity-80 transition">
            <UserAvatar :profile="listing.profiles" size="lg" />
            <div>
              <p class="font-bold text-gray-900">{{ listing.profiles?.username }}</p>
              <p class="text-xs text-gray-500">{{ listing.profiles?.city || listing.profiles?.postal_code }}</p>
              <p class="text-xs text-gray-400">Membre depuis {{ memberSince }}</p>
            </div>
          </RouterLink>
        </div>

        <!-- CTA vendeur -->
        <div class="card p-5">
          <div v-if="auth.isAuthenticated && !isOwner">
            <p class="text-sm text-gray-600 mb-3">Vous possédez cet article ? Contactez l'acheteur !</p>
            <button
              class="btn-primary w-full"
              :disabled="listing.status !== 'active'"
              @click="showContactModal = true"
            >
              <MessageSquare class="w-4 h-4" />
              Proposer mon article
            </button>
          </div>
          <div v-else-if="isOwner" class="space-y-2">
            <RouterLink :to="`/listings/${listing.id}/edit`" class="btn-secondary w-full justify-center">
              <Pencil class="w-4 h-4" /> Modifier
            </RouterLink>
            <button @click="showStatusModal = true" class="btn-secondary w-full">Changer le statut</button>
          </div>
          <div v-else class="text-center">
            <RouterLink to="/login" class="btn-primary w-full justify-center">Se connecter pour contacter</RouterLink>
          </div>
        </div>

        <!-- Signaler -->
        <div v-if="auth.isAuthenticated && !isOwner" class="text-center">
          <button @click="showReportModal = true" class="text-xs text-gray-400 hover:text-red-500 transition">
            <Flag class="w-3 h-3 inline mr-1" /> Signaler cette annonce
          </button>
        </div>

        <!-- Stats -->
        <div class="card p-4 text-sm text-gray-500 space-y-1">
          <div class="flex justify-between">
            <span>Publiée</span>
            <span class="font-medium text-gray-700">{{ publishedAt }}</span>
          </div>
          <div class="flex justify-between">
            <span>Vues</span>
            <span class="font-medium text-gray-700">{{ listing.view_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal contact -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showContactModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showContactModal = false">
          <div class="card p-6 w-full max-w-md">
            <h3 class="font-bold text-lg mb-4">Contacter {{ listing.profiles?.username }}</h3>
            <p class="text-sm text-gray-500 mb-3">Présentez-vous et décrivez l'article que vous souhaitez vendre.</p>
            <textarea
              v-model="contactMessage"
              class="input resize-none mb-4"
              rows="4"
              placeholder="Bonjour, j'ai exactement ce que vous cherchez..."
              maxlength="2000"
            />
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showContactModal = false">Annuler</button>
              <button class="btn-primary flex-1" :disabled="!contactMessage.trim() || contactLoading" @click="sendContact">
                <Loader v-if="contactLoading" class="w-4 h-4 animate-spin" />
                <span v-else>Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal signalement -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showReportModal = false">
          <div class="card p-6 w-full max-w-md">
            <h3 class="font-bold text-lg mb-4">Signaler cette annonce</h3>
            <textarea v-model="reportReason" class="input resize-none mb-4" rows="3" placeholder="Décrivez le problème..." />
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showReportModal = false">Annuler</button>
              <button class="btn-danger flex-1" :disabled="!reportReason.trim()" @click="sendReport">Signaler</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="max-w-5xl mx-auto px-4 py-8">
    <div class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-200 rounded w-1/2" />
      <div class="h-64 bg-gray-200 rounded-2xl" />
    </div>
  </div>

  <!-- 404 -->
  <div v-else class="text-center py-20">
    <p class="text-gray-500 text-lg">Annonce introuvable</p>
    <RouterLink to="/" class="btn-primary mt-4 inline-flex">Retour à l'accueil</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ImageOff, MapPin, Navigation, Zap, MessageSquare, Pencil, Flag, Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listings'
import { useConversationStore } from '@/stores/conversations'
import UserAvatar from '@/components/common/UserAvatar.vue'
import api from '@/services/api'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const auth   = useAuthStore()
const store  = useListingStore()
const convStore = useConversationStore()

const listing         = ref(null)
const loading         = ref(true)
const activeImg       = ref(0)
const showContactModal = ref(false)
const showReportModal  = ref(false)
const showStatusModal  = ref(false)
const contactMessage  = ref('')
const contactLoading  = ref(false)
const reportReason    = ref('')

const isOwner = computed(() => listing.value?.user_id === auth.profile?.id)
const images  = computed(() => (listing.value?.listing_images || []).sort((a, b) => a.sort_order - b.sort_order))
const brands  = computed(() => (listing.value?.listing_brands || []).map(b => b.brands?.name || b.brand_name).filter(Boolean))

const locationLabel = computed(() => {
  if (!listing.value) return ''
  const { city, postal_code, region } = listing.value
  if (city && postal_code) return `${city} (${postal_code})`
  return region || city || 'France'
})

const memberSince = computed(() => {
  if (!listing.value?.profiles?.created_at) return ''
  return new Date(listing.value.profiles.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const publishedAt = computed(() => {
  if (!listing.value?.created_at) return ''
  return new Date(listing.value.created_at).toLocaleDateString('fr-FR')
})

function formatPrice(min, max) {
  if (min === max || !max) return `${min} €`
  return `${min} – ${max} €`
}

function conditionLabel(c) {
  return { new_with_tags: 'Neuf avec étiquette', new_without_tags: 'Neuf sans étiquette', very_good: 'Très bon état', good: 'Bon état', fair: 'État correct' }[c] || c
}

onMounted(async () => {
  try {
    listing.value = await store.getListing(route.params.id)
  } catch { listing.value = null }
  finally { loading.value = false }
})

async function sendContact() {
  if (!contactMessage.value.trim()) return
  contactLoading.value = true
  try {
    const res = await convStore.startConversation(listing.value.id, contactMessage.value)
    showContactModal.value = false
    toast.success('Message envoyé !')
    router.push(`/messages/${res.conversation.id}`)
  } catch (err) {
    if (err.response?.data?.conversation_id) {
      router.push(`/messages/${err.response.data.conversation_id}`)
    } else {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi')
    }
  } finally {
    contactLoading.value = false
  }
}

async function sendReport() {
  if (!reportReason.value.trim()) return
  try {
    await api.post('/api/reports/listing', { listing_id: listing.value.id, reason: reportReason.value })
    showReportModal.value = false
    reportReason.value = ''
    toast.success('Annonce signalée')
  } catch { toast.error('Erreur lors du signalement') }
}
</script>
