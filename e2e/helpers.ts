import { expect, type Page } from '@playwright/test'

export interface LoginResponse {
  id: number
  accessToken: string
  username: string
  fullName: string
  role: string
}

/** Registers a throwaway SALE user via the real API and seeds the Zustand auth store's
 *  localStorage key directly — skips repeating the full UI registration flow for tests that
 *  only care about being logged in, per the `persist` shape used by `authStore.ts`. */
export async function loginAsFreshSalesRep(page: Page, namePrefix: string): Promise<LoginResponse> {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const username = `${namePrefix}_${suffix}`

  const res = await page.request.post('/api/auth/register', {
    data: {
      username,
      password: 'password123',
      // Includes the unique suffix, not just namePrefix — repeated test runs otherwise leave
      // behind multiple SALE users with the identical fullName, and selecting a BD
      // Representative by label text (not by id) then risks picking the wrong one.
      fullName: `${namePrefix} Rep ${suffix}`,
      email: `${username}@example.com`,
    },
  })
  const body = await res.json()
  const auth: LoginResponse = body.data

  await page.goto('/login')
  await page.evaluate((authUser) => {
    localStorage.setItem(
      'fillinus-auth',
      JSON.stringify({
        state: {
          token: authUser.accessToken,
          user: { id: authUser.id, username: authUser.username, fullName: authUser.fullName, role: authUser.role },
          isAuthenticated: true,
        },
        version: 0,
      })
    )
  }, auth)
  await page.goto('/sales')
  await expect(page.getByRole('heading', { name: 'LEADS MANAGEMENT' })).toBeVisible()

  return auth
}
