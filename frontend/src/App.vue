<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1 relative">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/50 to-transparent -z-10" />
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversations'
import { onSocketConnect } from '@/services/socket'
import Navbar from '@/components/common/Navbar.vue'
import AppFooter from '@/components/common/AppFooter.vue'

const auth  = useAuthStore()
const convStore = useConversationStore()

// Enregistrer une seule fois un callback qui s'exécute à chaque (re)connexion socket
// Cela garantit que le listener survit aux reconnexions
onSocketConnect((socket) => {
  // Refetch au (re)connect pour rattraper les notifications manquées pendant la déco
  if (auth.isAuthenticated) convStore.fetchUnreadCount()

  socket.off('notification:message')
  socket.on('notification:message', () => {
    convStore.fetchUnreadCount()
  })
})

async function initForAuthUser() {
  await auth.refreshProfile()
  await convStore.fetchUnreadCount()
}

onMounted(async () => {
  if (auth.isAuthenticated) {
    await initForAuthUser()
  }
})

// Recharger le compteur après login
watch(() => auth.isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await initForAuthUser()
  }
})
</script>
