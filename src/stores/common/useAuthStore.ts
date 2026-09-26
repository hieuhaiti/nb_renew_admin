import { create } from 'zustand'
import type { User } from '@/types/api'
import apiClient from '@/service/common/apiClient'
import { tokenManager } from '@/lib/tokenManager'
import { currentRole } from '@/lib/currentRole'
import authService from '@/service/authService'
import { getRolePermissionKeys, type AdminPermission } from '@/constant/permissionConstant'

function normalizePermissionKey(permission: unknown): AdminPermission | null {
  if (typeof permission === 'string') {
    const value = permission.trim()
    return value === '*:*' || value.includes(':') ? (value as AdminPermission) : null
  }

  if (!permission || typeof permission !== 'object') return null

  const record = permission as Record<string, unknown>
  const resource = typeof record.resource === 'string' ? record.resource.trim() : ''
  const action = typeof record.action === 'string' ? record.action.trim() : ''

  return resource && action ? (`${resource}:${action}` as AdminPermission) : null
}

function normalizePermissionSource(source: unknown): AdminPermission[] {
  if (!source) return []

  if (Array.isArray(source)) {
    return source.map(normalizePermissionKey).filter((p): p is AdminPermission => p !== null)
  }

  if (typeof source === 'object') {
    return Object.entries(source as Record<string, unknown>).flatMap(([resource, actions]) => {
      if (!Array.isArray(actions)) return []
      return actions
        .filter((action): action is string => typeof action === 'string' && action.trim().length > 0)
        .map((action) => `${resource}:${action.trim()}` as AdminPermission)
    })
  }

  return []
}

function getProfilePermissions(user: User): AdminPermission[] {
  const backendPermissions = [
    ...normalizePermissionSource(user.permissions),
    ...normalizePermissionSource(user.role?.permissions),
  ]

  if (backendPermissions.length > 0) {
    return [...new Set(backendPermissions)]
  }

  return getRolePermissionKeys(user.role_id)
}

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

      // Prefer permissions returned by /auth/me so role-permission changes in DB drive the admin UI.
      // Keep the local map as a compatibility fallback for older backend responses.
      const permissions = getProfilePermissions(user)
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
