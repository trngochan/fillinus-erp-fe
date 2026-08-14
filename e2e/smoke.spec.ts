import { expect, test } from '@playwright/test'

// Validates the whole toolchain (dev server auto-start, routing, real DOM render) before any
// flow that depends on the BE actually being up.
test('login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
})
