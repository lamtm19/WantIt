<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Paramètres du compte</h1>

    <!-- Infos profil -->
    <div class="card p-6 mb-4">
      <h2 class="font-bold text-gray-900 mb-4">Informations du profil</h2>
      <form @submit.prevent="saveProfile" class="space-y-4">
        <div>
          <label class="label">Pseudo</label>
          <input v-model="profile.username" type="text" class="input" required minlength="3" maxlength="30" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Ville</label>
            <input v-model="profile.city" type="text" class="input" />
          </div>
          <div>
            <label class="label">Code postal</label>
            <input v-model="profile.postal_code" type="text" class="input" />
          </div>
        </div>
        <div>
          <label class="label">Région</label>
          <input v-model="profile.region" type="text" class="input" />
        </div>
        <button type="submit" class="btn-primary" :disabled="profileLoading">
          <Loader v-if="profileLoading" class="w-4 h-4 animate-spin" />
          <span v-else>Enregistrer</span>
        </button>
      </form>
    </div>

    <!-- Mot de passe -->
    <div class="card p-6 mb-4">
      <h2 class="font-bold text-gray-900 mb-4">Changer le mot de passe</h2>
      <form @submit.prevent="savePassword" class="space-y-4">
        <div>
          <label class="label">Mot de passe actuel</label>
          <input v-model="pwd.current" type="password" class="input" required />
        </div>
        <div>
          <label class="label">Nouveau mot de passe</label>
          <input v-model="pwd.new" type="password" class="input" required minlength="8" />
        </div>
        <div>
          <label class="label">Confirmer le nouveau mot de passe</label>
          <input v-model="pwd.confirm" type="password" class="input" required />
          <p v-if="pwd.confirm && pwd.new !== pwd.confirm" class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
        </div>
        <p v-if="pwdError" class="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{{ pwdError }}</p>
        <p v-if="pwdSuccess" class="text-sm text-green-600 bg-green-50 p-3 rounded-xl">Mot de passe mis à jour !</p>
        <button type="submit" class="btn-primary" :disabled="pwdLoading || pwd.new !== pwd.confirm">
          <Loader v-if="pwdLoading" class="w-4 h-4 animate-spin" />
          <span v-else>Mettre à jour</span>
        </button>
      </form>
    </div>

    <!-- Zone dangereuse -->
    <div class="card p-6 border-red-200 border-2">
      <h2 class="font-bold text-red-600 mb-2">Zone dangereuse</h2>
      <p class="text-sm text-gray-500 mb-4">La suppression de votre compte est définitive et irréversible.</p>
      <button @click="showDeleteModal = true" class="btn-danger btn-sm">Supprimer mon compte</button>
    </div>

    <ConfirmModal
      v-model="showDeleteModal"
      title="Supprimer le compte"
      message="Toutes vos données seront définitivement supprimées. Êtes-vous certain ?"
      confirm-label="Supprimer définitivement"
      danger
      @confirm="handleDeleteAccount"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import api from '@/services/api'

const auth  = useAuthStore()
const toast = useToast()

const profile = reactive({
  username:    auth.profile?.username || '',
  city:        auth.profile?.city || '',
  postal_code: auth.profile?.postal_code || '',
  region:      auth.profile?.region || ''
})

const pwd = reactive({ current: '', new: '', confirm: '' })
const profileLoading  = ref(false)
const pwdLoading      = ref(false)
const pwdError        = ref('')
const pwdSuccess      = ref(false)
const showDeleteModal = ref(false)

async function saveProfile() {
  profileLoading.value = true
  try {
    await auth.updateProfile({ username: profile.username, city: profile.city, postal_code: profile.postal_code, region: profile.region })
    toast.success('Profil mis à jour !')
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur')
  } finally {
    profileLoading.value = false
  }
}

async function savePassword() {
  if (pwd.new !== pwd.confirm) return
  pwdLoading.value = true
  pwdError.value   = ''
  pwdSuccess.value = false
  try {
    await api.put('/api/auth/change-password', { current_password: pwd.current, new_password: pwd.new })
    pwdSuccess.value = true
    pwd.current = pwd.new = pwd.confirm = ''
  } catch (err) {
    pwdError.value = err.response?.data?.error || 'Erreur'
  } finally {
    pwdLoading.value = false
  }
}

async function handleDeleteAccount() {
  try {
    await api.delete('/api/auth/account')
    await auth.logout()
  } catch { toast.error('Erreur lors de la suppression') }
}
</script>
