import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/common/useAuthStore'
import { toast } from 'react-toastify'

/**
 * Wraps routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 * Shows nothing while the session is being initialized.
 */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const isInitializing = useAuthStore((s) => s.isInitializing)
  const loggedOut = useAuthStore((s) => s.loggedOut)

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (!loggedOut) {
      toast.error('Bạn cần đăng nhập để truy cập trang này.', { autoClose: 3000 })
    }
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
