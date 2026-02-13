import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  tokenExpiresAt: number | null  // Unix timestamp in ms
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setAuthData: (token: string, expiresIn: number, user: User) => void
  clearAuth: () => void
  isTokenExpired: () => boolean
  shouldRefreshToken: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
          isAuthenticated: !!user,
        })),

      setAuthData: (token: string, expiresIn: number, user: User) => {
        const expiresAt = Date.now() + (expiresIn * 1000)
        set({
          token,
          tokenExpiresAt: expiresAt,
          user,
          isAuthenticated: true,
        })
      },

      clearAuth: () =>
        set({
          user: null,
          token: null,
          tokenExpiresAt: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      isTokenExpired: () => {
        const { tokenExpiresAt } = get()
        if (!tokenExpiresAt) return true
        return Date.now() >= tokenExpiresAt
      },

      shouldRefreshToken: () => {
        const { tokenExpiresAt } = get()
        if (!tokenExpiresAt) return false
        // Refresh when 80% of token life has passed
        const refreshThreshold = tokenExpiresAt - (tokenExpiresAt * 0.2)
        return Date.now() >= refreshThreshold
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
