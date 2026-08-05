import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '@/types/auth'

// Only the user-identity fields we need to store (not token metadata)
interface AuthUser {
  id: number
  username: string
  fullName: string
  role: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  updateUser: (data: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (data) => {
        set({
          token: data.accessToken,
          user: { id: data.id, username: data.username, fullName: data.fullName, role: data.role },
          isAuthenticated: true,
        })
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
