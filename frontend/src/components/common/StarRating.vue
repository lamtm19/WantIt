<template>
  <div class="flex items-center gap-0.5">
    <Star
      v-for="i in 5"
      :key="i"
      :class="[
        'transition',
        i <= (interactive ? hovered || modelValue : modelValue)
          ? 'text-amber-400 fill-amber-400'
          : 'text-gray-200 fill-gray-200',
        interactive ? 'cursor-pointer w-6 h-6' : sizeClass
      ]"
      @click="interactive && emit('update:modelValue', i)"
      @mouseenter="interactive && (hovered = i)"
      @mouseleave="interactive && (hovered = 0)"
    />
    <span v-if="showLabel && modelValue" class="ml-1 text-sm text-gray-600 font-medium">
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Star } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  interactive: { type: Boolean, default: false },
  showLabel:   { type: Boolean, default: false },
  size:        { type: String, default: 'sm' }
})
const emit = defineEmits(['update:modelValue'])

const hovered = ref(0)
const sizeClass = props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
</script>
