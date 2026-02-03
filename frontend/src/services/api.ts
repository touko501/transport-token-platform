// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - API SERVICE
// Client HTTP avec Axios
// ═══════════════════════════════════════════════════════════════════════════

import axios, { AxiosError, AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT AXIOS
// ═══════════════════════════════════════════════════════════════════════════

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur requête - ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur réponse - gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      useAuthStore.getState().logout()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ═══════════════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════════════

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  
  register: async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: string
    company?: { name: string; siret: string; address: string; city: string; postalCode: string }
  }) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },
  
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  
  logout: async () => {
    const { data } = await api.post('/auth/logout')
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// MISSIONS API
// ═══════════════════════════════════════════════════════════════════════════

export const missionsApi = {
  // Calcul de devis
  calculateQuote: async (params: {
    pickupLat: number
    pickupLon: number
    pickupCountry: string
    deliveryLat: number
    deliveryLon: number
    deliveryCountry: string
    vehicleType: string
    weightKg: number
    isUrgent?: boolean
    isWeekend?: boolean
    isNight?: boolean
    isADR?: boolean
    ecoOption?: string
  }) => {
    const { data } = await api.post('/missions/quote', params)
    return data
  },
  
  // Créer une mission
  create: async (missionData: any) => {
    const { data } = await api.post('/missions', missionData)
    return data
  },
  
  // Liste des missions
  list: async (params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/missions', { params })
    return data
  },
  
  // Détail d'une mission
  get: async (id: string) => {
    const { data } = await api.get(`/missions/${id}`)
    return data
  },
  
  // Missions disponibles (transporteur)
  available: async (params?: { vehicleType?: string; page?: number }) => {
    const { data } = await api.get('/missions/available/list', { params })
    return data
  },
  
  // Accepter une mission
  accept: async (id: string, vehicleId?: string) => {
    const { data } = await api.post(`/missions/${id}/accept`, { vehicleId })
    return data
  },
  
  // Démarrer une mission
  start: async (id: string) => {
    const { data } = await api.post(`/missions/${id}/start`)
    return data
  },
  
  // Terminer une mission
  complete: async (id: string, proofData?: { signatureUrl?: string; photoUrl?: string }) => {
    const { data } = await api.post(`/missions/${id}/complete`, proofData)
    return data
  },
  
  // Annuler une mission
  cancel: async (id: string, reason: string) => {
    const { data } = await api.post(`/missions/${id}/cancel`, { reason })
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// VEHICLES API
// ═══════════════════════════════════════════════════════════════════════════

export const vehiclesApi = {
  list: async () => {
    const { data } = await api.get('/vehicles')
    return data
  },
  
  create: async (vehicleData: any) => {
    const { data } = await api.post('/vehicles', vehicleData)
    return data
  },
  
  delete: async (id: string) => {
    const { data } = await api.delete(`/vehicles/${id}`)
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// PRICING API
// ═══════════════════════════════════════════════════════════════════════════

export const pricingApi = {
  getVehicles: async () => {
    const { data } = await api.get('/pricing/vehicles')
    return data
  },
  
  getCountries: async () => {
    const { data } = await api.get('/pricing/countries')
    return data
  },
  
  getSurcharges: async () => {
    const { data } = await api.get('/pricing/surcharges')
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKING API
// ═══════════════════════════════════════════════════════════════════════════

export const trackingApi = {
  getPosition: async (missionId: string) => {
    const { data } = await api.get(`/tracking/mission/${missionId}`)
    return data
  },
  
  updatePosition: async (missionId: string, lat: number, lon: number) => {
    const { data } = await api.post(`/tracking/mission/${missionId}/position`, { lat, lon })
    return data
  },
  
  getHistory: async (missionId: string) => {
    const { data } = await api.get(`/tracking/mission/${missionId}/history`)
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// USERS API
// ═══════════════════════════════════════════════════════════════════════════

export const usersApi = {
  getProfile: async () => {
    const { data } = await api.get('/users/profile')
    return data
  },
  
  updateProfile: async (profileData: any) => {
    const { data } = await api.patch('/users/profile', profileData)
    return data
  },
  
  getNotifications: async () => {
    const { data } = await api.get('/users/notifications')
    return data
  },
  
  markNotificationRead: async (id: string) => {
    const { data } = await api.patch(`/users/notifications/${id}/read`)
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS API
// ═══════════════════════════════════════════════════════════════════════════

export const analyticsApi = {
  getOverview: async () => {
    const { data } = await api.get('/analytics/overview')
    return data
  },
  
  getMonthly: async () => {
    const { data } = await api.get('/analytics/monthly')
    return data
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN API
// ═══════════════════════════════════════════════════════════════════════════

export const adminApi = {
  getStats: async () => {
    const { data } = await api.get('/admin/stats')
    return data
  },
  
  getUsers: async () => {
    const { data } = await api.get('/admin/users')
    return data
  },
  
  getMissions: async () => {
    const { data } = await api.get('/admin/missions')
    return data
  },
  
  verifyTransporteur: async (id: string) => {
    const { data } = await api.post(`/admin/transporteurs/${id}/verify`)
    return data
  },
  
  getDisputes: async () => {
    const { data } = await api.get('/admin/disputes')
    return data
  },
}

export default api
