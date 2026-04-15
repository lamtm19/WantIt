<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-2">Mots interdits</h1>
    <p class="text-sm text-gray-500 mb-6">Les annonces contenant ces mots seront bloquées à la publication.</p>

    <!-- Ajouter -->
    <div class="card p-5 mb-6">
      <div class="flex gap-3">
        <input
          v-model="newWord"
          type="text"
          class="input flex-1"
          placeholder="Nouveau mot interdit..."
          @keyup.enter="addWord"
        />
        <button class="btn-primary" @click="addWord" :disabled="!newWord.trim()">Ajouter</button>
      </div>
    </div>

    <!-- Liste -->
    <div class="flex flex-wrap gap-3">
      <div
        v-for="word in words"
        :key="word.id"
        class="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium"
      >
        <span>{{ word.word }}</span>
        <button @click="removeWord(word)" class="hover:text-red-900 transition">
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    <div v-if="!words.length" class="text-center py-12 text-gray-400">Aucun mot interdit défini</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast   = useToast()
const words   = ref([])
const newWord = ref('')

async function load() {
  const res = await api.get('/api/admin/forbidden-words')
  words.value = res.data.data || []
}

onMounted(load)

async function addWord() {
  if (!newWord.value.trim()) return
  try {
    await api.post('/api/admin/forbidden-words', { word: newWord.value.trim().toLowerCase() })
    newWord.value = ''
    toast.success('Mot ajouté')
    await load()
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur')
  }
}

async function removeWord(word) {
  await api.delete(`/api/admin/forbidden-words/${word.id}`)
  toast.success('Mot supprimé')
  await load()
}
</script>
