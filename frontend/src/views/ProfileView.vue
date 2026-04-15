<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- En-tête profil -->
    <div class="card p-6 mb-6">
      <div class="flex items-start gap-5 flex-wrap">
        <!-- Avatar -->
        <div class="relative">
          <UserAvatar :profile="auth.profile" size="xl" />
          <label class="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow border border-gray-200 cursor-pointer hover:bg-gray-50">
            <Camera class="w-4 h-4 text-gray-600" />
            <input type="file" accept="image/*" class="hidden" @change="handleAvatarUpload" />
          </label>
        </div>

        <!-- Infos -->
        <div class="flex-1">
          <h1 class="text-2xl font-black text-gray-900">{{ auth.profile?.username }}</h1>
          <div class="flex items-center gap-2 mt-1 text-gray-500 text-sm">
            <MapPin class="w-4 h-4" />
            <span>{{ locationLabel }}</span>
          </div>
          <div class="flex items-center gap-4 mt-2">
            <StarRating :model-value="rating" show-label />
            <span class="text-sm text-gray-500">{{ reviewCount }} avis</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">Membre depuis {{ memberSince }}</p>
        </div>

        <RouterLink to="/profile/settings" class="btn-secondary btn-sm">
          <Settings class="w-4 h-4" /> Paramètres
        </RouterLink>
      </div>
    </div>

    <!-- Onglets -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in TABS"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition', activeTab === tab.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500']"
      >{{ tab.label }}</button>
    </div>

    <!-- Annonces actives -->
    <div v-if="activeTab === 'listings'">
      <div v-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ListingCard v-for="l in listings" :key="l.id" :listing="l" />
      </div>
      <div v-else class="text-center py-12 text-gray-400">
        <Package class="w-10 h-10 mx-auto mb-2" />
        <p>Aucune annonce active</p>
        <RouterLink to="/listings/create" class="btn-primary mt-3 inline-flex">Publier une recherche</RouterLink>
      </div>
    </div>

    <!-- Avis -->
    <div v-if="activeTab === 'reviews'">
      <div v-if="reviews.length" class="space-y-4">
        <div v-for="review in reviews" :key="review.id" class="card p-4">
          <div class="flex items-center gap-3 mb-2">
            <UserAvatar :profile="review.reviewer" size="sm" />
            <div>
              <p class="font-semibold text-sm">{{ review.reviewer?.username }}</p>
              <StarRating :model-value="review.rating" />
            </div>
            <span class="ml-auto text-xs text-gray-400">{{ new Date(review.created_at).toLocaleDateString('fr-FR') }}</span>
          </div>
          <p v-if="review.comment" class="text-sm text-gray-600">{{ review.comment }}</p>
          <p class="text-xs text-gray-400 mt-1">Concernant : {{ review.transactions?.listings?.title }}</p>
        </div>
      </div>
      <div v-else class="text-center py-12 text-gray-400">
        <Star class="w-10 h-10 mx-auto mb-2" />
        <p>Aucun avis reçu pour l'instant</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { MapPin, Camera, Settings, Package } from 'lucide-vue-next'
import { Star } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listings'
import UserAvatar from '@/components/common/UserAvatar.vue'
import StarRating from '@/components/common/StarRating.vue'
import ListingCard from '@/components/common/ListingCard.vue'
import api from '@/services/api'

const auth  = useAuthStore()
const store = useListingStore()
const toast = useToast()

const TABS = [
  { label: 'Mes recherches', value: 'listings' },
  { label: 'Avis reçus',     value: 'reviews' }
]

const activeTab  = ref('listings')
const listings   = ref([])
const reviews    = ref([])
const rating     = ref(0)
const reviewCount = ref(0)

const locationLabel = computed(() => {
  const p = auth.profile
  if (!p) return ''
  if (p.city && p.postal_code) return `${p.city} (${p.postal_code})`
  return p.region || p.city || 'France'
})

const memberSince = computed(() => {
  const d = auth.user?.created_at || auth.profile?.created_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

onMounted(async () => {
  const id = auth.profile?.id
  if (!id) return

  const [listingsRes, reviewsRes, ratingRes] = await Promise.all([
    store.getMyListings('active'),
    api.get(`/api/users/${id}/reviews`),
    api.get(`/api/users/${id}/rating`)
  ])

  listings.value   = listingsRes
  reviews.value    = reviewsRes.data.data || []
  rating.value     = ratingRes.data.rating || 0
  reviewCount.value = reviews.value.length
})

async function handleAvatarUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      await auth.uploadAvatar(ev.target.result.split(',')[1], file.name)
      toast.success('Avatar mis à jour !')
    } catch { toast.error('Erreur lors de l\'upload') }
  }
  reader.readAsDataURL(file)
}
</script>
