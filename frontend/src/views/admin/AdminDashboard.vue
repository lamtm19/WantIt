<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Dashboard</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-5">
        <Users class="w-6 h-6 text-primary-500 mb-2" />
        <p class="text-3xl font-black text-gray-900">{{ statsData.total_users }}</p>
        <p class="text-sm text-gray-500 mt-1">Utilisateurs</p>
      </div>
      <div class="card p-5">
        <Package class="w-6 h-6 text-primary-500 mb-2" />
        <p class="text-3xl font-black text-gray-900">{{ statsData.total_listings }}</p>
        <p class="text-sm text-gray-500 mt-1">Annonces</p>
      </div>
      <div class="card p-5">
        <Flag class="w-6 h-6 text-red-400 mb-2" />
        <p class="text-3xl font-black text-gray-900">{{ statsData.pending_reports }}</p>
        <p class="text-sm text-gray-500 mt-1">Signalements</p>
      </div>
      <div class="card p-5">
        <MessageSquare class="w-6 h-6 text-primary-500 mb-2" />
        <p class="text-3xl font-black text-gray-900">{{ statsData.total_conversations }}</p>
        <p class="text-sm text-gray-500 mt-1">Conversations</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Signalements en attente -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-900">Signalements en attente</h2>
          <RouterLink to="/admin/reports" class="text-sm text-primary-600 hover:underline">Voir tout</RouterLink>
        </div>
        <div v-if="reports.length" class="space-y-2">
          <div v-for="r in reports" :key="r.id" class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ r.reason }}</p>
              <p class="text-xs text-gray-500">Par <strong>{{ r.reporter?.username }}</strong> · <span class="capitalize">{{ r.type }}</span></p>
            </div>
            <RouterLink to="/admin/reports" class="badge badge-orange shrink-0">Traiter</RouterLink>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-4">Aucun signalement en attente ✓</p>
      </div>

      <!-- Accès rapides -->
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4">Accès rapides</h2>
        <div class="grid grid-cols-2 gap-3">
          <RouterLink to="/admin/users"      class="quick-link"><Users       class="w-4 h-4 text-primary-500" /> Utilisateurs</RouterLink>
          <RouterLink to="/admin/reports"    class="quick-link"><Flag        class="w-4 h-4 text-red-400" />    Signalements</RouterLink>
          <RouterLink to="/admin/categories" class="quick-link"><Tag         class="w-4 h-4 text-primary-500" /> Catégories</RouterLink>
          <RouterLink to="/admin/words"      class="quick-link"><Ban         class="w-4 h-4 text-primary-500" /> Mots interdits</RouterLink>
          <RouterLink to="/admin/brands"     class="quick-link"><Bookmark    class="w-4 h-4 text-primary-500" /> Marques</RouterLink>
          <RouterLink to="/admin/conversations" class="quick-link"><MessageSquare class="w-4 h-4 text-primary-500" /> Conversations</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Users, Package, Flag, MessageSquare, Tag, Bookmark, Ban } from 'lucide-vue-next'
import api from '@/services/api'

const statsData = ref({ total_users: 0, total_listings: 0, pending_reports: 0, total_conversations: 0 })
const reports   = ref([])

onMounted(async () => {
  const [statsRes, reportsRes] = await Promise.all([
    api.get('/api/admin/stats'),
    api.get('/api/admin/reports', { params: { limit: 5 } })
  ])
  statsData.value = statsRes.data
  reports.value   = reportsRes.data.data || []
})
</script>

<style scoped>
.quick-link {
  @apply p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition text-sm font-medium text-gray-700 flex items-center gap-2;
}
</style>
