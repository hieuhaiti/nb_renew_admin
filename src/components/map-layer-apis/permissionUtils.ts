import type { User } from '@/types/api'

export type MapLayerApiPermissionAction = 'create' | 'update' | 'delete' | 'share'

export function hasMapLayerApiPermission(user: User | null, action: MapLayerApiPermissionAction) {
  if (!user) return false

  const roleName = user.role?.name?.toLowerCase() ?? ''
  if (user.role_id === 1 || roleName === 'admin') return true

  const permissions = user.role?.permissions
  if (!permissions || Array.isArray(permissions)) return false

  const mapLayerPermissions = permissions.map_layer_apis ?? []
  if (mapLayerPermissions.includes('*') || mapLayerPermissions.includes(action)) return true

  const flattened = Object.entries(permissions).flatMap(([resource, actions]) =>
    Array.isArray(actions) ? actions.map((item) => `${resource}:${String(item)}`) : []
  )

  return flattened.includes(`map_layer_apis:${action}`)
}

export function normalizeStatusBadge(status: 'draft' | 'published') {
  return status === 'published' ? 'Published' : 'Draft'
}

