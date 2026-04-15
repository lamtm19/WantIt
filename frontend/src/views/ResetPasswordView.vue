<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-black text-primary-600">WantIt</RouterLink>
      </div>
      <div class="card p-8">
        <h2 class="font-bold text-xl mb-4">Nouveau mot de passe</h2>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="label">Nouveau mot de passe</label>
            <input v-model="password" type="password" class="input" placeholder="Minimum 8 caractères" required minlength="8" />
          </div>
          <div>
            <label class="label">Confirmer</label>
            <input v-model="confirm" type="password" class="input" required />
            <p v-if="confirm && password !== confirm" class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
          </div>
          <p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{{ error }}</p>
          <p v-if="success" class="text-sm text-green-600 bg-green-50 p-3 rounded-xl">Mot de passe mis à jour ! <RouterLink to="/login" class="underline">Se connecter</RouterLink></p>
          <button type="submit" class="btn-primary w-full" :disabled="loading || password !== confirm">
            <Loader v-if="loading" class="w-4 h-4 animate-spin" />
            <span v-else>Mettre à jour</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Loader } from 'lucide-vue-next'
import api from '@/services/api'

const route   = useRoute()
const password = ref('')
const confirm  = ref('')
const loading  = ref(false)
const error    = ref('')
const success  = ref(false)

async function handleSubmit() {
  if (password.value !== confirm.value) return
  loading.value = true
  error.value   = ''
  try {
    await api.post('/api/auth/reset-password', {
      password: password.value,
      access_token: route.hash.replace('#access_token=', '').split('&')[0]
    })
    success.value = true
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la réinitialisation'
  } finally {
    loading.value = false
  }
}
</script>
