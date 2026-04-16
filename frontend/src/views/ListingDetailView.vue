<template>
  <div class="max-w-5xl mx-auto px-4 py-8" v-if="listing">
    <!-- Statut -->
    <div v-if="listing.status !== 'active'" class="mb-4 p-4 rounded-xl border"
      :class="listing.status === 'found' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'"
    >
      <p class="font-semibold" :class="listing.status === 'found' ? 'text-green-700' : 'text-gray-600'">
        {{ listing.status === 'found' ? '✅ Cette recherche a été satisfaite' : '❌ Cette recherche est annulée' }}
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Images + infos -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Galerie -->
        <div class="card overflow-hidden">
          <div v-if="images.length" class="relative">
            <div class="aspect-[16/9] bg-gray-100">
              <img :src="images[activeImg].url" class="w-full h-full object-contain" />
            </div>
            <div v-if="images.length > 1" class="flex gap-2 p-3 overflow-x-auto">
              <button
                v-for="(img, i) in images"
                :key="i"
                @click="activeImg = i"
                class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition"
                :class="i === activeImg ? 'border-primary-500' : 'border-transparent'"
              >
                <img :src="img.url" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>
          <div v-else class="aspect-[16/9] bg-gray-50 flex items-center justify-center">
            <div class="text-center text-gray-300">
              <ImageOff class="w-16 h-16 mx-auto mb-2" />
              <p class="text-sm">Pas d'image fournie</p>
            </div>
          </div>
        </div>

        <!-- Détails -->
        <div class="card p-6">
          <div class="flex items-start gap-3 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span v-if="listing.is_urgent" class="badge bg-red-500 text-white"><Zap class="w-3 h-3" /> Urgent</span>
                <span v-if="listing.categories" class="badge badge-gray">{{ listing.categories.name }}</span>
              </div>
              <h1 class="text-2xl font-black text-gray-900">{{ listing.title }}</h1>
            </div>

            <!-- Actions propriétaire -->
            <div v-if="isOwner" class="flex gap-2 shrink-0">
              <RouterLink :to="`/listings/${listing.id}/edit`" class="btn-secondary btn-sm">
                <Pencil class="w-4 h-4" />
              </RouterLink>
            </div>
          </div>

          <!-- Prix -->
          <div class="flex items-center gap-2 mb-4">
            <p class="text-3xl font-black text-primary-600">
              {{ formatPrice(listing.price_min, listing.price_max) }}
            </p>
          </div>

          <!-- Localisation -->
          <div class="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin class="w-4 h-4 text-primary-500" />
            <span>{{ locationLabel }}</span>
            <span class="text-gray-400">·</span>
            <Navigation class="w-4 h-4 text-gray-400" />
            <span class="text-gray-500">{{ listing.max_distance_km }} km max</span>
          </div>

          <!-- États -->
          <div class="mb-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">États acceptés :</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="c in listing.conditions" :key="c" class="badge badge-green">{{ conditionLabel(c) }}</span>
            </div>
          </div>

          <!-- Marques -->
          <div v-if="brands.length" class="mb-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">Marques recherchées :</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="b in brands" :key="b" class="badge badge-gray">{{ b }}</span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="listing.description" class="border-t border-gray-100 pt-4">
            <p class="text-sm font-semibold text-gray-700 mb-2">Description</p>
            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{{ listing.description }}</p>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Profil acheteur -->
        <div class="card p-5">
          <p class="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Recherche publiée par</p>
          <RouterLink :to="`/users/${listing.profiles?.id}`" class="flex items-center gap-3 hover:opacity-80 transition">
            <UserAvatar :profile="listing.profiles" size="lg" />
            <div>
              <p class="font-bold text-gray-900">{{ listing.profiles?.username }}</p>
              <p class="text-xs text-gray-500">{{ listing.profiles?.city || listing.profiles?.postal_code }}</p>
              <p class="text-xs text-gray-400">Membre depuis {{ memberSince }}</p>
            </div>
          </RouterLink>
        </div>

        <!-- CTA vendeur -->
        <div class="card p-5">
          <div v-if="auth.isAuthenticated && !isOwner">
            <p class="text-sm text-gray-600 mb-3">Vous possédez cet article ? Contactez l'acheteur !</p>
            <button
              class="btn-primary w-full"
              :disabled="listing.status !== 'active'"
              @click="showContactModal = true"
            >
              <MessageSquare class="w-4 h-4" />
              Proposer mon article
            </button>
          </div>
          <div v-else-if="isOwner" class="space-y-2">
            <RouterLink :to="`/listings/${listing.id}/edit`" class="btn-secondary w-full justify-center">
              <Pencil class="w-4 h-4" /> Modifier
            </RouterLink>
            <button @click="showStatusModal = true" class="btn-secondary w-full">Changer le statut</button>
          </div>
          <div v-else class="text-center">
            <RouterLink to="/login" class="btn-primary w-full justify-center">Se connecter pour contacter</RouterLink>
          </div>
        </div>


        <!-- Stats -->
        <div class="card p-4 text-sm text-gray-500 space-y-1">
          <div class="flex justify-between">
            <span>Publiée</span>
            <span class="font-medium text-gray-700">{{ publishedAt }}</span>
          </div>
          <div class="flex justify-between">
            <span>Vues</span>
            <span class="font-medium text-gray-700">{{ listing.view_count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal contact -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showContactModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showContactModal = false">
          <div class="card p-6 w-full max-w-md">
            <h3 class="font-bold text-lg mb-4">Contacter {{ listing.profiles?.username }}</h3>
            <p class="text-sm text-gray-500 mb-3">Présentez-vous et décrivez l'article que vous souhaitez vendre.</p>
            <textarea
              v-model="contactMessage"
              class="input resize-none mb-3"
              rows="4"
              placeholder="Bonjour, j'ai exactement ce que vous cherchez..."
              maxlength="2000"
            />
            <!-- Photos de l'article -->
            <div class="mb-4">
              <label class="label mb-1">Photos de votre article (optionnel)</label>
              <label class="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-primary-300 transition">
                <ImageIcon class="w-5 h-5 text-gray-400" />
                <span class="text-sm text-gray-500">Ajouter des photos</span>
                <input type="file" accept="image/*" multiple class="hidden" @change="onContactImages" />
              </label>
              <div v-if="contactImages.length" class="flex gap-2 mt-2 flex-wrap">
                <div v-for="(img, i) in contactImages" :key="i" class="relative w-16 h-16">
                  <img :src="img.preview" class="w-full h-full object-cover rounded-lg" />
                  <button @click="removeContactImage(i)" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                </div>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showContactModal = false">Annuler</button>
              <button class="btn-primary flex-1" :disabled="!contactMessage.trim() || contactLoading" @click="sendContact">
                <Loader v-if="contactLoading" class="w-4 h-4 animate-spin" />
                <span v-else>Envoyer</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>


    <!-- Modal changement de statut -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showStatusModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showStatusModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-2">Gérer l'annonce</h3>
            <p class="text-sm text-gray-500 mb-5">Que souhaitez-vous faire avec cette annonce ?</p>
            <div class="space-y-3">
              <button
                class="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50 text-green-800 hover:bg-green-100 transition text-left"
                @click="changeStatus('found')"
                :disabled="statusLoading"
              >
                <span class="text-2xl">✅</span>
                <div>
                  <p class="font-semibold">J'ai trouvé ce que je cherchais</p>
                  <p class="text-xs text-green-600">L'annonce passera en "Trouvée"</p>
                </div>
              </button>
              <button
                class="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition text-left"
                @click="changeStatus('cancelled')"
                :disabled="statusLoading"
              >
                <span class="text-2xl">🚫</span>
                <div>
                  <p class="font-semibold">Je n'en ai plus besoin</p>
                  <p class="text-xs text-gray-500">L'annonce sera annulée</p>
                </div>
              </button>
              <button
                class="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition text-left"
                @click="confirmDelete"
                :disabled="statusLoading"
              >
                <span class="text-2xl">🗑️</span>
                <div>
                  <p class="font-semibold">Supprimer définitivement</p>
                  <p class="text-xs text-red-500">Cette action est irréversible</p>
                </div>
              </button>
            </div>
            <button class="btn-secondary w-full mt-4" @click="showStatusModal = false">Annuler</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal confirmation suppression -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div class="card p-6 w-full max-w-sm text-center">
            <p class="text-4xl mb-3">⚠️</p>
            <h3 class="font-bold text-lg mb-2">Supprimer l'annonce ?</h3>
            <p class="text-sm text-gray-500 mb-5">Cette action est définitive et ne peut pas être annulée.</p>
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showDeleteConfirm = false">Annuler</button>
              <button class="btn-danger flex-1" :disabled="statusLoading" @click="handleDelete">
                <Loader v-if="statusLoading" class="w-4 h-4 animate-spin" />
                <span v-else>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- Loading -->
  <div v-else-if="loading" class="max-w-5xl mx-auto px-4 py-8">
    <div class="animate-pulse space-y-4">
      <div class="h-8 bg-gray-200 rounded w-1/2" />
      <div class="h-64 bg-gray-200 rounded-2xl" />
    </div>
  </div>

  <!-- 404 -->
  <div v-else class="text-center py-20">
    <p class="text-gray-500 text-lg">Annonce introuvable</p>
    <RouterLink to="/" class="btn-primary mt-4 inline-flex">Retour à l'accueil</RouterLink>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ImageOff, MapPin, Navigation, Zap, MessageSquare, Pencil, Loader, Image as ImageIcon } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useListingStore } from '@/stores/listings'
import { useConversationStore } from '@/stores/conversations'
import UserAvatar from '@/components/common/UserAvatar.vue'
import api from '@/services/api'

const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const auth   = useAuthStore()
const store  = useListingStore()
const convStore = useConversationStore()

const listing          = ref(null)
const loading          = ref(true)
const activeImg        = ref(0)
const showContactModal = ref(false)
const showStatusModal  = ref(false)
const showDeleteConfirm = ref(false)
const contactMessage   = ref('')
const contactLoading   = ref(false)
const contactImages    = ref([]) // [{ file, preview, base64 }]
const statusLoading    = ref(false)

const isOwner = computed(() => listing.value?.user_id === auth.profile?.id)
const images  = computed(() => (listing.value?.listing_images || []).sort((a, b) => a.sort_order - b.sort_order))
const brands  = computed(() => (listing.value?.listing_brands || []).map(b => b.brand_name).filter(Boolean))

const locationLabel = computed(() => {
  if (!listing.value) return ''
  const { city, postal_code, region } = listing.value
  if (city && postal_code) return `${city} (${postal_code})`
  return region || city || 'France'
})

const memberSince = computed(() => {
  if (!listing.value?.profiles?.created_at) return ''
  return new Date(listing.value.profiles.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
})

const publishedAt = computed(() => {
  if (!listing.value?.created_at) return ''
  return new Date(listing.value.created_at).toLocaleDateString('fr-FR')
})

function formatPrice(min, max) {
  if (min === max || !max) return `${min} €`
  return `${min} – ${max} €`
}

function conditionLabel(c) {
  return { new_with_tags: 'Neuf avec étiquette', new_without_tags: 'Neuf sans étiquette', very_good: 'Très bon état', good: 'Bon état', fair: 'État correct' }[c] || c
}

onMounted(async () => {
  try {
    listing.value = await store.getListing(route.params.id)
  } catch { listing.value = null }
  finally { loading.value = false }
})

function onContactImages(e) {
  const files = Array.from(e.target.files)
  for (const file of files) {
    const preview = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = (ev) => {
      contactImages.value.push({
        file,
        preview,
        base64: ev.target.result.split(',')[1],
        filename: file.name
      })
    }
    reader.readAsDataURL(file)
  }
  e.target.value = ''
}

function removeContactImage(index) {
  const img = contactImages.value[index]
  if (img?.preview) URL.revokeObjectURL(img.preview)
  contactImages.value.splice(index, 1)
}

async function sendContact() {
  if (!contactMessage.value.trim()) return
  contactLoading.value = true
  try {
    // 1. Créer la conversation avec le message texte
    const res = await convStore.startConversation(listing.value.id, contactMessage.value)
    const convId = res.conversation.id

    // 2. Envoyer les images si sélectionnées
    for (const img of contactImages.value) {
      try {
        const uploadRes = await api.post(`/api/conversations/${convId}/images`, {
          base64: img.base64,
          filename: img.filename
        })
        await convStore.sendMessage(convId, {
          type: 'image',
          image_url: uploadRes.data.url,
          content: null
        })
      } catch {}
    }

    showContactModal.value = false
    contactImages.value = []
    toast.success('Message envoyé !')
    router.push(`/messages/${convId}`)
  } catch (err) {
    if (err.response?.data?.conversation_id) {
      router.push(`/messages/${err.response.data.conversation_id}`)
    } else {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi')
    }
  } finally {
    contactLoading.value = false
  }
}

async function changeStatus(status) {
  statusLoading.value = true
  try {
    await store.updateStatus(listing.value.id, status)
    listing.value.status = status
    showStatusModal.value = false
    toast.success(status === 'found' ? 'Annonce marquée comme trouvée !' : 'Annonce annulée')
  } catch {
    toast.error('Erreur lors du changement de statut')
  } finally {
    statusLoading.value = false
  }
}

function confirmDelete() {
  showStatusModal.value = false
  showDeleteConfirm.value = true
}

async function handleDelete() {
  statusLoading.value = true
  try {
    await store.deleteListing(listing.value.id)
    showDeleteConfirm.value = false
    toast.success('Annonce supprimée')
    router.push('/profile')
  } catch {
    toast.error('Erreur lors de la suppression')
  } finally {
    statusLoading.value = false
  }
}

</script>
