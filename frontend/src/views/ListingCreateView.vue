<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Publier une recherche</h1>

    <form @submit.prevent="handleSubmit" class="space-y-6">

      <!-- Titre -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4">Informations principales</h2>
        <div class="space-y-4">
          <div>
            <label class="label">Que recherchez-vous ? <span class="text-red-500">*</span></label>
            <input v-model="form.title" type="text" class="input" placeholder="Ex: iPhone 13 Pro 256Go" required maxlength="200" />
            <p class="text-xs text-gray-400 mt-1">{{ form.title.length }}/200</p>
          </div>

          <div>
            <label class="label">Description (optionnel)</label>
            <textarea v-model="form.description" class="input resize-none" rows="3" placeholder="Précisez la couleur, version, accessoires souhaités..." maxlength="2000" />
          </div>

          <div>
            <label class="label">Catégorie</label>
            <select v-model="form.category_id" class="input">
              <option value="">Sélectionner une catégorie</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="form.is_urgent" class="rounded text-primary-600 w-4 h-4" />
            <span>
              <span class="font-medium text-sm">Recherche urgente</span>
              <span class="text-xs text-gray-500 ml-1">Mise en avant prioritaire</span>
            </span>
          </label>
        </div>
      </div>

      <!-- Budget -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4">Budget</h2>
        <div class="flex gap-3 items-center">
          <div class="flex-1">
            <label class="label">Min (€) <span class="text-red-500">*</span></label>
            <input v-model.number="form.price_min" type="number" class="input" placeholder="0" required min="0" />
          </div>
          <span class="text-gray-400 mt-5">–</span>
          <div class="flex-1">
            <label class="label">Max (€) <span class="text-red-500">*</span></label>
            <input v-model.number="form.price_max" type="number" class="input" placeholder="100" required min="0" />
          </div>
        </div>
        <p v-if="form.price_min > form.price_max && form.price_max" class="text-xs text-red-500 mt-2">Le min doit être inférieur au max</p>
      </div>

      <!-- États -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4">État souhaité <span class="text-red-500">*</span></h2>
        <div class="space-y-2">
          <label v-for="c in CONDITIONS" :key="c.value" class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-200 cursor-pointer transition">
            <input type="checkbox" v-model="form.conditions" :value="c.value" class="rounded text-primary-600 w-4 h-4" />
            <div>
              <p class="text-sm font-medium">{{ c.label }}</p>
              <p class="text-xs text-gray-400">{{ c.desc }}</p>
            </div>
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

      <!-- Localisation & distance -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4">Localisation</h2>
        <div class="bg-gray-50 rounded-xl p-3 mb-4">
          <p class="text-sm text-gray-600">
            📍 L'annonce utilisera votre localisation de profil :
            <strong>{{ locationLabel }}</strong>
          </p>
        </div>
        <div>
          <label class="label">Distance maximale <span class="text-red-500">*</span></label>
          <p class="text-xs text-gray-500 mb-2">Je suis prêt à faire maximum ... km pour venir chercher ce bien</p>
          <div class="relative max-w-[200px]">
            <input v-model.number="form.max_distance_km" type="number" class="input pr-12" placeholder="50" required min="1" />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">km</span>
          </div>
        </div>
      </div>

      <!-- Photos -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-1">Photos d'exemple (optionnel)</h2>
        <p class="text-sm text-gray-500 mb-4">Ajoutez des photos pour illustrer ce que vous recherchez</p>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          <div
            v-for="(img, i) in previewImages"
            :key="i"
            class="aspect-square rounded-xl overflow-hidden relative group border border-gray-200"
          >
            <img :src="img.preview" class="w-full h-full object-cover" />
            <button
              type="button"
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
              @click="removeImage(i)"
            >
              <Trash2 class="w-5 h-5 text-white" />
            </button>
          </div>
          <label class="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary-400 transition">
            <Plus class="w-6 h-6 text-gray-400" />
            <span class="text-xs text-gray-400">Ajouter</span>
            <input type="file" accept="image/*" multiple class="hidden" @change="handleImages" />
          </label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{{ error }}</p>

      <!-- Submit -->
      <div class="flex gap-3">
        <RouterLink to="/" class="btn-secondary flex-1 justify-center">Annuler</RouterLink>
        <button
          type="submit"
          class="btn-primary flex-1"
          :disabled="loading || !form.conditions.length || form.price_min > form.price_max"
        >
          <Loader v-if="loading" class="w-5 h-5 animate-spin" />
          <span v-else>Publier la recherche</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Trash2, Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listings'
import api from '@/services/api'

const auth   = useAuthStore()
const store  = useListingStore()
const router = useRouter()
const toast  = useToast()

const loading        = ref(false)
const error          = ref('')
const brandSearch    = ref('')
const brandSuggestions = ref([])
const previewImages  = ref([])

const form = ref({
  title:          '',
  description:    '',
  category_id:    '',
  price_min:      0,
  price_max:      0,
  max_distance_km: 50,
  conditions:     [],
  is_urgent:      false,
  brands:         []
})

const CONDITIONS = [
  { value: 'new_with_tags',    label: 'Neuf avec étiquette',    desc: 'Jamais utilisé, avec étiquette originale' },
  { value: 'new_without_tags', label: 'Neuf sans étiquette',    desc: 'Jamais utilisé' },
  { value: 'very_good',        label: 'Très bon état',          desc: 'Utilisé, aucun défaut visible' },
  { value: 'good',             label: 'Bon état',               desc: 'Légères traces d\'usure' },
  { value: 'fair',             label: 'État correct / satisfaisant', desc: 'Traces visibles mais fonctionnel' }
]

const locationLabel = computed(() => {
  const p = auth.profile
  if (!p) return 'Non définie'
  if (p.city && p.postal_code) return `${p.city} (${p.postal_code})`
  return p.region || p.city || 'Non définie'
})

const categories = computed(() => store.categories)

onMounted(() => store.fetchCategories())

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
    form.value.brands.push(brand)
  }
  brandSearch.value = ''
  brandSuggestions.value = []
}

function addBrandByText() {
  if (!brandSearch.value.trim()) return
  addBrand({ name: brandSearch.value.trim() })
}

function removeBrand(i) { form.value.brands.splice(i, 1) }

function handleImages(e) {
  for (const file of e.target.files) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewImages.value.push({ preview: ev.target.result, file, base64: ev.target.result.split(',')[1] })
    }
    reader.readAsDataURL(file)
  }
}

function removeImage(i) { previewImages.value.splice(i, 1) }

async function handleSubmit() {
  if (!form.value.conditions.length) { error.value = 'Sélectionnez au moins un état'; return }
  if (form.value.price_min > form.value.price_max) { error.value = 'Le prix min doit être ≤ au prix max'; return }

  loading.value = true
  error.value   = ''

  try {
    const listing = await store.createListing({
      title:           form.value.title,
      description:     form.value.description,
      category_id:     form.value.category_id || undefined,
      price_min:       form.value.price_min,
      price_max:       form.value.price_max,
      max_distance_km: form.value.max_distance_km,
      conditions:      form.value.conditions,
      is_urgent:       form.value.is_urgent,
      brands:          form.value.brands
    })

    // Upload des images
    if (previewImages.value.length > 0) {
      await store.uploadImages(listing.id, previewImages.value.map(img => ({
        base64: img.base64,
        filename: img.file.name
      })))
    }

    toast.success('Recherche publiée avec succès !')
    router.push(`/listings/${listing.id}`)
  } catch (err) {
    const data = err.response?.data
    if (data?.errors?.length) {
      error.value = data.errors.map(e => e.msg).join(', ')
    } else {
      error.value = data?.error || 'Erreur lors de la publication'
    }
    if (data?.details) console.error('Listing create details:', data.details)
  } finally {
    loading.value = false
  }
}
</script>
