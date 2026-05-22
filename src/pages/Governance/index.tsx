import type { JSX } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/common/useAuthStore'

export default function GovernancePage(): JSX.Element {
  const user = useAuthStore((s) => s.user)
  const roleId = user?.role_id ?? 0

  if (roleId === 1) return <Navigate to="/governance/admin" replace />
  if (roleId === 2) return <Navigate to="/governance/ministry" replace />
  if (roleId === 3) return <Navigate to="/governance/department" replace />
  if (roleId >= 4 && roleId <= 6) return <Navigate to="/governance/enterprise" replace />

  return <Navigate to="/403" replace />
}
