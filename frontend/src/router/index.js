import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Accueil' }
  },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Connexion', guestOnly: true }
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Inscription', guestOnly: true }
  },
  {
    path: '/forgot-password',
    component: () => import('@/views/ForgotPasswordView.vue'),
    meta: { title: 'Mot de passe oublié', guestOnly: true }
  },
  {
    path: '/reset-password',
    component: () => import('@/views/ResetPasswordView.vue'),
    meta: { title: 'Réinitialiser le mot de passe' }
  },
  {
    path: '/listings/create',
    component: () => import('@/views/ListingCreateView.vue'),
    meta: { title: 'Publier une recherche', requiresAuth: true }
  },
  {
    path: '/listings/:id',
    component: () => import('@/views/ListingDetailView.vue'),
    meta: { title: 'Détail de la recherche' }
  },
  {
    path: '/listings/:id/edit',
    component: () => import('@/views/ListingEditView.vue'),
    meta: { title: 'Modifier l\'annonce', requiresAuth: true }
  },
  {
    path: '/my-listings',
    component: () => import('@/views/MyListingsView.vue'),
    meta: { title: 'Mes annonces', requiresAuth: true }
  },
  {
    path: '/messages',
    component: () => import('@/views/MessagesView.vue'),
    meta: { title: 'Messages', requiresAuth: true }
  },
  {
    path: '/messages/:id',
    component: () => import('@/views/ConversationView.vue'),
    meta: { title: 'Conversation', requiresAuth: true }
  },
  {
    path: '/profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { title: 'Mon profil', requiresAuth: true }
  },
  {
    path: '/profile/settings',
    component: () => import('@/views/ProfileSettingsView.vue'),
    meta: { title: 'Paramètres', requiresAuth: true }
  },
  {
    path: '/users/:id',
    component: () => import('@/views/PublicProfileView.vue'),
    meta: { title: 'Profil utilisateur' }
  },
  {
    path: '/legal',
    component: () => import('@/views/LegalView.vue'),
    meta: { title: 'Mentions légales' }
  },
  {
    path: '/confirm-email',
    component: () => import('@/views/ConfirmEmailView.vue'),
    meta: { title: 'Confirmation email' }
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Page introuvable' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Mettre à jour le titre
  document.title = to.meta.title ? `${to.meta.title} · WantIt` : 'WantIt'

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next('/')
  }

  next()
})

export default router
