import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/common/useAuthStore'
import { canAccessPage, type PageAccess } from '@/constant/permissionConstant'
import { ROLE_IDS } from '@/constant/roleConstant'

interface RoleGuardProps {
  /** Permission requirements for this route group. */
  access?: PageAccess
  /** Optional role scope for pages whose UI is role-specific. */
  allowedRoles?: readonly number[]
}

/**
 * Bảo vệ route theo permission hiện tại của user.
 * Dùng kết hợp với ProtectedRoute (đã kiểm tra isAuthenticated).
 * Nếu user thiếu permission cần thiết → redirect /403.
 */
export function RoleGuard({ access, allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  const permissions = useAuthStore((s) => s.permissions)
  const roleId = user?.role_id

  // Khach du lich la role public app, khong duoc truy cap bat ky route admin nao.
  if (roleId === ROLE_IDS.TOURIST) {
    return <Navigate to="/403" replace />
  }

  if (access && !canAccessPage(permissions, access)) {
    return <Navigate to="/403" replace />
  }

  if (allowedRoles && (!roleId || !allowedRoles.includes(roleId))) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export default RoleGuard
