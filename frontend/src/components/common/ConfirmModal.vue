<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40" @click.self="$emit('update:modelValue', false)">
        <div class="card p-6 w-full max-w-sm">
          <h3 class="font-bold text-lg text-gray-900 mb-2">{{ title }}</h3>
          <p class="text-gray-600 text-sm mb-6">{{ message }}</p>
          <div class="flex gap-3 justify-end">
            <button class="btn-secondary" @click="$emit('update:modelValue', false)">Annuler</button>
            <button :class="dangerClass" @click="handleConfirm">{{ confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  title:        { type: String, default: 'Confirmation' },
  message:      { type: String, default: 'Êtes-vous sûr ?' },
  confirmLabel: { type: String, default: 'Confirmer' },
  danger:       { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const dangerClass = computed(() => props.danger ? 'btn-danger' : 'btn-primary')

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
