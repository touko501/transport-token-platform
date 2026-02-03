// ═══════════════════════════════════════════════════════════════════════════
// TRANSPORT TOKEN - ZUSTAND STORE
// État global de l'application
// ═══════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'CLIENT' | 'TRANSPORTEUR' | 'ADMIN'
  company?: {
    name: string
    siret: string
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

interface MissionDraft {
  pickup: {
    address: string
    city: string
    postalCode: string
    country: string
    lat: number
    lon: number
  } | null
  delivery: {
    address: string
    city: string
    postalCode: string
    country: string
    lat: number
    lon: number
  } | null
  vehicleType: string | null
  weightKg: number
  options: {
    isUrgent: boolean
    isWeekend: boolean
    isNight: boolean
    isADR: boolean
    isFragile: boolean
    ecoOption: 'standard' | 'hvo' | 'electric' | 'hydrogen'
  }
}

interface MissionState {
  draft: MissionDraft
  updateDraft: (data: Partial<MissionDraft>) => void
  resetDraft: () => void
}

interface UIState {
  sidebarOpen: boolean
  theme: 'dark' | 'light'
  notifications: Array<{ id: string; message: string; type: string }>
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
  addNotification: (notification: { message: string; type: string }) => void
  removeNotification: (id: string) => void
}

// ═══════════════════════════════════════════════════════════════════════════
// AUTH STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      
      login: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      }),
      
      logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'tt-auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
)

// ═══════════════════════════════════════════════════════════════════════════
// MISSION STORE
// ═══════════════════════════════════════════════════════════════════════════

const initialDraft: MissionDraft = {
  pickup: null,
  delivery: null,
  vehicleType: null,
  weightKg: 1000,
  options: {
    isUrgent: false,
    isWeekend: false,
    isNight: false,
    isADR: false,
    isFragile: false,
    ecoOption: 'standard',
  },
}

export const useMissionStore = create<MissionState>()((set) => ({
  draft: initialDraft,
  
  updateDraft: (data) => set((state) => ({
    draft: { ...state.draft, ...data }
  })),
  
  resetDraft: () => set({ draft: initialDraft }),
}))

// ═══════════════════════════════════════════════════════════════════════════
// UI STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  notifications: [],
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setTheme: (theme) => set({ theme }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      { ...notification, id: Date.now().toString() }
    ]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}))
