<template>
  <div class="p-6">
    <h1 class="text-2xl font-black text-gray-900 mb-6">Signalements</h1>

    <!-- Filtres -->
    <div class="flex gap-3 mb-6">
      <select v-model="filterStatus" class="input max-w-[180px]" @change="load">
        <option value="pending">En attente</option>
        <option value="reviewed">Traités</option>
        <option value="dismissed">Rejetés</option>
        <option value="actioned">Actionnés</option>
      </select>
      <select v-model="filterType" class="input max-w-[180px]" @change="load">
        <option value="">Tous les types</option>
        <option value="listing">Annonces</option>
        <option value="user">Utilisateurs</option>
        <option value="message">Messages</option>
        <option value="conversation">Conversations</option>
      </select>
    </div>

    <div class="space-y-3">
      <div v-for="report in reports" :key="report.id" class="card p-5">
        <div class="flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="badge badge-orange capitalize">{{ report.type }}</span>
              <span :class="['badge', statusBadge(report.status)]">{{ report.status }}</span>
            </div>
            <p class="text-gray-900 font-medium">{{ report.reason }}</p>
            <p class="text-xs text-gray-500 mt-1">
              Par <strong>{{ report.reporter?.username }}</strong> ·
              {{ new Date(report.created_at).toLocaleDateString('fr-FR') }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">Cible ID : {{ report.target_id }}</p>
            <p v-if="report.admin_note" class="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
              Note admin : {{ report.admin_note }}
            </p>
          </div>

          <div v-if="report.status === 'pending'" class="flex flex-col gap-2 shrink-0">
            <button @click="openAction(report, 'action')" class="btn-primary btn-sm text-xs">Actionner</button>
            <button @click="openAction(report, 'dismiss')" class="btn-secondary btn-sm text-xs">Rejeter</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8 text-gray-400"><Loader class="w-6 h-6 animate-spin mx-auto" /></div>
    <div v-else-if="!reports.length" class="text-center py-12 text-gray-400">Aucun signalement</div>

    <!-- Modal action -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showActionModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="showActionModal = false">
          <div class="card p-6 w-full max-w-sm">
            <h3 class="font-bold text-lg mb-4">
              {{ pendingAction.action === 'action' ? 'Actionner' : 'Rejeter' }} le signalement
            </h3>
            <textarea v-model="actionNote" class="input resize-none mb-4" rows="2" placeholder="Note (optionnel)" />
            <div class="flex gap-3">
              <button class="btn-secondary flex-1" @click="showActionModal = false">Annuler</button>
              <button :class="pendingAction.action === 'action' ? 'btn-danger flex-1' : 'btn-primary flex-1'" @click="confirmAction">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loader } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import api from '@/services/api'

const toast = useToast()
const reports       = ref([])
const loading       = ref(true)
const filterStatus  = ref('pending')
const filterType    = ref('')
const showActionModal = ref(false)
const pendingAction = ref({})
const actionNote    = ref('')

async function load() {
  loading.value = true
  const res = await api.get('/api/admin/reports', {
    params: { status: filterStatus.value, type: filterType.value }
  })
  reports.value = res.data.data || []
  loading.value = false
}

onMounted(load)

function openAction(report, action) {
  pendingAction.value = { report, action }
  showActionModal.value = true
}

async function confirmAction() {
  const { report, action } = pendingAction.value
  try {
    await api.patch(`/api/admin/reports/${report.id}/review`, { action, note: actionNote.value })
    showActionModal.value = false
    actionNote.value = ''
    toast.success('Signalement traité')
    await load()
  } catch { toast.error('Erreur') }
}

function statusBadge(s) {
  return { pending: 'badge-orange', reviewed: 'badge-gray', dismissed: 'badge-gray', actioned: 'badge-red' }[s] || 'badge-gray'
}
</script>
