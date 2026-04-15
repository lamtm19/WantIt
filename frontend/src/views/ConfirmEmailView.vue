<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-black text-primary-600">WantIt</RouterLink>
      </div>

      <div class="card p-8 text-center">

        <!-- Chargement -->
        <div v-if="status === 'loading'" class="py-6">
          <Loader class="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p class="text-gray-600 font-medium">Confirmation en cours...</p>
        </div>

        <!-- Succès -->
        <div v-else-if="status === 'success'" class="py-4">
          <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle class="w-10 h-10 text-green-500" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Email confirmé !</h2>
          <p class="text-gray-500 mb-1">Votre compte est maintenant actif.</p>
          <p class="text-sm text-gray-400 mb-6">Redirection dans {{ countdown }}s...</p>
          <RouterLink to="/login" class="btn-primary inline-flex">
            Se connecter maintenant
          </RouterLink>
        </div>

        <!-- Erreur -->
        <div v-else class="py-4">
          <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle class="w-10 h-10 text-red-500" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p class="text-gray-500 mb-2 text-sm">{{ errorMsg }}</p>
          <p class="text-xs text-gray-400 mb-6">
            Le lien de confirmation expire après 1 heure. Réinscrivez-vous pour en recevoir un nouveau.
          </p>
          <div class="flex gap-3 justify-center">
            <RouterLink to="/register" class="btn-secondary">S'inscrire à nouveau</RouterLink>
            <RouterLink to="/login" class="btn-primary">Se connecter</RouterLink>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loader, CheckCircle, XCircle } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'

const router   = useRouter()
const status   = ref('loading')
const errorMsg = ref('')
const countdown = ref(5)

onMounted(async () => {
  try {
    // ── Format 1 : access_token dans le fragment (#)
    // Supabase redirige vers : /confirm-email#access_token=xxx&refresh_token=xxx&type=signup
    const hash       = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const accessToken  = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const hashType     = hashParams.get('type')

    if (accessToken && (hashType === 'signup' || hashType === 'email_change')) {
      const { error } = await supabase.auth.setSession({
        access_token:  accessToken,
        refresh_token: refreshToken
      })
      if (error) throw error
      handleSuccess()
      return
    }

    // ── Format 2 : token_hash dans les query params (PKCE / OTP)
    // Supabase redirige vers : /confirm-email?token_hash=xxx&type=signup
    const queryParams = new URLSearchParams(window.location.search)
    const token_hash  = queryParams.get('token_hash')
    const otpType     = queryParams.get('type') || 'signup'

    if (token_hash) {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type: otpType })
      if (error) throw error
      handleSuccess()
      return
    }

    throw new Error('Lien de confirmation invalide ou expiré.')
  } catch (err) {
    console.error('Confirmation error:', err)
    errorMsg.value = err.message || 'Une erreur est survenue.'
    status.value = 'error'
  }
})

function handleSuccess() {
  status.value = 'success'
  // Décompte avant redirection automatique
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      router.push('/login')
    }
  }, 1000)
}
</script>
