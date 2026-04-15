import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import { connectSocket, disconnectSocket } from '@/services/socket'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(JSON.parse(localStorage.getItem('wantit_user') || 'null'))
  const profile = ref(JSON.parse(localStorage.getItem('wantit_profile') || 'null'))
  const token   = ref(localStorage.getItem('wantit_token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin         = computed(() => profile.value?.is_admin || false)

  function setSession(data) {
    token.value   = data.session?.access_token || null
    user.value    = data.user  || data.session?.user || null
    profile.value = data.profile || null

    localStorage.setItem('wantit_token',   token.value || '')
    localStorage.setItem('wantit_user',    JSON.stringify(user.value))
    localStorage.setItem('wantit_profile', JSON.stringify(profile.value))
  }

  async function register(payload) {
    const res = await api.post('/api/auth/register', payload)
    setSession(res.data)
    connectSocket()
    return res.data
  }

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password })
    setSession(res.data)
    connectSocket()
    return res.data
  }

  async function logout() {
    try { await api.post('/api/auth/logout') } catch {}
    token.value   = null
    user.value    = null
    profile.value = null
    localStorage.removeItem('wantit_token')
    localStorage.removeItem('wantit_user')
    localStorage.removeItem('wantit_profile')
    disconnectSocket()
    router.push('/')
  }

  async function refreshProfile() {
    if (!token.value) return
    try {
      const res = await api.get('/api/auth/me')
      profile.value = res.data
      localStorage.setItem('wantit_profile', JSON.stringify(res.data))
    } catch {}
  }

  async function updateProfile(data) {
    const res = await api.put('/api/users/me', data)
    profile.value = { ...profile.value, ...res.data }
    localStorage.setItem('wantit_profile', JSON.stringify(profile.value))
    return res.data
  }

  async function uploadAvatar(base64, filename) {
    const res = await api.post('/api/users/me/avatar', { base64, filename })
    profile.value = { ...profile.value, avatar_url: res.data.avatar_url }
    localStorage.setItem('wantit_profile', JSON.stringify(profile.value))
    return res.data
  }

  // Initialisation : reconnecter le socket si token présent
  if (token.value) {
    connectSocket()
  }

  return {
    user, profile, token,
    isAuthenticated, isAdmin,
    register, login, logout,
    refreshProfile, updateProfile, uploadAvatar
  }
})
