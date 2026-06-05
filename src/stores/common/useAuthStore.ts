import { create } from 'zustand'
import type { User } from '@/types/api'
import apiClient from '@/service/common/apiClient'
import { tokenManager } from '@/lib/tokenManager'
import { currentRole } from '@/lib/currentRole'
import authService from '@/service/authService'
import { getRolePermissionKeys, type AdminPermission } from '@/constant/permissionConstant'

interface AuthState {
  user: User | null
  permissions: AdminPermission[]
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

  /** Fetch /auth/me and populate the current admin session */
  fetchProfile: () => Promise<boolean>

  /** Clear all auth state and tokens */
  logout: () => void

  /** Run once on app load and restore session from localStorage */
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
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
    set({ isAuthenticated: false, isAdmin: false, permissions: [], loggedOut: false })
  },

  fetchProfile: async () => {
    try {
      const res = await authService.getProfile()
      const user = res?.data?.user ?? null

      if (!user) {
        tokenManager.clearAll()
        currentRole.set(undefined)
        set({ user: null, permissions: [], isAuthenticated: false, isAdmin: false })
        return false
      }

      // Do not call `/governance/admin/roles/:id/permissions` here.
      // That endpoint is admin-only and will return 403 for normal roles.
      // The UI uses local role permissions for menu/route guards; backend still enforces each API.
      const permissions = getRolePermissionKeys(user.role_id)
      const canEnterAdmin = user.is_active !== false && permissions.length > 0

      if (!canEnterAdmin) {
        tokenManager.clearAll()
        currentRole.set(undefined)
        set({ user: null, permissions: [], isAuthenticated: false, isAdmin: false })
        return false
      }

      currentRole.set(user.role_id)
      set({ user, permissions, isAuthenticated: true, isAdmin: true })
      return true
    } catch {
      tokenManager.clearAll()
      currentRole.set(undefined)
      set({ user: null, permissions: [], isAuthenticated: false, isAdmin: false })
      return false
    }
  },

  logout: () => {
    tokenManager.clearAll()
    currentRole.set(undefined)
    set({ user: null, permissions: [], isAuthenticated: false, isAdmin: false, loggedOut: true })
  },

  initialize: async () => {
    const token = tokenManager.getAccessToken()
    if (!token) {
      set({ isInitializing: false })
      return
    }

    await get().fetchProfile()
    set({ isInitializing: false })
  },
}))

export default useAuthStore
