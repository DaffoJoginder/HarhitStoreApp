import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  user_id: string
  name: string
  email: string
  account_type: 'b2c' | 'b2b' | 'admin'
  business_id?: string
  business_name?: string
  business_status?: string
  credit_available?: number
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
        }
        set({ token, user })
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        set({ token: null, user: null })
      },
      isAuthenticated: () => {
        return get().token !== null && get().user !== null
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

