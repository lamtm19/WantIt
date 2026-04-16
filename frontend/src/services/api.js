import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 15000
})

// Intercepteur request : ajouter le token
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Intercepteur response : gérer les 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      const auth = useAuthStore()
      // Ne déconnecter que si l'utilisateur était déjà authentifié
      // (évite la redirection vers / lors d'un échec de connexion)
      if (auth.token) {
        auth.logout()
      }
    }
    return Promise.reject(err)
  }
)

export default api
