<template>
  <div class="card p-4 space-y-4">
    <h3 class="font-bold text-gray-900">Filtres</h3>

    <!-- Marque -->
    <div>
      <label class="label">Marque</label>
      <input v-model="local.brand" type="text" placeholder="Ex: Nike, Apple..." class="input" />
    </div>

    <!-- Prix -->
    <div>
      <label class="label">Budget</label>
      <div class="flex gap-2 items-center">
        <input v-model="local.min_price" type="number" placeholder="Min" class="input" min="0" />
        <span class="text-gray-400 shrink-0">–</span>
        <input v-model="local.max_price" type="number" placeholder="Max" class="input" min="0" />
      </div>
    </div>

    <!-- État -->
    <div>
      <label class="label">État</label>
      <div class="space-y-2">
        <label v-for="c in CONDITIONS" :key="c.value" class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" v-model="local.conditions" :value="c.value" class="rounded text-primary-600 focus:ring-primary-500" />
          {{ c.label }}
        </label>
      </div>
    </div>

    <!-- Urgent -->
    <label class="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" v-model="local.is_urgent" class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4" />
      <span class="text-sm font-medium text-gray-700">Urgent uniquement</span>
    </label>

    <!-- Actions -->
    <div class="flex gap-2 pt-2">
      <button class="btn-primary flex-1" @click="applyFilters">Appliquer</button>
      <button class="btn-secondary" @click="resetFilters">Effacer</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['filter'])

const CONDITIONS = [
  { value: 'new_with_tags',    label: 'Neuf avec étiquette' },
  { value: 'new_without_tags', label: 'Neuf sans étiquette' },
  { value: 'very_good',        label: 'Très bon état' },
  { value: 'good',             label: 'Bon état' },
  { value: 'fair',             label: 'État correct' }
]

const local = reactive({
  brand: '',
  min_price: '',
  max_price: '',
  conditions: [],
  is_urgent: false
})

function applyFilters() {
  const filters = {}
  if (local.brand)            filters.brand     = local.brand
  if (local.min_price)        filters.min_price = local.min_price
  if (local.max_price)        filters.max_price = local.max_price
  if (local.conditions.length) filters.condition = local.conditions.join(',')
  if (local.is_urgent)        filters.is_urgent = 'true'
  emit('filter', filters)
}

function resetFilters() {
  Object.assign(local, { brand: '', min_price: '', max_price: '', conditions: [], is_urgent: false })
  emit('filter', {})
}
</script>
