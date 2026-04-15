<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">

        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2 shrink-0">
          <span class="text-2xl font-black text-primary-600">WantIt</span>
        </RouterLink>

        <!-- Barre de recherche (desktop) -->
        <div class="hidden md:flex flex-1 max-w-lg">
          <div class="relative w-full">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Rechercher un besoin..."
              class="input pl-10 py-2"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <!-- Publier une recherche -->
          <RouterLink
            v-if="auth.isAuthenticated"
            to="/listings/create"
            class="btn-primary btn-sm hidden sm:inline-flex"
          >
            <Plus class="w-4 h-4" />
            <span>Publier</span>
          </RouterLink>

          <!-- Messages -->
          <RouterLink
            v-if="auth.isAuthenticated"
            to="/messages"
            class="relative p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <MessageSquare class="w-5 h-5 text-gray-600" />
            <span
              v-if="convStore.unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
            >
              {{ convStore.unreadCount > 9 ? '9+' : convStore.unreadCount }}
            </span>
          </RouterLink>

          <!-- Menu utilisateur -->
          <div v-if="auth.isAuthenticated" class="relative" ref="menuRef">
            <button
              @click="menuOpen = !menuOpen"
              class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition"
            >
              <UserAvatar :profile="auth.profile" size="sm" />
              <ChevronDown class="w-4 h-4 text-gray-500" />
            </button>

            <Transition name="slide-up">
              <div
                v-if="menuOpen"
                class="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50"
              >
                <div class="px-4 py-2 border-b border-gray-50">
                  <p class="font-semibold text-sm text-gray-900">{{ auth.profile?.username }}</p>
                  <p class="text-xs text-gray-500">{{ auth.profile?.city || auth.profile?.region }}</p>
                </div>

                <RouterLink to="/profile" class="menu-item" @click="menuOpen = false">
                  <User class="w-4 h-4" /> Mon profil
                </RouterLink>
                <RouterLink to="/my-listings" class="menu-item" @click="menuOpen = false">
                  <List class="w-4 h-4" /> Mes annonces
                </RouterLink>
                <RouterLink to="/profile/settings" class="menu-item" @click="menuOpen = false">
                  <Settings class="w-4 h-4" /> Paramètres
                </RouterLink>

                <div v-if="auth.isAdmin" class="border-t border-gray-50 mt-1">
                  <RouterLink to="/admin" class="menu-item text-primary-600" @click="menuOpen = false">
                    <Shield class="w-4 h-4" /> Administration
                  </RouterLink>
                </div>

                <div class="border-t border-gray-50 mt-1">
                  <button @click="handleLogout" class="menu-item w-full text-red-500">
                    <LogOut class="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Connexion / Inscription -->
          <template v-else>
            <RouterLink to="/login" class="btn-secondary btn-sm">Connexion</RouterLink>
            <RouterLink to="/register" class="btn-primary btn-sm hidden sm:inline-flex">Inscription</RouterLink>
          </template>
        </div>
      </div>
    </div>

    <!-- Barre de recherche mobile -->
    <div class="md:hidden px-4 pb-3">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher..."
          class="input pl-10 py-2"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import {
  Search, Plus, MessageSquare, User, List, Settings,
  Shield, LogOut, ChevronDown
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversations'
import UserAvatar from './UserAvatar.vue'

const auth      = useAuthStore()
const convStore = useConversationStore()
const router    = useRouter()

const menuOpen   = ref(false)
const menuRef    = ref(null)
const searchQuery = ref('')

onClickOutside(menuRef, () => { menuOpen.value = false })

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/', query: { q: searchQuery.value.trim() } })
  }
}

async function handleLogout() {
  menuOpen.value = false
  await auth.logout()
}
</script>

<style scoped>
.menu-item {
  @apply flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition cursor-pointer;
}
</style>
