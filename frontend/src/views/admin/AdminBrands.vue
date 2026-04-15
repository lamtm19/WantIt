<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Marques</h1>

    <div class="flex gap-2 mb-6">
      <button @click="filter = ''" :class="['btn-sm', filter === '' ? 'btn-primary' : 'btn-secondary']">Toutes</button>
      <button @click="filter = 'true'" :class="['btn-sm', filter === 'true' ? 'btn-primary' : 'btn-secondary']">Approuvées</button>
      <button @click="filter = 'false'" :class="['btn-sm', filter === 'false' ? 'btn-primary' : 'btn-secondary']">En attente</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="px-4 py-3 text-left">Nom</th>
            <th class="px-4 py-3 text-left">Statut</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="brand in filteredBrands" :key="brand.id">
            <td class="px-4 py-3 font-medium">{{ brand.name }}</td>
            <td class="px-4 py-3">
              <span :class="brand.is_approved ? 'badge-green' : 'badge-orange'" class="badge">
                {{ brand.is_approved ? 'Approuvée' : 'En attente' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right flex justify-end gap-2">
              <button v-if="!brand.is_approved" @click="approve(brand)" class="btn-primary btn-sm text-xs">Approuver</button>
              <button @click="remove(brand)" class="btn-secondary btn-sm text-xs text-red-500">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!filteredBrands.length" class="p-8 text-center text-gray-400">Aucune marque</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const brands = ref([])
const filter = ref('')

const filteredBrands = computed(() => {
  if (filter.value === 'true')  return brands.value.filter(b => b.is_approved)
  if (filter.value === 'false') return brands.value.filter(b => !b.is_approved)
  return brands.value
})

async function load() {
  const res = await api.get('/api/admin/brands', { params: filter.value ? { approved: filter.value } : {} })
  brands.value = res.data.data || []
}

onMounted(load)
watch(filter, load)

async function approve(brand) {
  await api.patch(`/api/admin/brands/${brand.id}/approve`)
  toast.success('Marque approuvée')
  await load()
}

async function remove(brand) {
  if (!confirm(`Supprimer la marque "${brand.name}" ?`)) return
  await api.delete(`/api/admin/brands/${brand.id}`)
  toast.success('Marque supprimée')
  await load()
}
</script>
