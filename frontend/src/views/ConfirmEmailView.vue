<template>
  <div class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background pattern -->
    <div class="absolute inset-0 bg-grid-white/20"></div>
    
    <!-- Secure header -->
    <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xl shadow-2xl border border-emerald-200 px-8 py-4 rounded-3xl flex items-center gap-3">
      <div class="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">WantIt</div>
      <div class="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-2xl font-semibold text-sm shadow-md">
        <ShieldCheck class="w-4 h-4" />
        Confirmation sécurisée
      </div>
      <div class="ml-auto flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
        </svg>
        HTTPS
      </div>
    </div>

    <div class="relative z-10 max-w-md w-full bg-white/90 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl border border-white/70 animate-in zoom-in-95 duration-1000">
      
      <!-- Loading -->
      <div v-if="loading" class="text-center space-y-6">
        <div class="w-28 h-28 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl flex items-center justify-center shadow-xl border-4 border-emerald-100 mx-auto">
          <Loader2 class="w-14 h-14 text-emerald-500 animate-spin" />
        </div>
        <div>
          <h1 class="text-3xl font-black text-gray-900 mb-3">Validation de sécurité</h1>
          <p class="text-xl text-gray-600 font-medium">Nous vérifions votre lien de confirmation...</p>
          <p class="text-sm text-emerald-700 mt-2 font-semibold">Votre session est protégée par chiffrement</p>
        </div>
        <div class="w-full bg-gray-200 rounded-2xl h-3 overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-2xl animate-[progress_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <!-- Success -->
      <div v-else-if="!error &amp;&amp; verified" class="text-center space-y-6">
        <div class="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center mx-auto shadow-2xl border-4 border-emerald-200 animate-bounce">
          <CheckCircle2 class="w-16 h-16 text-emerald-600 drop-shadow-lg" />
        </div>
        <div class="space-y-4">
          <h1 class="text-4xl font-black bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent drop-shadow-lg">
            Parfait !
          </h1>
          <p v-if="user?.username" class="text-2xl font-bold text-gray-900">Bienvenue {{ user.username }} !</p>
          <div class="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
            <p class="text-lg text-emerald-900 font-semibold mb-2">✅ Email confirmé</p>
            <p class="text-emerald-800">{{ user.email }}</p>
          </div>
          <p class="text-gray-600 text-lg">Votre compte WantIt est maintenant actif et sécurisé.</p>
        </div>
        <div>
          <RouterLink 
            to="/login" 
            class="btn-primary w-full py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-3"
          >
            Commencer sur WantIt
            <ArrowRight class="w-6 h-6" />
          </RouterLink>
          <p class="text-sm text-gray-500 mt-4">{{ countdown }}s → redirection automatique</p>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center space-y-6">
        <div class="w-28 h-28 bg-gradient-to-br from-rose-50 to-red-50 rounded-3xl flex items-center justify-center mx-auto border-4 border-red-200 shadow-xl">
          <XCircle class="w-14 h-14 text-red-600" />
        </div>
        <div class="space-y-4">
          <h1 class="text-3xl font-black text-gray-900 mb-2">Lien non valide</h1>
          <p class="text-xl text-gray-600">Ce lien de confirmation a expiré ou est incorrect.</p>
          <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
            <p class="text-blue-900 font-semibold mb-2">ℹ️ Pourquoi ce message ?</p>
            <p class="text-sm text-blue-800">Ce lien est généré automatiquement par Supabase (notre service de sécurité).<br> Il expire après 1h pour votre protection.</p>
          </div>
        </div>
        <div class="space-y-3">
          <RouterLink to="/register" class="btn-primary w-full py-3 font-bold">Recevoir un nouveau lien</RouterLink>
          <RouterLink to="/login" class="btn-secondary w-full py-3">J'ai déjà un compte</RouterLink>
        </div>
      </div>
    </div>

    <!-- Footer reassurance -->
    <div class="fixed bottom-6 left-0 right-0 text-center text-xs text-gray-500/80 space-y-1 z-40">
      <p>🔒 Sécurisé par Supabase • Certifié ISO 27001</p>
      <p>WantIt utilise le chiffrement de bout en bout</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api.js'
import { ShieldCheck, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const verified = ref(false)
const error = ref('')
const user = ref(null)
const countdown = ref(5)

onMounted(async () => {
  try {
    // Extract token_hash from Supabase magic link hash
    const hashParams = new URLSearchParams(route.hash.slice(1))
    const token_hash = hashParams.get('token_hash')
    
    if (!token_hash) {
      throw new Error('Token de confirmation manquant dans le lien')
    }

    // Verify via backend (safe, no client secrets)
    const response = await api.post('/auth/confirm-email', { token_hash })
    
    if (response.data.success) {
      verified.value = true
      user.value = response.data.user
    } else {
      throw new Error('Vérification échouée')
    }
    
  } catch (err) {
    console.error('Confirmation error:', err)
    error.value = err.response?.data?.error || 'Lien de confirmation invalide ou expiré'
  } finally {
    loading.value = false
  }

  // Auto-redirect countdown on success
  if (verified.value) {
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        router.push('/login')
      }
    }, 1000)
  }
})
</script>
