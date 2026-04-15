<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Utilisateurs</h1>

    <!-- Recherche -->
    <div class="flex gap-3 mb-6">
      <input v-model="search" type="search" class="input max-w-xs" placeholder="Rechercher un pseudo..." @keyup.enter="load" />
      <select v-model="filterBanned" class="input max-w-[180px]" @change="load">
        <option value="">Tous</option>
        <option value="false">Actifs</option>
        <option value="true">Bannis</option>
      </select>
      <button class="btn-primary btn-sm" @click="load">Rechercher</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Utilisateur</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Localisation</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Inscrit</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
            <th class="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                  {{ user.username.slice(0,2).toUpperCase() }}
                </div>
                <div>
                  <p class="font-medium">{{ user.username }}</p>
                  <p class="text-xs text-gray-400">{{ user.id.slice(0,8) }}...</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ user.city || user.region || '—' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ new Date(user.created_at).toLocaleDateString('fr-FR') }}</td>
            <td class="px-4 py-3">
              <span v-if="user.is_admin" class="badge bg-purple-100 text-purple-700">Admin</span>
              <span v-else-if="user.is_banned" class="badge badge-red">Banni</span>
              <span v-else class="badge badge-green">Actif</span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button v-if="!user.is_banned && !user.is_admin" @click="banUser(user)" class="btn-secondary btn-sm text-xs text-red-500">Bannir</button>
                <button v-if="user.is_banned" @click="unbanUser(user)" class="btn-primary btn-sm text-xs">Débannir</button>
                <button @click="deleteUser(user)" class="btn-secondary btn-sm text-xs text-red-600">Supprimer</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-8 text-center text-gray-400">
        <Loader class="w-6 h-6 animate-spin mx-auto" />
      </div>
      <div v-else-if="!users.length" class="p-8 text-center text-gray-400">Aucun utilisateur trouvé</div>
    </div>

    <!-- Pagination -->
    <div class="flex justify-center gap-2 mt-4">
      <button class="btn-secondary btn-sm" :disabled="page === 1" @click="page--; load()">← Précédent</button>
      <span class="px-3 py-1.5 text-sm text-gray-600">Page {{ page }}</span>
      <button class="btn-secondary btn-sm" :disabled="users.length < 20" @click="page++; load()">Suivant →</button>
    </div>

    <!-- Modal ban -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showBanModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showBanModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-4">Bannir {{ toBan?.username }}</h3>
            <textarea v-model="banReason" class="input resize-none mb-4" rows="2" placeholder="Raison du bannissement..." />
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showBanModal = false">Annuler</button>
              <button class="btn-danger flex-1" @click="confirmBan">Bannir</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const users       = ref([])
const loading     = ref(true)
const search      = ref('')
const filterBanned = ref('')
const page        = ref(1)
const showBanModal = ref(false)
const toBan       = ref(null)
const banReason   = ref('')

async function load() {
  loading.value = true
  const res = await api.get('/api/admin/users', {
    params: { page: page.value, search: search.value, is_banned: filterBanned.value }
  })
  users.value   = res.data.data || []
  loading.value = false
}

onMounted(load)

function banUser(user) { toBan.value = user; showBanModal.value = true }

async function confirmBan() {
  try {
    await api.patch(`/api/admin/users/${toBan.value.id}/ban`, { reason: banReason.value })
    showBanModal.value = false
    banReason.value = ''
    toast.success(`${toBan.value.username} banni`)
    await load()
  } catch { toast.error('Erreur') }
}

async function unbanUser(user) {
  await api.patch(`/api/admin/users/${user.id}/unban`)
  toast.success(`${user.username} débanni`)
  await load()
}

async function deleteUser(user) {
  if (!confirm(`Supprimer définitivement ${user.username} ?`)) return
  await api.delete(`/api/admin/users/${user.id}`)
  toast.success('Utilisateur supprimé')
  await load()
}
</script>
