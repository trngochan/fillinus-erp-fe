import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'
import type { LoginResponse } from '@/types/auth'

const loginResponse: LoginResponse = {
  id: 42,
  accessToken: 'jwt-token-123',
  tokenType: 'Bearer',
  expiresIn: 86400,
  username: 'sale01',
  fullName: 'Sale Rep One',
  role: 'SALE',
}

afterEach(() => {
  useAuthStore.getState().logout()
  window.localStorage.clear()
})

describe('authStore', () => {
  it('login() sets token, user, and isAuthenticated from the LoginResponse', () => {
    useAuthStore.getState().login(loginResponse)

    const state = useAuthStore.getState()
    expect(state.token).toBe('jwt-token-123')
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual({ id: 42, username: 'sale01', fullName: 'Sale Rep One', role: 'SALE' })
  })

  it('logout() clears token, user, and isAuthenticated', () => {
    useAuthStore.getState().login(loginResponse)
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('updateUser() merges partial fields into the existing user without touching the token', () => {
    useAuthStore.getState().login(loginResponse)
    useAuthStore.getState().updateUser({ fullName: 'Updated Name' })

    const state = useAuthStore.getState()
    expect(state.user).toEqual({ id: 42, username: 'sale01', fullName: 'Updated Name', role: 'SALE' })
    expect(state.token).toBe('jwt-token-123')
  })

  it('updateUser() is a no-op when there is no logged-in user', () => {
    useAuthStore.getState().updateUser({ fullName: 'Nobody' })
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('persists token/user/isAuthenticated to the "fillinus-auth" localStorage key', () => {
    useAuthStore.getState().login(loginResponse)

    const raw = window.localStorage.getItem('fillinus-auth')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state).toEqual({
      token: 'jwt-token-123',
      user: { id: 42, username: 'sale01', fullName: 'Sale Rep One', role: 'SALE' },
      isAuthenticated: true,
    })
  })
})
