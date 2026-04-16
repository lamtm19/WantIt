<template>
  <div>
    <!-- Hero -->
    <section class="bg-gradient-to-br from-primary-600 to-primary-700 text-white py-12 px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h1 class="text-4xl md:text-5xl font-black mb-4">
          Trouvez ce que vous <span class="text-primary-200">cherchez</span>
        </h1>
        <p class="text-lg text-primary-100 mb-8">
          Publiez votre besoin, les vendeurs vous contactent. Simple, rapide, local.
        </p>
        <RouterLink to="/listings/create" class="btn bg-white text-primary-600 hover:bg-primary-50 btn-lg font-bold">
          <Plus class="w-5 h-5" /> Publier ma recherche
        </RouterLink>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-6">

        <!-- Filtres (desktop) -->
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="sticky top-20">
            <ListingFilters @filter="handleFilter" />
          </div>
        </aside>

        <!-- Contenu principal -->
        <div class="flex-1 min-w-0">
          <!-- Barre d'actions -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div class="flex items-center gap-2">
              <span class="text-gray-700 font-semibold">Recherches récentes</span>
              <span v-if="store.listings.length" class="badge badge-gray">{{ store.listings.length }}</span>
            </div>
            <div class="flex items-center gap-2">
              <!-- Filtres mobile -->
              <button class="lg:hidden btn-secondary btn-sm" @click="showFilters = true">
                <Filter class="w-4 h-4" /> Filtres
              </button>
              <!-- Tri -->
              <select v-model="sort" class="input py-2 pr-8" @change="reload">
                <option value="recent">Plus récentes</option>
                <option value="urgent">Urgentes d'abord</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          <!-- Catégories rapides -->
          <div class="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
            <button
              v-for="cat in [{ id: '', name: 'Tout', slug: '' }, ...store.categories]"
              :key="cat.id"
              :class="['shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition',
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400']"
              @click="filterByCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>

          <!-- Grille d'annonces -->
          <div v-if="store.listings.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ListingCard v-for="listing in store.listings" :key="listing.id" :listing="listing" />
          </div>

          <!-- Skeleton loading -->
          <div v-else-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="i in 9" :key="i" class="card animate-pulse">
              <div class="aspect-[4/3] bg-gray-200 rounded-t-2xl" />
              <div class="p-3 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4" />
                <div class="h-4 bg-gray-200 rounded w-1/2" />
                <div class="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>

          <!-- Vide -->
          <div v-else class="text-center py-20">
            <Search class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-500 font-medium">Aucune annonce trouvée</p>
            <p class="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>

          <!-- Charger plus -->
          <div v-if="store.hasMore && !store.loading" class="text-center mt-6">
            <button class="btn-secondary" @click="loadMore">
              Charger plus
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal filtres mobile -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showFilters" class="fixed inset-0 z-50 bg-black/40 flex items-end" @click.self="showFilters = false">
          <div class="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg">Filtres</h3>
              <button @click="showFilters = false"><X class="w-5 h-5 text-gray-500" /></button>
            </div>
            <ListingFilters @filter="handleFilter" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Plus, Filter, Search, X } from 'lucide-vue-next'
import { useListingStore } from '@/stores/listings'
import ListingCard from '@/components/common/ListingCard.vue'
import ListingFilters from '@/components/listings/ListingFilters.vue'

const store = useListingStore()
const route = useRoute()

const sort           = ref('recent')
const showFilters    = ref(false)
const activeCategory = ref('')
const currentFilters = ref({})

onMounted(async () => {
  await store.fetchCategories()
  if (route.query.q) {
    await store.searchListings(route.query.q)
  } else {
    await store.fetchListings({ sort: sort.value }, true)
  }
})

watch(() => route.query.q, async (q) => {
  if (q) await store.searchListings(q)
  else    await store.fetchListings({ ...currentFilters.value, sort: sort.value }, true)
})

async function handleFilter(filters) {
  // Garder le filtre catégorie actif (géré par les boutons)
  if (activeCategory.value) filters.category_id = activeCategory.value
  currentFilters.value = filters
  showFilters.value = false
  await store.fetchListings({ ...filters, sort: sort.value }, true)
}

async function filterByCategory(catId) {
  activeCategory.value = catId
  const filters = { ...currentFilters.value }
  if (catId) filters.category_id = catId
  else delete filters.category_id
  currentFilters.value = filters
  await store.fetchListings({ ...filters, sort: sort.value }, true)
}

async function reload() {
  await store.fetchListings({ ...currentFilters.value, sort: sort.value }, true)
}

async function loadMore() {
  await store.fetchListings(currentFilters.value)
}
</script>
