import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '@/types/auth'

interface AuthState {
  token: string | null
  user: Omit<LoginResponse, 'token'> | null
  isAuthenticated: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  updateUser: (data: Partial<Omit<LoginResponse, 'token'>>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (data) => {
        const { token, ...user } = data
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      updateUser: (data) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }))
      },
    }),
    {
      name: 'fillinus-auth', // key in localStorage
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
