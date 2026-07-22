import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

/** Redirects to /login if not authenticated */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

/** Redirects to /profile if already authenticated */
export function PublicRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/profile" replace /> : <Outlet />
}
