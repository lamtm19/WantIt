<template>
  <div class="max-w-2xl mx-auto px-4 py-8" v-if="listing">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Modifier la recherche</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div class="card p-5 space-y-4">
        <div>
          <label class="label">Titre <span class="text-red-500">*</span></label>
          <input v-model="form.title" type="text" class="input" required maxlength="200" />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input resize-none" rows="3" maxlength="2000" />
        </div>
        <div>
          <label class="label">Catégorie</label>
          <select v-model="form.category_id" class="input">
            <option value="">Aucune</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <label class="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" v-model="form.is_urgent" class="rounded text-primary-600 w-4 h-4" />
          <span class="text-sm font-medium">Recherche urgente</span>
        </label>
      </div>

      <div class="card p-5">
        <h2 class="font-bold mb-4">Budget</h2>
        <div class="flex gap-3 items-center">
          <div class="flex-1">
            <label class="label">Min (€)</label>
            <input v-model.number="form.price_min" type="number" class="input" min="0" />
          </div>
          <span class="text-gray-400 mt-5">–</span>
          <div class="flex-1">
            <label class="label">Max (€)</label>
            <input v-model.number="form.price_max" type="number" class="input" min="0" />
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h2 class="font-bold mb-4">État souhaité</h2>
        <div class="space-y-2">
          <label v-for="c in CONDITIONS" :key="c.value" class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.conditions" :value="c.value" class="rounded text-primary-600 w-4 h-4" />
            <span class="text-sm">{{ c.label }}</span>
          </label>
        </div>
      </div>

      <div class="card p-5">
        <h2 class="font-bold mb-4">Distance maximale</h2>
        <div class="relative max-w-[200px]">
          <input v-model.number="form.max_distance_km" type="number" class="input pr-12" min="1" />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
        </div>
      </div>

      <!-- Statut -->
      <div class="card p-5">
        <h2 class="font-bold mb-4">Statut de l'annonce</h2>
        <select v-model="form.status" class="input">
          <option value="active">Active</option>
          <option value="found">Trouvée / Achetée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{{ error }}</p>

      <div class="flex gap-3">
        <RouterLink :to="`/listings/${listing.id}`" class="btn-secondary flex-1 justify-center">Annuler</RouterLink>
        <button type="submit" class="btn-primary flex-1" :disabled="loading">
          <Loader v-if="loading" class="w-4 h-4 animate-spin" />
          <span v-else>Enregistrer</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useListingStore } from '@/stores/listings'

const route  = useRoute()
const router = useRouter()
const store  = useListingStore()
const toast  = useToast()

const listing = ref(null)
const loading = ref(false)
const error   = ref('')

const form = ref({ title: '', description: '', category_id: '', price_min: 0, price_max: 0, max_distance_km: 50, conditions: [], is_urgent: false, status: 'active' })

const CONDITIONS = [
  { value: 'new_with_tags',    label: 'Neuf avec étiquette' },
  { value: 'new_without_tags', label: 'Neuf sans étiquette' },
  { value: 'very_good',        label: 'Très bon état' },
  { value: 'good',             label: 'Bon état' },
  { value: 'fair',             label: 'État correct' }
]

const categories = computed(() => store.categories)

onMounted(async () => {
  await store.fetchCategories()
  listing.value = await store.getListing(route.params.id)
  Object.assign(form.value, {
    title:           listing.value.title,
    description:     listing.value.description || '',
    category_id:     listing.value.category_id || '',
    price_min:       listing.value.price_min,
    price_max:       listing.value.price_max,
    max_distance_km: listing.value.max_distance_km,
    conditions:      listing.value.conditions || [],
    is_urgent:       listing.value.is_urgent,
    status:          listing.value.status
  })
})

async function handleSubmit() {
  loading.value = true
  error.value   = ''
  try {
    await store.updateListing(listing.value.id, form.value)
    if (form.value.status !== listing.value.status) {
      await store.updateStatus(listing.value.id, form.value.status)
    }
    toast.success('Annonce mise à jour !')
    router.push(`/listings/${listing.value.id}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur'
  } finally {
    loading.value = false
  }
}
</script>
