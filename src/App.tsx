import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from '@/components/RouteGuards'
import LoginPage            from '@/pages/LoginPage'
import ForgotPasswordPage   from '@/pages/ForgotPasswordPage'
import ResetPasswordPage    from '@/pages/ResetPasswordPage'
import ProfilePage          from '@/pages/ProfilePage'
import ChangePasswordPage   from '@/pages/ChangePasswordPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public routes (redirect to /profile if already logged in) */}
        <Route element={<PublicRoute />}>
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password"   element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes (redirect to /login if not logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile"                    element={<ProfilePage />} />
          <Route path="/profile/change-password"    element={<ChangePasswordPage />} />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
