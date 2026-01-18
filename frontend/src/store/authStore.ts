import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: 'CANDIDATE' | 'RECRUITER'
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

// Load from localStorage on initialization
const loadAuth = (): { token: string | null; user: User | null } => {
  if (typeof window === 'undefined') return { token: null, user: null }
  try {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return { token: parsed.token || null, user: parsed.user || null }
    }
  } catch (e) {
    console.error('Failed to load auth from localStorage', e)
  }
  return { token: null, user: null }
}

export const useAuthStore = create<AuthState>((set) => {
  const { token, user } = loadAuth()
  return {
    token,
    user,
    setAuth: (token, user) => {
      localStorage.setItem('auth-storage', JSON.stringify({ token, user }))
      set({ token, user })
    },
    logout: () => {
      localStorage.removeItem('auth-storage')
      set({ token: null, user: null })
    },
  }
})

