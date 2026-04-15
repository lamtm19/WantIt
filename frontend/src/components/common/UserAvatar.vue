<template>
  <div
    :class="[
      'rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0 font-bold text-primary-700',
      sizeClasses
    ]"
  >
    <img v-if="profile?.avatar_url" :src="profile.avatar_url" :alt="profile.username" class="w-full h-full object-cover" />
    <span v-else>{{ initials }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  profile: Object,
  size: { type: String, default: 'md' }
})

const sizeClasses = computed(() => ({
  xs:  'w-7 h-7 text-xs',
  sm:  'w-9 h-9 text-sm',
  md:  'w-11 h-11 text-base',
  lg:  'w-16 h-16 text-xl',
  xl:  'w-24 h-24 text-3xl'
}[props.size] || 'w-11 h-11 text-base'))

const initials = computed(() => {
  const name = props.profile?.username || '?'
  return name.slice(0, 2).toUpperCase()
})
</script>
