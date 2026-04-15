<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Catégories</h1>

    <!-- Formulaire ajout -->
    <div class="card p-5 mb-6">
      <h2 class="font-bold text-gray-900 mb-4">Ajouter une catégorie</h2>
      <div class="flex gap-3">
        <input v-model="newName" type="text" class="input flex-1" placeholder="Nom de la catégorie" />
        <input v-model="newIcon" type="text" class="input w-36" placeholder="Icône (lucide)" />
        <button class="btn-primary" @click="addCategory" :disabled="!newName.trim()">Ajouter</button>
      </div>
    </div>

    <!-- Liste -->
    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Nom</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Slug</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Ordre</th>
            <th class="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="cat in categories" :key="cat.id">
            <td class="px-4 py-3 font-medium">{{ cat.name }}</td>
            <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ cat.slug }}</td>
            <td class="px-4 py-3 text-gray-500">{{ cat.sort_order }}</td>
            <td class="px-4 py-3">
              <span :class="cat.is_active ? 'badge-green' : 'badge-red'" class="badge">
                {{ cat.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="toggleActive(cat)" class="btn-secondary btn-sm text-xs">
                {{ cat.is_active ? 'Désactiver' : 'Activer' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const categories = ref([])
const newName    = ref('')
const newIcon    = ref('')

async function load() {
  const res = await api.get('/api/admin/categories')
  categories.value = res.data.data || []
}

onMounted(load)

async function addCategory() {
  if (!newName.value.trim()) return
  await api.post('/api/admin/categories', { name: newName.value.trim(), icon: newIcon.value.trim() })
  toast.success('Catégorie ajoutée')
  newName.value = ''
  newIcon.value = ''
  await load()
}

async function toggleActive(cat) {
  await api.put(`/api/admin/categories/${cat.id}`, { is_active: !cat.is_active })
  await load()
}
</script>
