<template>
  <RouterLink
    :to="`/listings/${listing.id}`"
    class="card block group overflow-hidden p-2.5 transition-transform duration-300 hover:-translate-y-1"
  >
    <div class="aspect-[4/4.7] bg-neutral-100 rounded-[1.6rem] overflow-hidden relative">
      <img
        v-if="firstImage"
        :src="firstImage"
        :alt="listing.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
        <ImageOff class="w-12 h-12" />
      </div>

      <div class="absolute top-2.5 left-2.5 flex gap-2 flex-wrap">
        <span v-if="listing.is_urgent" class="badge bg-white/90 text-neutral-900">
          <Zap class="w-3 h-3" /> Urgent
        </span>
        <span v-if="listing.status !== 'active'" :class="statusBadge">
          {{ statusLabel }}
        </span>
      </div>
    </div>

    <div class="px-2 pb-2 pt-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p v-if="listing.categories" class="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            {{ listing.categories.name }}
          </p>
          <h3 class="mt-1 text-lg leading-tight font-extrabold tracking-[-0.05em] text-neutral-950">
            {{ listing.title }}
          </h3>
        </div>
        <span class="text-xs text-neutral-400 shrink-0">{{ timeAgo(listing.created_at) }}</span>
      </div>

      <p class="mt-2.5 text-base font-bold tracking-[-0.04em] text-primary-700">
        {{ formatPrice(listing.price_min, listing.price_max) }}
      </p>

      <div class="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
        <MapPin class="w-4 h-4 shrink-0" />
        <span class="truncate">{{ locationLabel }}</span>
        <span v-if="listing.max_distance_km" class="shrink-0">· {{ listing.max_distance_km }} km</span>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span v-for="c in (listing.conditions || []).slice(0, 1)" :key="c" class="badge badge-gray text-xs">
          {{ conditionLabel(c) }}
        </span>
        <span v-if="(listing.conditions || []).length > 1" class="badge badge-gray text-xs">
          +{{ listing.conditions.length - 1 }}
        </span>
        <span v-for="b in brands.slice(0, 2)" :key="b" class="badge bg-neutral-100 text-neutral-700 text-xs">
          {{ b }}
        </span>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-full bg-neutral-100 px-3.5 py-2.5">
        <template v-if="listing.profiles">
          <div class="flex items-center gap-2 min-w-0">
            <UserAvatar :profile="listing.profiles" size="xs" />
            <span class="text-sm text-neutral-600 truncate">{{ listing.profiles.username }}</span>
          </div>
        </template>
        <template v-else>
          <span class="text-sm text-neutral-500">Annonce WantIt</span>
        </template>
        <span class="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Voir</span>
      </div>
    </div>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { ImageOff, MapPin, Zap } from 'lucide-vue-next'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  listing: { type: Object, required: true },
})

const firstImage = computed(() => {
  const imgs = props.listing.listing_images || []
  return imgs.sort((a, b) => a.sort_order - b.sort_order)[0]?.url || null
})

const brands = computed(() =>
  (props.listing.listing_brands || []).map((b) => b.brand_name).filter(Boolean),
)

const locationLabel = computed(() => {
  const l = props.listing
  if (l.city && l.postal_code) return `${l.city} (${l.postal_code})`
  return l.region || l.city || 'France'
})

const statusBadge = computed(() => ({
  found: 'badge bg-neutral-900 text-white',
  cancelled: 'badge bg-neutral-300 text-neutral-700',
}[props.listing.status] || ''))

const statusLabel = computed(() => ({
  found: 'Trouvé',
  cancelled: 'Annulé',
}[props.listing.status] || ''))

function formatPrice(min, max) {
  if (min === max || !max) return `${min} €`
  return `${min} – ${max} €`
}

function conditionLabel(c) {
  return {
    new_with_tags: 'Neuf avec étiquette',
    new_without_tags: 'Neuf sans étiquette',
    very_good: 'Très bon état',
    good: 'Bon état',
    fair: 'État correct',
  }[c] || c
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
}
</script>
