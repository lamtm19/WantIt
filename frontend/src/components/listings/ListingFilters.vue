<template>
  <div class="panel-soft p-4 space-y-4">
    <div>
      <h3 class="text-xl font-extrabold tracking-[-0.05em] text-neutral-900">Affinez la sélection</h3>
    </div>

    <div>
      <label class="label">Marque</label>
      <input v-model="local.brand" type="text" placeholder="Ex: Nike, Apple..." class="input" />
    </div>

    <div>
      <label class="label">Budget</label>
      <div class="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <input v-model="local.min_price" type="number" placeholder="Min" class="input" min="0" />
        <span class="text-gray-300 text-lg">—</span>
        <input v-model="local.max_price" type="number" placeholder="Max" class="input" min="0" />
      </div>
    </div>

    <div>
      <label class="label">État</label>
      <div class="grid gap-2">
        <label
          v-for="c in CONDITIONS"
          :key="c.value"
          class="flex items-center gap-3 rounded-[1.2rem] bg-white/80 px-4 py-2.5 text-sm text-neutral-700 cursor-pointer transition hover:bg-white"
        >
          <input type="checkbox" v-model="local.conditions" :value="c.value" class="rounded text-primary-600 focus:ring-primary-500" />
          <span>{{ c.label }}</span>
        </label>
      </div>
    </div>

    <label class="flex items-center gap-3 rounded-[1.2rem] bg-neutral-900 px-4 py-2.5 cursor-pointer text-white">
      <input type="checkbox" v-model="local.is_urgent" class="rounded text-primary-600 focus:ring-primary-500 w-4 h-4" />
      <span class="text-sm font-medium">Urgent uniquement</span>
    </label>

    <div class="flex gap-2 pt-1">
      <button class="btn-primary flex-1" @click="applyFilters">Appliquer</button>
      <button class="btn-secondary" @click="resetFilters">Effacer</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const emit = defineEmits(['filter'])

const CONDITIONS = [
  { value: 'new_with_tags', label: 'Neuf avec étiquette' },
  { value: 'new_without_tags', label: 'Neuf sans étiquette' },
  { value: 'very_good', label: 'Très bon état' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
]

const local = reactive({
  brand: '',
  min_price: '',
  max_price: '',
  conditions: [],
  is_urgent: false,
})

function applyFilters() {
  const filters = {}
  if (local.brand) filters.brand = local.brand
  if (local.min_price) filters.min_price = local.min_price
  if (local.max_price) filters.max_price = local.max_price
  if (local.conditions.length) filters.condition = local.conditions.join(',')
  if (local.is_urgent) filters.is_urgent = 'true'
  emit('filter', filters)
}

function resetFilters() {
  Object.assign(local, { brand: '', min_price: '', max_price: '', conditions: [], is_urgent: false })
  emit('filter', {})
}
</script>
