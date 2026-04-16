<template>
  <div class="px-4 pb-10 sm:px-6 lg:px-8">
    <section class="max-w-7xl mx-auto pt-6">
      <div class="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-900 via-primary-800 to-neutral-700 px-5 py-8 text-white sm:px-8 lg:px-12 lg:py-12">
        <div class="absolute inset-y-0 right-0 hidden w-[38%] bg-white/5 blur-3xl lg:block" />
        <div class="absolute -bottom-20 right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

        <div class="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-end">
          <div class="max-w-3xl">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.07em] leading-[0.95]">
              Trouvez ce que vous cherchez sans bruit.
            </h1>
            <p class="mt-5 max-w-2xl text-sm text-white/72 sm:text-base">
              Publiez votre besoin, laissez les vendeurs venir à vous, et gardez une expérience
              claire, locale et plus premium.
            </p>

            <div class="mt-6 flex flex-wrap items-center gap-3">
              <RouterLink to="/listings/create" class="btn bg-white text-primary-700 hover:bg-neutral-100 btn-lg font-bold">
                <Plus class="w-5 h-5" /> Publier ma recherche
              </RouterLink>
              <div class="rounded-full bg-white/10 px-4 py-2.5 text-sm text-white/75 backdrop-blur-md">
                {{ store.listings.length || 0 }} recherches en vitrine
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto py-7">
      <div class="flex gap-6">
        <aside class="hidden lg:block w-64 shrink-0">
          <div class="sticky top-24">
            <ListingFilters @filter="handleFilter" />
          </div>
        </aside>

        <div class="flex-1 min-w-0">
          <div class="section-shell mb-4 py-4">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <span class="editorial-title text-[1.9rem]">Recherches récentes</span>
                  <span v-if="store.listings.length" class="badge badge-gray">{{ store.listings.length }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button class="lg:hidden btn-secondary btn-sm" @click="showFilters = true">
                  <Filter class="w-4 h-4" /> Filtres
                </button>
                <select v-model="sort" class="input py-2.5 pr-8 min-w-[190px]" @change="reload">
                  <option value="recent">Plus récentes</option>
                  <option value="urgent">Urgentes d'abord</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>

            <div class="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                v-for="cat in [{ id: '', name: 'Tout', slug: '' }, ...store.categories]"
                :key="cat.id"
                :class="[
                  'shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition',
                  activeCategory === cat.id ? 'bg-neutral-900 text-white' : 'bg-white/85 text-gray-600 hover:bg-white',
                ]"
                @click="filterByCategory(cat.id)"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>

          <div v-if="store.listings.length" class="grid editorial-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <ListingCard
              v-for="(listing, index) in store.listings"
              :key="listing.id"
              :listing="listing"
              :class="index % 3 === 1 ? 'xl:translate-y-8' : ''"
            />
          </div>

          <div v-else-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div v-for="i in 9" :key="i" class="card animate-pulse p-3">
              <div class="aspect-[4/3] bg-gray-200 rounded-[1.8rem]" />
              <div class="p-3 space-y-2">
                <div class="h-4 bg-gray-200 rounded w-3/4" />
                <div class="h-4 bg-gray-200 rounded w-1/2" />
                <div class="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>

          <div v-else class="panel-soft text-center py-20 px-6">
            <Search class="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p class="text-gray-700 font-semibold">Aucune annonce trouvée</p>
            <p class="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>

          <div v-if="store.hasMore && !store.loading" class="text-center mt-6">
            <button class="btn-secondary" @click="loadMore">
              Charger plus
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showFilters" class="fixed inset-0 z-50 bg-black/40 flex items-end" @click.self="showFilters = false">
          <div class="bg-white w-full rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto">
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

const sort = ref('recent')
const showFilters = ref(false)
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
  if (q) await store.searchListings(route.query.q)
  else await store.fetchListings({ ...currentFilters.value, sort: sort.value }, true)
})

async function handleFilter(filters) {
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
