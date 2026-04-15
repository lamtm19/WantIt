<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Annonces</h1>

    <div class="flex gap-3 mb-6">
      <select v-model="filterStatus" class="input max-w-[180px]" @change="load">
        <option value="">Toutes</option>
        <option value="active">Actives</option>
        <option value="found">Trouvées</option>
        <option value="cancelled">Annulées</option>
      </select>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Titre</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Auteur</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Prix</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="listing in listings" :key="listing.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <RouterLink :to="`/listings/${listing.id}`" class="font-medium text-primary-600 hover:underline line-clamp-1">
                {{ listing.title }}
              </RouterLink>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ listing.profiles?.username }}</td>
            <td class="px-4 py-3 text-gray-600">{{ listing.price_min }} – {{ listing.price_max }} €</td>
            <td class="px-4 py-3">
              <span :class="['badge', { active: 'badge-green', found: 'badge-gray', cancelled: 'badge-red' }[listing.status]]">
                {{ listing.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ new Date(listing.created_at).toLocaleDateString('fr-FR') }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="deleteListing(listing)" class="btn-secondary btn-sm text-xs text-red-500">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="loading" class="p-8 text-center"><Loader class="w-5 h-5 animate-spin mx-auto text-gray-400" /></div>
      <div v-else-if="!listings.length" class="p-8 text-center text-gray-400">Aucune annonce</div>
    </div>

    <div class="flex justify-center gap-2 mt-4">
      <button class="btn-secondary btn-sm" :disabled="page === 1" @click="page--; load()">← Précédent</button>
      <span class="px-3 py-1.5 text-sm text-gray-600">Page {{ page }}</span>
      <button class="btn-secondary btn-sm" :disabled="listings.length < 20" @click="page++; load()">Suivant →</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const listings     = ref([])
const loading      = ref(true)
const filterStatus = ref('')
const page         = ref(1)

async function load() {
  loading.value = true
  const res = await api.get('/api/admin/listings', { params: { page: page.value, status: filterStatus.value } })
  listings.value = res.data.data || []
  loading.value  = false
}

onMounted(load)

async function deleteListing(listing) {
  if (!confirm(`Supprimer "${listing.title}" ?`)) return
  await api.delete(`/api/admin/listings/${listing.id}`)
  useToast().success('Annonce supprimée')
  await load()
}
</script>
