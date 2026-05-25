import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/common/useAuthStore'

interface RoleGuardProps {
  /** Danh sách role_id được phép truy cập nhóm route này */
  allowedRoles: readonly number[]
}

/**
 * Bảo vệ route theo role_id.
 * Dùng kết hợp với ProtectedRoute (đã kiểm tra isAuthenticated).
 * Nếu user không có role trong allowedRoles → redirect /403.
 */
export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  const roleId = user?.role_id

  if (!roleId || !allowedRoles.includes(roleId)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export default RoleGuard
