import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** Redirects to /login if not authenticated */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

/** Redirects to /sales (SALE role) or /profile if already authenticated */
export function PublicRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Outlet />
  return <Navigate to={user?.role === 'SALE' ? '/sales' : '/profile'} replace />
}
