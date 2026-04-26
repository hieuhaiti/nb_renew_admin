import { create } from 'zustand'
import type { User } from '@/types/api'
import apiClient from '@/service/common/apiClient'
import { tokenManager } from '@/lib/tokenManager'
import authService from '@/service/authService'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isInitializing: boolean
  loggedOut: boolean

  /** Called after successful login: saves tokens, marks authenticated */
  loginSuccess: (tokens: {
    accessToken: string
    refreshToken: string
    tokenType?: string
    expiresIn?: string
    refreshExpiresIn?: string
  }) => void

  /** Fetch /auth/me and populate user (admin only) */
  fetchProfile: () => Promise<boolean>

  /** Clear all auth state and tokens */
  logout: () => void

  /** Run once on app load – restore session from localStorage */
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isInitializing: true,
  loggedOut: false,

  loginSuccess: ({ accessToken, refreshToken, tokenType, expiresIn, refreshExpiresIn }) => {
    apiClient.setTokens({ accessToken, refreshToken })
    if (tokenType) tokenManager.setTokenType(tokenType)
    if (expiresIn) localStorage.setItem('token_expires_in', expiresIn)
    if (refreshExpiresIn) localStorage.setItem('refresh_expires_in', refreshExpiresIn)
    tokenManager.setLoginTimestamp(new Date().toISOString())
    set({ isAuthenticated: false, isAdmin: false, loggedOut: false })
  },

  fetchProfile: async () => {
    try {
      const res = await authService.getProfile()
      const user = res?.data?.user ?? null
      const roleName = user?.role?.name?.trim().toLowerCase() ?? ''
      const isAdmin = !!user && (roleName === 'admin' || user.role_id === 1)

      if (!isAdmin) {
        tokenManager.clearAll()
        set({ user: null, isAuthenticated: false, isAdmin: false })
        return false
      }

      set({ user, isAuthenticated: true, isAdmin: true })
      return true
    } catch {
      tokenManager.clearAll()
      set({ user: null, isAuthenticated: false, isAdmin: false })
      return false
    }
  },

  logout: () => {
    tokenManager.clearAll()
    set({ user: null, isAuthenticated: false, isAdmin: false, loggedOut: true })
  },

  initialize: async () => {
    const token = tokenManager.getAccessToken()
    if (!token) {
      set({ isInitializing: false })
      return
    }
    // Token exists – try to fetch profile to verify session
    await get().fetchProfile()
    set({ isInitializing: false })
  },
}))

export default useAuthStore
