<template>
  <div class="max-w-2xl mx-auto px-4 py-8" v-if="listing">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Modifier la recherche</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Infos principales -->
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

      <!-- Budget -->
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

      <!-- États -->
      <div class="card p-5">
        <h2 class="font-bold mb-4">État souhaité</h2>
        <div class="space-y-2">
          <label v-for="c in CONDITIONS" :key="c.value" class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.conditions" :value="c.value" class="rounded text-primary-600 w-4 h-4" />
            <span class="text-sm">{{ c.label }}</span>
          </label>
        </div>
      </div>

      <!-- Marques -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-1">Marques (optionnel)</h2>
        <p class="text-sm text-gray-500 mb-4">Saisissez les marques recherchées</p>
        <div class="flex gap-2 mb-3">
          <input v-model="brandSearch" type="text" class="input flex-1" placeholder="Tapez une marque..." @input="searchBrands" @keyup.enter="addBrandByText" />
          <button type="button" class="btn-secondary" @click="addBrandByText">Ajouter</button>
        </div>
        <!-- Suggestions -->
        <div v-if="brandSuggestions.length" class="flex flex-wrap gap-2 mb-3">
          <button
            v-for="b in brandSuggestions"
            :key="b.id"
            type="button"
            class="badge badge-gray cursor-pointer hover:bg-gray-200"
            @click="addBrand(b)"
          >{{ b.name }}</button>
        </div>
        <!-- Marques sélectionnées -->
        <div class="flex flex-wrap gap-2">
          <span v-for="(b, i) in form.brands" :key="i" class="badge badge-green">
            {{ b.name }}
            <button type="button" @click="removeBrand(i)" class="ml-1 hover:text-green-900">✕</button>
          </span>
        </div>
      </div>

      <!-- Distance -->
      <div class="card p-5">
        <h2 class="font-bold mb-4">Distance maximale</h2>
        <div class="relative max-w-[200px]">
          <input v-model.number="form.max_distance_km" type="number" class="input pr-12" min="1" />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
        </div>
      </div>

      <!-- Photos -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-1">Photos</h2>
        <p class="text-sm text-gray-500 mb-4">Gérez les photos de votre annonce</p>

        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <!-- Images existantes -->
          <div
            v-for="img in existingImages"
            :key="img.id"
            class="aspect-square rounded-xl overflow-hidden relative group border border-gray-200"
          >
            <img :src="img.url" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
              @click="removeExistingImage(img)"
            >
              <Trash2 class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Nouvelles images à uploader -->
          <div
            v-for="(img, i) in newImages"
            :key="'new-' + i"
            class="aspect-square rounded-xl overflow-hidden relative group border border-primary-200"
          >
            <img :src="img.preview" class="w-full h-full object-cover" />
            <div class="absolute top-1 left-1 bg-primary-500 text-white text-xs px-1.5 py-0.5 rounded-full">Nouveau</div>
            <button
              type="button"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
              @click="removeNewImage(i)"
            >
              <Trash2 class="w-5 h-5 text-white" />
            </button>
          </div>

          <!-- Bouton ajouter -->
          <label
            v-if="existingImages.length + newImages.length < 8"
            class="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary-400 transition"
          >
            <Plus class="w-6 h-6 text-gray-400" />
            <span class="text-xs text-gray-400">Ajouter</span>
            <input type="file" accept="image/*" multiple class="hidden" @change="handleNewImages" />
          </label>
        </div>

        <p v-if="imagesToDelete.length" class="text-xs text-red-500 mt-2">
          {{ imagesToDelete.length }} photo(s) seront supprimées à l'enregistrement
        </p>
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
import { Loader, Trash2, Plus } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useListingStore } from '@/stores/listings'
import api from '@/services/api'

const route  = useRoute()
const router = useRouter()
const store  = useListingStore()
const toast  = useToast()

const listing        = ref(null)
const loading        = ref(false)
const error          = ref('')
const existingImages = ref([])   // images déjà dans la DB
const imagesToDelete = ref([])   // images existantes à supprimer
const newImages      = ref([])   // nouvelles images à uploader
const brandSearch    = ref('')
const brandSuggestions = ref([])

const form = ref({
  title: '', description: '', category_id: '', price_min: 0,
  price_max: 0, max_distance_km: 50, conditions: [], is_urgent: false, status: 'active',
  brands: []
})

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
    status:          listing.value.status,
    brands:          (listing.value.listing_brands || []).map(lb => ({
      name: lb.brand_name || ''
    })).filter(b => b.name)
  })
  // Charger les images existantes (triées par sort_order)
  existingImages.value = [...(listing.value.listing_images || [])]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
})

let brandTimer = null
async function searchBrands() {
  clearTimeout(brandTimer)
  if (brandSearch.value.length < 2) { brandSuggestions.value = []; return }
  brandTimer = setTimeout(async () => {
    const res = await api.get('/api/brands/search', { params: { q: brandSearch.value } })
    brandSuggestions.value = res.data.data || []
  }, 300)
}

function addBrand(brand) {
  if (!form.value.brands.find(b => b.name === brand.name)) {
    form.value.brands.push({ name: brand.name })
  }
  brandSearch.value = ''
  brandSuggestions.value = []
}

function addBrandByText() {
  if (!brandSearch.value.trim()) return
  addBrand({ name: brandSearch.value.trim() })
}

function removeBrand(i) { form.value.brands.splice(i, 1) }

function removeExistingImage(img) {
  existingImages.value = existingImages.value.filter(i => i.id !== img.id)
  imagesToDelete.value.push(img)
}

function removeNewImage(index) {
  newImages.value.splice(index, 1)
}

function handleNewImages(e) {
  for (const file of e.target.files) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      newImages.value.push({
        preview: ev.target.result,
        file,
        base64: ev.target.result.split(',')[1]
      })
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

async function handleSubmit() {
  loading.value = true
  error.value   = ''
  try {
    // 1. Mettre à jour les infos textuelles + marques
    await store.updateListing(listing.value.id, {
      title:           form.value.title,
      description:     form.value.description || null,
      category_id:     form.value.category_id || undefined,
      price_min:       form.value.price_min,
      price_max:       form.value.price_max,
      max_distance_km: form.value.max_distance_km,
      conditions:      form.value.conditions,
      is_urgent:       form.value.is_urgent,
      brands:          form.value.brands
    })

    // 2. Changer le statut si modifié
    if (form.value.status !== listing.value.status) {
      await store.updateStatus(listing.value.id, form.value.status)
    }

    // 3. Supprimer les images marquées pour suppression
    for (const img of imagesToDelete.value) {
      await api.delete(`/api/listings/${listing.value.id}/images/${img.id}`).catch(() => {})
    }

    // 4. Uploader les nouvelles images
    if (newImages.value.length > 0) {
      await store.uploadImages(listing.value.id, newImages.value.map(img => ({
        base64: img.base64,
        filename: img.file.name
      })))
    }

    toast.success('Annonce mise à jour !')
    router.push(`/listings/${listing.value.id}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la mise à jour'
  } finally {
    loading.value = false
  }
}
</script>
