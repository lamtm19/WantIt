<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-black text-gray-900">Mes annonces</h1>
      <RouterLink to="/listings/create" class="btn-primary btn-sm">
        <Plus class="w-4 h-4" /> Nouvelle recherche
      </RouterLink>
    </div>

    <!-- Onglets -->
    <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
      <button
        v-for="tab in TABS"
        :key="tab.value"
        @click="activeTab = tab.value"
        :class="['px-4 py-2 rounded-lg text-sm font-medium transition', activeTab === tab.value ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700']"
      >
        {{ tab.label }}
        <span v-if="counts[tab.value] !== undefined" class="ml-1 badge badge-gray">{{ counts[tab.value] }}</span>
      </button>
    </div>

    <!-- Grille -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card animate-pulse h-64" />
    </div>

    <div v-else-if="listings.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="listing in listings" :key="listing.id" class="card group">
        <RouterLink :to="`/listings/${listing.id}`">
          <div class="aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden">
            <img
              v-if="firstImage(listing)"
              :src="firstImage(listing)"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <ImageOff class="w-8 h-8" />
            </div>
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-gray-900 line-clamp-1">{{ listing.title }}</h3>
            <p class="text-primary-600 font-bold text-sm mt-1">{{ listing.price_min }} – {{ listing.price_max }} €</p>
            <p class="text-xs text-gray-400 mt-1">{{ new Date(listing.created_at).toLocaleDateString('fr-FR') }}</p>
          </div>
        </RouterLink>
        <div class="px-3 pb-3 flex gap-2">
          <RouterLink :to="`/listings/${listing.id}/edit`" class="btn-secondary btn-sm flex-1 justify-center text-xs">
            <Pencil class="w-3 h-3" /> Modifier
          </RouterLink>
          <button @click="handleDelete(listing)" class="btn-secondary btn-sm text-red-500 hover:bg-red-50">
            <Trash2 class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <Package class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Aucune annonce {{ tabLabel[activeTab] }}</p>
      <RouterLink v-if="activeTab === 'active'" to="/listings/create" class="btn-primary mt-4 inline-flex">
        Publier ma première recherche
      </RouterLink>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer l'annonce"
      message="Cette annonce sera définitivement supprimée. Cette action est irréversible."
      confirm-label="Supprimer définitivement"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Package, ImageOff } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useListingStore } from '@/stores/listings'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const store = useListingStore()
const toast = useToast()

const TABS = [
  { label: 'Actives',   value: 'active' },
  { label: 'Trouvées',  value: 'found' },
  { label: 'Annulées',  value: 'cancelled' }
]

const activeTab      = ref('active')
const listings       = ref([])
const counts         = ref({})
const loading        = ref(true)
const showDeleteModal = ref(false)
const toDelete       = ref(null)

const tabLabel = { active: 'active', found: 'trouvée', cancelled: 'annulée' }

async function load() {
  loading.value = true
  listings.value = await store.getMyListings(activeTab.value)
  loading.value = false
}

onMounted(async () => {
  await load()
  // Récupérer les compteurs
  const [active, found, cancelled] = await Promise.all([
    store.getMyListings('active'),
    store.getMyListings('found'),
    store.getMyListings('cancelled')
  ])
  counts.value = { active: active.length, found: found.length, cancelled: cancelled.length }
})

watch(activeTab, load)

function firstImage(listing) {
  return (listing.listing_images || []).sort((a, b) => a.sort_order - b.sort_order)[0]?.url || null
}

function handleDelete(listing) {
  toDelete.value = listing
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await store.deleteListing(toDelete.value.id)
    await load()
    // Mettre à jour le compteur de l'onglet actif
    if (counts.value[activeTab.value] > 0) {
      counts.value = { ...counts.value, [activeTab.value]: counts.value[activeTab.value] - 1 }
    }
    toast.success('Annonce supprimée')
  } catch { toast.error('Erreur lors de la suppression') }
}
</script>
