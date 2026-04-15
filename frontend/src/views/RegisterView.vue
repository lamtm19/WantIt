<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-lg">
      <div class="text-center mb-8">
        <RouterLink to="/" class="text-3xl font-black text-primary-600">WantIt</RouterLink>
        <p class="text-gray-500 mt-2">Créez votre compte gratuitement</p>
      </div>

      <div class="card p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <!-- Pseudo -->
          <div>
            <label class="label">Pseudo <span class="text-red-500">*</span></label>
            <input v-model="form.username" type="text" class="input" placeholder="MonPseudo" required minlength="3" maxlength="30" autocomplete="username" />
          </div>

          <!-- Email -->
          <div>
            <label class="label">Email <span class="text-red-500">*</span></label>
            <input v-model="form.email" type="email" class="input" placeholder="vous@exemple.com" required autocomplete="email" />
          </div>

          <!-- Mot de passe -->
          <div>
            <label class="label">Mot de passe <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPwd ? 'text' : 'password'"
                class="input pr-12"
                placeholder="Minimum 8 caractères"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" @click="showPwd = !showPwd">
                <Eye v-if="!showPwd" class="w-5 h-5" /><EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Confirmation -->
          <div>
            <label class="label">Confirmer le mot de passe <span class="text-red-500">*</span></label>
            <input
              v-model="form.confirm"
              :type="showPwd ? 'text' : 'password'"
              class="input"
              placeholder="••••••••"
              required
              autocomplete="new-password"
            />
            <p v-if="form.confirm && form.password !== form.confirm" class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
          </div>

          <!-- Localisation -->
          <div class="pt-2 border-t border-gray-100">
            <p class="text-sm font-semibold text-gray-700 mb-3">Votre localisation</p>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Ville</label>
                <input v-model="form.city" type="text" class="input" placeholder="Paris" />
              </div>
              <div>
                <label class="label">Code postal</label>
                <input v-model="form.postal_code" type="text" class="input" placeholder="75001" />
              </div>
            </div>
            <div class="mt-3">
              <label class="label">Région</label>
              <input v-model="form.region" type="text" class="input" placeholder="Île-de-France" />
            </div>
          </div>

          <p v-if="error" class="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{{ error }}</p>

          <button
            type="submit"
            class="btn-primary w-full btn-lg"
            :disabled="loading || (form.confirm && form.password !== form.confirm)"
          >
            <Loader v-if="loading" class="w-5 h-5 animate-spin" />
            <span v-else>Créer mon compte</span>
          </button>

          <p class="text-xs text-gray-400 text-center">
            En vous inscrivant, vous acceptez les
            <RouterLink to="/legal" class="text-primary-600 hover:underline">mentions légales</RouterLink>.
          </p>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?
          <RouterLink to="/login" class="text-primary-600 font-semibold hover:underline">Se connecter</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Loader } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const form = ref({
  username: '', email: '', password: '', confirm: '',
  city: '', postal_code: '', region: ''
})
const loading = ref(false)
const error   = ref('')
const showPwd = ref(false)

async function handleRegister() {
  if (form.value.password !== form.value.confirm) return

  error.value   = ''
  loading.value = true
  try {
    await auth.register({
      username:    form.value.username,
      email:       form.value.email,
      password:    form.value.password,
      city:        form.value.city,
      postal_code: form.value.postal_code,
      region:      form.value.region
    })
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>
