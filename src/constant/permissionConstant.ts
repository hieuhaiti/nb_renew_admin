import { ROLE_IDS, type RoleId } from '@/constant/roleConstant'

export type AdminPermission = `${string}:${string}` | '*:*'
export type PermissionMatchMode = 'any' | 'all'

export type PageAccess = {
  permissions: AdminPermission[]
  match?: PermissionMatchMode
}

/**
 * Endpoint `/governance/admin/roles/:id/permissions` chi danh cho man hinh admin
 * quan tri role. Cac role khac co the bi 403 khi goi endpoint nay.
 *
 * Vi vay runtime cua sidebar/route dung map local nay de chan UI theo role hien tai.
 * Backend van la lop bao ve cuoi cung cho tung API nghiep vu.
 */
export const ROLE_PERMISSION_MAP = {
  [ROLE_IDS.SYSTEM_ADMIN]: ['*:*'],

  [ROLE_IDS.MINISTRY]: [
    'governance:update',
    'feedbacks:read',
    'feedbacks:update',
    'analytics:read',
  ],

  [ROLE_IDS.DEPARTMENT]: [
    'governance:create',
    'governance:update',
    'spots_capacity:read',
    'spots_capacity:create',
    'spots_capacity:update',
    'tour_capacity:read',
    'tour_capacity:create',
    'tour_capacity:update',
    'capacity_configs:read',
    'capacity_configs:update',
    'spots:read',
    'spots:create',
    'spots:update',
    'tours:read',
    'tours:create',
    'tours:update',
    'ocop:read',
    'ocop:create',
    'ocop:update',
    'businesses:read',
    'businesses:update',
    'feedbacks:read',
    'feedbacks:update',
    'ratings:read',
    'ratings:update',
    'ratings:delete',
    'analytics:read',
  ],

  [ROLE_IDS.SPOT_OPERATOR]: [
    'governance:create',
    'governance:update',
    'spots_capacity:read',
    'spots_capacity:create',
    'spots_capacity:update',
    // 'capacity_configs:read',
    // 'capacity_configs:update',
    'spots:read',
    'spots:create',
    'spots:update',
    'businesses:read',
    'businesses:create',
    'businesses:update',
    'businesses:delete',
    // 'ocop:read',
    // 'ocop:create',
    // 'ocop:update',
    // 'ocop:delete',
    'ratings:read',
    'ratings:update',
  ],

  [ROLE_IDS.TRAVEL_COMPANY]: [
    'governance:create',
    'governance:update',
    'tours:read',
    'tours:create',
    'tours:update',
    'tours:delete',
    'tour_capacity:read',
    'tour_capacity:create',
    'tour_capacity:update',
    // 'ocop:read',
    // 'ocop:create',
    // 'ocop:update',
    // 'ocop:delete',
    // 'ratings:read',
    // 'ratings:update',
  ],

  [ROLE_IDS.SERVICE_PROVIDER]: [
    'governance:create',
    'governance:update',
    // 'spots_capacity:read',
    // 'spots_capacity:create',
    // 'spots_capacity:update',
    'businesses:read',
    'businesses:create',
    'businesses:update',
    'culinary:read',
    'culinary:create',
    'culinary:update',
    'culinary:delete',
    'ocop:read',
    'ocop:create',
    'ocop:update',
    'ocop:delete',
    'ratings:read',
    'ratings:update',
  ],

  [ROLE_IDS.TOURIST]: [],
} as const satisfies Record<RoleId, readonly AdminPermission[]>

function access(
  permissions: AdminPermission[],
  options: {
    match?: PermissionMatchMode
  } = {}
): PageAccess {
  return { permissions, match: options.match ?? 'any' }
}

function manageAccess(resource: string): PageAccess {
  return access([
    `${resource}:create` as AdminPermission,
    `${resource}:update` as AdminPermission,
    `${resource}:delete` as AdminPermission,
  ])
}

export function getRolePermissionKeys(roleId: number | undefined): AdminPermission[] {
  if (!roleId) return []
  return [...(ROLE_PERMISSION_MAP[roleId as RoleId] ?? [])]
}

export function combineAccess(...items: PageAccess[]): PageAccess {
  return {
    permissions: [...new Set(items.flatMap((item) => item.permissions))],
    match: 'any',
  }
}

export function hasPermission(
  grantedPermissions: readonly string[] | undefined,
  permission: AdminPermission
): boolean {
  return !!grantedPermissions?.some((granted) => granted === '*:*' || granted === permission)
}

export function canAccessPage(
  grantedPermissions: readonly string[] | undefined,
  pageAccess: PageAccess
): boolean {
  if (!pageAccess.permissions.length) return true
  if (!grantedPermissions?.length) return false

  const match = pageAccess.match ?? 'any'
  return match === 'all'
    ? pageAccess.permissions.every((permission) => hasPermission(grantedPermissions, permission))
    : pageAccess.permissions.some((permission) => hasPermission(grantedPermissions, permission))
}

export const PAGE_ACCESS = {
  // Dashboard currently uses `/audit-logs/visitor-statistics`, so it must match backend access.
  dashboard: access(['audit_logs:read']),
  auditLogs: access(['audit_logs:read']),
  // Data files/reporting APIs live under `/statistics` and use analytics permission.
  statistics: access(['analytics:read']),

  // Admin pages require at least one write-level permission, not read-only access.
  governance: access(['governance:create', 'governance:update']),
  users: manageAccess('users'),
  roles: access(['roles:update', 'permissions:update']),
  categories: manageAccess('spot_categories'),
  spots: manageAccess('spots'),
  aframeScenes: access(['spots:update']),
  culinary: manageAccess('culinary'),
  festivals: manageAccess('festivals'),
  ocop: manageAccess('ocop'),
  ratingSpots: access(['ratings:update', 'ratings:delete']),
  tours: manageAccess('tours'),
  capacity: access(['spots_capacity:read', 'tour_capacity:read']),
  spots_capacity: access(['spots_capacity:read']),
  point_capacity: access(['spots_capacity:read']),
  tour_capacity: access(['tour_capacity:read']),
  spotsCapacityCreate: access(['spots_capacity:create']),
  spotsCapacityUpdate: access(['spots_capacity:update']),
  spotsCapacityManage: access(['spots_capacity:create', 'spots_capacity:update']),
  tourCapacityUpdate: access(['tour_capacity:update']),
  capacityCreate: access(['spots_capacity:create']),
  capacityUpdate: access(['spots_capacity:update']),
  capacityManage: access(['spots_capacity:create', 'spots_capacity:update']),
  capacityConfigs: access(['capacity_configs:read', 'capacity_configs:update'], {
    match: 'all',
  }),
  businesses: manageAccess('businesses'),
  ratingBusinesses: access(['ratings:delete']),
  ratingMyBusiness: access(['ratings:update']),
  vlogs: manageAccess('vlogs'),
  news: manageAccess('news'),
  mapAdmin: manageAccess('map_admin'),
  feedbacks: access(['feedbacks:update', 'feedbacks:delete']),
  integrations: manageAccess('integrations'),
} as const
