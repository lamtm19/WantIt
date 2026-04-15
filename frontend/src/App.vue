<template>
  <div class="min-h-screen flex flex-col">
    <Navbar />
    <main class="flex-1">
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
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversations'
import { getSocket } from '@/services/socket'
import Navbar from '@/components/common/Navbar.vue'
import AppFooter from '@/components/common/AppFooter.vue'

const auth  = useAuthStore()
const convStore = useConversationStore()

onMounted(async () => {
  if (auth.isAuthenticated) {
    await auth.refreshProfile()
    await convStore.fetchUnreadCount()

    // Écouter les notifications socket
    const socket = getSocket()
    if (socket) {
      socket.on('notification:message', () => {
        convStore.fetchUnreadCount()
      })
    }
  }
})
</script>
