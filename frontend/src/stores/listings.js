import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useListingStore = defineStore('listings', () => {
  const listings    = ref([])
  const categories  = ref([])
  const loading     = ref(false)
  const hasMore     = ref(true)
  const page        = ref(1)
  const filters     = ref({})

  async function fetchCategories() {
    if (categories.value.length > 0) return
    const res = await api.get('/api/categories')
    categories.value = res.data.data
  }

  async function fetchListings(newFilters = {}, reset = false) {
    if (reset) {
      page.value = 1
      hasMore.value = true
      listings.value = []
      filters.value = newFilters
    }
    if (!hasMore.value || loading.value) return

    loading.value = true
    try {
      const params = { ...filters.value, page: page.value, limit: 20 }
      const res = await api.get('/api/listings', { params })
      const data = res.data.data || []

      if (reset) {
        listings.value = data
      } else {
        listings.value.push(...data)
      }

      hasMore.value = data.length === 20
      page.value++
    } finally {
      loading.value = false
    }
  }

  async function searchListings(q, extraFilters = {}) {
    loading.value = true
    try {
      const res = await api.get('/api/listings/search', { params: { q, ...extraFilters } })
      listings.value = res.data.data || []
      hasMore.value = false
    } finally {
      loading.value = false
    }
  }

  async function getListing(id) {
    const res = await api.get(`/api/listings/${id}`)
    return res.data
  }

  async function createListing(data) {
    const res = await api.post('/api/listings', data)
    return res.data
  }

  async function updateListing(id, data) {
    const res = await api.put(`/api/listings/${id}`, data)
    return res.data
  }

  async function updateStatus(id, status) {
    const res = await api.patch(`/api/listings/${id}/status`, { status })
    return res.data
  }

  async function deleteListing(id) {
    await api.delete(`/api/listings/${id}`)
    listings.value = listings.value.filter(l => l.id !== id)
  }

  async function uploadImages(listingId, images) {
    const res = await api.post(`/api/listings/${listingId}/images`, { images })
    return res.data
  }

  async function getMyListings(status) {
    const res = await api.get('/api/listings/mine', { params: status ? { status } : {} })
    return res.data.data || []
  }

  async function getUserListings(userId, status = 'active') {
    const res = await api.get(`/api/listings/user/${userId}`, { params: { status } })
    return res.data.data || []
  }

  return {
    listings, categories, loading, hasMore, page, filters,
    fetchCategories, fetchListings, searchListings,
    getListing, createListing, updateListing, updateStatus,
    deleteListing, uploadImages, getMyListings, getUserListings
  }
})
