<template>
  <div class="auth-page min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-4xl font-black tracking-[-0.05em] text-primary-700">WantIt</RouterLink>
        <p class="mt-2 text-gray-700 font-medium">Bon retour parmi nous !</p>
      </div>

      <div class="card auth-card p-8">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="label auth-label">Email</label>
            <input v-model="form.email" type="email" class="input auth-input" placeholder="vous@exemple.com" required autocomplete="email" />
          </div>

          <div>
            <label class="label auth-label">Mot de passe</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="input auth-input pr-12"
                placeholder="••••••••"
                required
                autocomplete="current-password"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" @click="showPassword = !showPassword">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="text-right">
            <RouterLink to="/forgot-password" class="text-sm font-medium text-gray-800 hover:underline">Mot de passe oublié ?</RouterLink>
          </div>

          <div v-if="error" class="text-sm text-red-700 bg-red-50 p-3 rounded-xl">
            <p>{{ error }}</p>
            <div v-if="emailNotConfirmed" class="mt-2 pt-2 border-t border-red-200">
              <button
                type="button"
                class="text-sm text-primary-700 hover:underline font-medium"
                :disabled="resendLoading"
                @click="resendConfirmation"
              >
                {{ resendLoading ? 'Envoi...' : 'Renvoyer l\'email de confirmation' }}
              </button>
              <p v-if="resendMsg" class="text-xs text-green-700 mt-1">{{ resendMsg }}</p>
            </div>
          </div>

          <button type="submit" class="btn-primary w-full btn-lg" :disabled="loading">
            <Loader v-if="loading" class="w-5 h-5 animate-spin" />
            <span v-else>Se connecter</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-700 mt-6">
          Pas encore de compte ?
          <RouterLink to="/register" class="text-primary-700 font-semibold hover:underline">S'inscrire</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Eye, EyeOff, Loader } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const resendLoading = ref(false)
const resendMsg = ref('')

const emailNotConfirmed = computed(() =>
  error.value.toLowerCase().includes('confirm'),
)

async function handleLogin() {
  error.value = ''
  resendMsg.value = ''
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err.response?.data?.error || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}

async function resendConfirmation() {
  resendLoading.value = true
  resendMsg.value = ''
  try {
    await api.post('/api/auth/resend-confirmation', { email: form.value.email })
    resendMsg.value = 'Email renvoyé ! Vérifiez votre boîte mail.'
  } catch {
    resendMsg.value = 'Erreur lors de l\'envoi. Réessayez.'
  } finally {
    resendLoading.value = false
  }
}
</script>
