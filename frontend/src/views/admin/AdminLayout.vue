<template>
  <div class="flex min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-60 bg-white border-r border-gray-100 shrink-0 hidden md:flex flex-col">
      <div class="p-5 border-b border-gray-100">
        <p class="font-black text-primary-600 text-lg">WantIt Admin</p>
      </div>
      <nav class="flex-1 p-3 space-y-0.5">
        <RouterLink
          v-for="item in NAV"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
          :class="$route.path === item.path ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
          <span v-if="item.badge" class="ml-auto badge badge-red">{{ item.badge }}</span>
        </RouterLink>
      </nav>
      <div class="p-3 border-t border-gray-100">
        <RouterLink to="/" class="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft class="w-4 h-4" /> Retour au site
        </RouterLink>
      </div>
    </aside>

    <!-- Contenu -->
    <div class="flex-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft, LayoutDashboard, Users, Package, Flag, Tag, Bookmark, Ban, MessageSquare } from 'lucide-vue-next'

const NAV = [
  { path: '/admin/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { path: '/admin/users',          label: 'Utilisateurs',   icon: Users },
  { path: '/admin/listings',       label: 'Annonces',       icon: Package },
  { path: '/admin/reports',        label: 'Signalements',   icon: Flag },
  { path: '/admin/conversations',  label: 'Conversations',  icon: MessageSquare },
  { path: '/admin/categories',     label: 'Catégories',     icon: Tag },
  { path: '/admin/brands',         label: 'Marques',        icon: Bookmark },
  { path: '/admin/words',          label: 'Mots interdits', icon: Ban }
]
</script>
