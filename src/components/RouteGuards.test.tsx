import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './RouteGuards'
import { useAuthStore } from '@/store/authStore'

function setAuth(isAuthenticated: boolean, role?: string) {
  useAuthStore.setState({
    isAuthenticated,
    token: isAuthenticated ? 'jwt-token' : null,
    user: isAuthenticated ? { id: 1, username: 'u', fullName: 'U', role: role ?? 'SALE' } : null,
  })
}

afterEach(() => {
  useAuthStore.setState({ isAuthenticated: false, token: null, user: null })
})

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    setAuth(false)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('renders the nested route (Outlet) when authenticated', () => {
    setAuth(true)
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })
})

describe('PublicRoute', () => {
  it('renders the nested route (Outlet) when not authenticated', () => {
    setAuth(false)
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/sales" element={<div>Sales Dashboard</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects a logged-in SALE user to /sales', () => {
    setAuth(true, 'SALE')
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/sales" element={<div>Sales Dashboard</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Sales Dashboard')).toBeInTheDocument()
  })

  it('redirects a logged-in non-SALE user to /profile', () => {
    setAuth(true, 'ADMIN')
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/sales" element={<div>Sales Dashboard</div>} />
          <Route path="/profile" element={<div>Profile Page</div>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Profile Page')).toBeInTheDocument()
  })
})
