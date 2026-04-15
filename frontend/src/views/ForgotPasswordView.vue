<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-black text-primary-600">WantIt</RouterLink>
        <p class="text-gray-500 mt-2">Mot de passe oublié</p>
      </div>
      <div class="card p-8">
        <div v-if="sent" class="text-center">
          <CheckCircle class="w-12 h-12 text-primary-500 mx-auto mb-3" />
          <h3 class="font-bold text-lg mb-2">Email envoyé !</h3>
          <p class="text-gray-500 text-sm">Si un compte est associé à cet email, vous recevrez les instructions pour réinitialiser votre mot de passe.</p>
          <RouterLink to="/login" class="btn-primary mt-6 inline-flex">Retour à la connexion</RouterLink>
        </div>
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <p class="text-sm text-gray-500">Entrez votre email pour recevoir un lien de réinitialisation.</p>
          <div>
            <label class="label">Email</label>
            <input v-model="email" type="email" class="input" placeholder="vous@exemple.com" required />
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span v-else>Envoyer le lien</span>
          </button>
          <RouterLink to="/login" class="block text-center text-sm text-gray-500 hover:text-gray-700">← Retour</RouterLink>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CheckCircle, Loader } from 'lucide-vue-next'
import api from '@/services/api'

const email   = ref('')
const loading = ref(false)
const sent    = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await api.post('/api/auth/forgot-password', { email: email.value })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
