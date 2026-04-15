<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-black text-primary-600">WantIt</RouterLink>
        <p class="text-gray-500 mt-2">Créez votre compte gratuitement</p>
      </div>

      <div class="card p-8">
        <div v-if="success" class="text-center space-y-4 py-8 animate-in zoom-in duration-300">
          <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Vérifiez vos emails !</h2>
          <p class="text-gray-600">Un lien de confirmation a été envoyé à <span class="font-semibold text-gray-900">{{ form.email }}</span>.</p>
          <p class="text-sm text-gray-500">Veuillez cliquer sur le lien pour activer votre compte avant de vous connecter.</p>
          <div class="pt-6">
            <RouterLink to="/login" class="btn-primary inline-flex items-center gap-2">
              Aller à la page de connexion
            </RouterLink>
          </div>
        </div>

        <form v-else @submit.prevent="handleRegister" class="space-y-4">
          <!-- Pseudo -->
          <div>
            <label class="label">Pseudo <span class="text-red-500">*</span></label>
            <input v-model="form.username" type="text" class="input" placeholder="MonPseudo" required minlength="3" maxlength="30" autocomplete="username" />
          </div>

          <!-- Email -->
          <div>
            <label class="label">Email <span class="text-red-500">*</span></label>
            <input v-model="form.email" type="email" class="input" placeholder="vous@exemple.com" required autocomplete="email" />
          </div>

          <!-- Mot de passe -->
          <div>
            <label class="label">Mot de passe <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="input pr-12"
                placeholder="Minimum 8 caractères"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" @click="showPwd = !showPwd">
                <Eye v-if="!showPwd" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
            <div class="mt-1 flex gap-1">
              <div v-for="i in 4" :key="i" :class="[
                'h-1 flex-1 rounded-full transition-colors',
                form.password.length >= i * 2 ? (form.password.length < 8 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-200'
              ]"></div>
            </div>
            <p v-if="form.password && form.password.length < 8" class="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <span class="w-1 h-1 bg-orange-600 rounded-full"></span>
              Minimum 8 caractères requis
            </p>
          </div>

          <!-- Confirmation -->
          <div>
            <label class="label">Confirmer le mot de passe <span class="text-red-500">*</span></label>
            <input
              v-model="form.confirm"
              :type="showPwd ? 'text' : 'password'"
              class="input"
              placeholder="••••••••"
              required
              autocomplete="new-password"
            />
            <p v-if="form.confirm && form.password !== form.confirm" class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
          </div>

          <!-- Localisation -->
          <div class="pt-2 border-t border-gray-100">
            <p class="text-sm font-semibold text-gray-700 mb-3">Votre localisation</p>
            <div class="relative">
              <label class="label">Rechercher une ville <span class="text-red-500">*</span></label>
              <input
                v-model="citySearch"
                @input="searchCities"
                type="text"
                class="input"
                placeholder="Ex: Paris, Lyon..."
                autocomplete="off"
              />
              <div v-if="cities.length" class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                <button
                  v-for="city in cities"
                  :key="city.code"
                  type="button"
                  @click="selectCity(city)"
                  class="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                >
                  <div class="font-medium text-gray-900">{{ city.nom }}</div>
                  <div class="text-xs text-gray-500">{{ city.codesPostaux[0] }} - {{ city.region.nom }}</div>
                </button>
              </div>
            </div>

            <div v-if="form.city" class="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600">
                  <MapPin class="w-5 h-5" />
                </div>
                <div>
                  <div class="text-sm font-bold text-primary-900">{{ form.city }} ({{ form.postal_code }})</div>
                  <div class="text-xs text-primary-600">{{ form.region }}</div>
                </div>
              </div>
              <button @click="clearCity" type="button" class="p-1 hover:bg-white rounded-full text-primary-400 transition-colors">
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{{ error }}</p>

          <button
            type="submit"
            class="btn-primary w-full btn-lg"
            :disabled="loading || (form.confirm && form.password !== form.confirm)"
          >
            <Loader v-if="loading" class="w-5 h-5 animate-spin" />
            <span v-else>Créer mon compte</span>
          </button>

          <p class="text-xs text-gray-400 text-center">
            En vous inscrivant, vous acceptez les
            <RouterLink to="/legal" class="text-primary-600 hover:underline">mentions légales</RouterLink>.
          </p>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?
          <RouterLink to="/login" class="text-primary-600 font-semibold hover:underline">Se connecter</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader, MapPin, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const auth   = useAuthStore()
const router = useRouter()

const form = ref({
  username: '', email: '', password: '', confirm: '',
  city: '', postal_code: '', region: '', latitude: null, longitude: null
})
const loading = ref(false)
const error   = ref('')
const showPwd = ref(false)
const success = ref(false)

// Recherche de ville
const citySearch = ref('')
const cities = ref([])
let searchTimeout = null

async function searchCities() {
  if (citySearch.value.length < 2) {
    cities.value = []
    return
  }
  
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      const res = await axios.get(`https://geo.api.gouv.fr/communes?nom=${citySearch.value}&fields=nom,code,codesPostaux,centre,region&boost=population&limit=5`)
      cities.value = res.data
    } catch (err) {
      console.error('Geo API error:', err)
    }
  }, 300)
}

function selectCity(city) {
  form.value.city = city.nom
  form.value.postal_code = city.codesPostaux[0]
  form.value.region = city.region.nom
  form.value.latitude = city.centre.coordinates[1]
  form.value.longitude = city.centre.coordinates[0]
  citySearch.value = ''
  cities.value = []
}

function clearCity() {
  form.value.city = ''
  form.value.postal_code = ''
  form.value.region = ''
  form.value.latitude = null
  form.value.longitude = null
}

async function handleRegister() {
  if (form.value.password !== form.value.confirm) return
  if (!form.value.city) {
    error.value = 'Veuillez sélectionner une ville'
    return
  }

  error.value   = ''
  loading.value = true
  try {
    await auth.register(form.value)
    success.value = true
    // On ne redirige pas tout de suite si on attend une confirmation par mail
  } catch (err) {
    error.value = err.response?.data?.error || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>
