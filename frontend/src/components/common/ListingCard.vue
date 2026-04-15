<template>
  <RouterLink :to="`/listings/${listing.id}`" class="card block hover:shadow-md transition-shadow group">
    <!-- Image -->
    <div class="aspect-[4/3] bg-gray-100 rounded-t-2xl overflow-hidden relative">
      <img
        v-if="firstImage"
        :src="firstImage"
        :alt="listing.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
        <ImageOff class="w-12 h-12" />
      </div>

      <!-- Badges -->
      <div class="absolute top-2 left-2 flex gap-1 flex-wrap">
        <span v-if="listing.is_urgent" class="badge bg-red-500 text-white">
          <Zap class="w-3 h-3" /> Urgent
        </span>
        <span v-if="listing.status !== 'active'" :class="statusBadge">
          {{ statusLabel }}
        </span>
      </div>
    </div>

    <!-- Contenu -->
    <div class="p-3">
      <h3 class="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
        {{ listing.title }}
      </h3>

      <!-- Prix -->
      <p class="mt-1 text-primary-600 font-bold">
        {{ formatPrice(listing.price_min, listing.price_max) }}
      </p>

      <!-- Localisation + distance -->
      <div class="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
        <MapPin class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ locationLabel }}</span>
        <span v-if="listing.max_distance_km" class="shrink-0">· {{ listing.max_distance_km }}km max</span>
      </div>

      <!-- Catégorie + état -->
      <div class="flex items-center gap-1 mt-2 flex-wrap">
        <span v-if="listing.categories" class="badge badge-gray text-xs">
          {{ listing.categories.name }}
        </span>
        <span v-for="c in (listing.conditions || []).slice(0, 1)" :key="c" class="badge badge-green text-xs">
          {{ conditionLabel(c) }}
        </span>
        <span v-if="(listing.conditions || []).length > 1" class="badge badge-gray text-xs">
          +{{ listing.conditions.length - 1 }}
        </span>
      </div>

      <!-- Vendeur -->
      <div class="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
        <UserAvatar :profile="listing.profiles" size="xs" />
        <span class="text-xs text-gray-500 truncate">{{ listing.profiles?.username }}</span>
        <span class="ml-auto text-xs text-gray-400">{{ timeAgo(listing.created_at) }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { ImageOff, MapPin, Zap } from 'lucide-vue-next'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  listing: { type: Object, required: true }
})

const firstImage = computed(() => {
  const imgs = props.listing.listing_images || []
  return imgs.sort((a, b) => a.sort_order - b.sort_order)[0]?.url || null
})

const locationLabel = computed(() => {
  const l = props.listing
  if (l.city && l.postal_code) return `${l.city} (${l.postal_code})`
  return l.region || l.city || 'France'
})

const statusBadge = computed(() => ({
  found:     'badge bg-green-500 text-white',
  cancelled: 'badge bg-gray-400 text-white'
}[props.listing.status] || ''))

const statusLabel = computed(() => ({
  found:     'Trouvé',
  cancelled: 'Annulé'
}[props.listing.status] || ''))

function formatPrice(min, max) {
  if (min === max || !max) return `${min} €`
  return `${min} – ${max} €`
}

function conditionLabel(c) {
  return {
    new_with_tags:    'Neuf avec étiquette',
    new_without_tags: 'Neuf sans étiquette',
    very_good:        'Très bon état',
    good:             'Bon état',
    fair:             'État correct'
  }[c] || c
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
}
</script>
