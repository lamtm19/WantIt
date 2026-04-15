<template>
  <div class="max-w-4xl mx-auto px-4 py-8" v-if="profile">
    <!-- Header -->
    <div class="card p-6 mb-6">
      <div class="flex items-center gap-5 flex-wrap">
        <UserAvatar :profile="profile" size="xl" />
        <div class="flex-1">
          <h1 class="text-2xl font-black text-gray-900">{{ profile.username }}</h1>
          <div class="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <MapPin class="w-4 h-4" />
            <span>{{ locationLabel }}</span>
          </div>
          <div class="flex items-center gap-3 mt-2">
            <StarRating :model-value="profile.rating || 0" show-label />
            <span class="text-sm text-gray-500">Membre depuis {{ memberSince }}</span>
          </div>
          <div class="flex gap-3 mt-2 text-sm text-gray-600">
            <span><strong>{{ profile.active_listings_count }}</strong> recherche(s) active(s)</span>
            <span><strong>{{ profile.found_listings_count }}</strong> trouvée(s)</span>
          </div>
        </div>

        <div v-if="auth.isAuthenticated && auth.profile?.id !== profile.id" class="flex gap-2">
          <button
            @click="toggleBlock"
            :class="isBlocked ? 'btn-danger btn-sm' : 'btn-secondary btn-sm'"
          >
            <Ban class="w-4 h-4" />
            {{ isBlocked ? 'Débloquer' : 'Bloquer' }}
          </button>
          <button @click="showReport = true" class="btn-secondary btn-sm">
            <Flag class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Annonces actives -->
    <h2 class="font-bold text-lg text-gray-900 mb-4">Recherches actives</h2>
    <div v-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <ListingCard v-for="l in listings" :key="l.id" :listing="l" />
    </div>
    <div v-else class="text-center py-8 text-gray-400 mb-8">Aucune recherche active</div>

    <!-- Avis -->
    <h2 class="font-bold text-lg text-gray-900 mb-4">Avis ({{ reviews.length }})</h2>
    <div v-if="reviews.length" class="space-y-3">
      <div v-for="r in reviews" :key="r.id" class="card p-4">
        <div class="flex items-center gap-3 mb-2">
          <UserAvatar :profile="r.reviewer" size="sm" />
          <div>
            <p class="font-semibold text-sm">{{ r.reviewer?.username }}</p>
            <StarRating :model-value="r.rating" />
          </div>
          <span class="ml-auto text-xs text-gray-400">{{ new Date(r.created_at).toLocaleDateString('fr-FR') }}</span>
        </div>
        <p v-if="r.comment" class="text-sm text-gray-600">{{ r.comment }}</p>
      </div>
    </div>
    <div v-else class="text-center py-8 text-gray-400">Aucun avis</div>

    <!-- Modal signalement -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showReport" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showReport = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-4">Signaler {{ profile.username }}</h3>
            <textarea v-model="reportReason" class="input resize-none mb-4" rows="3" placeholder="Raison du signalement..." />
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showReport = false">Annuler</button>
              <button class="btn-danger flex-1" @click="sendReport">Signaler</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <div v-else-if="loading" class="max-w-4xl mx-auto px-4 py-8">
    <div class="card p-6 animate-pulse h-40" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { MapPin, Ban, Flag } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listings'
import UserAvatar from '@/components/common/UserAvatar.vue'
import StarRating from '@/components/common/StarRating.vue'
import ListingCard from '@/components/common/ListingCard.vue'
import api from '@/services/api'

const route  = useRoute()
const auth   = useAuthStore()
const store  = useListingStore()
const toast  = useToast()

const profile      = ref(null)
const listings     = ref([])
const reviews      = ref([])
const loading      = ref(true)
const isBlocked    = ref(false)
const showReport   = ref(false)
const reportReason = ref('')

const locationLabel = computed(() => {
  const p = profile.value
  if (!p) return ''
  if (p.city && p.postal_code) return `${p.city} (${p.postal_code})`
  return p.region || p.city || 'France'
})

const memberSince = computed(() => {
  if (!profile.value?.created_at) return ''
  return new Date(profile.value.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

onMounted(async () => {
  const id = route.params.id
  try {
    const [profileRes, listingsRes, reviewsRes] = await Promise.all([
      api.get(`/api/users/${id}`),
      store.getUserListings(id),
      api.get(`/api/users/${id}/reviews`)
    ])
    profile.value  = profileRes.data
    listings.value = listingsRes
    reviews.value  = reviewsRes.data.data || []
  } finally {
    loading.value = false
  }
})

async function toggleBlock() {
  const id = profile.value.id
  try {
    if (isBlocked.value) {
      await api.delete(`/api/users/${id}/block`)
      isBlocked.value = false
      toast.success('Utilisateur débloqué')
    } else {
      await api.post(`/api/users/${id}/block`)
      isBlocked.value = true
      toast.success('Utilisateur bloqué')
    }
  } catch { toast.error('Erreur') }
}

async function sendReport() {
  try {
    await api.post(`/api/users/${profile.value.id}/report`, { reason: reportReason.value })
    showReport.value  = false
    reportReason.value = ''
    toast.success('Signalement envoyé')
  } catch { toast.error('Erreur') }
}
</script>
