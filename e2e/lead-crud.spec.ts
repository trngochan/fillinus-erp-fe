import { expect, test } from '@playwright/test'
import { loginAsFreshSalesRep } from './helpers'

test('create, edit, and delete a Lead through the UI', async ({ page }) => {
  const me = await loginAsFreshSalesRep(page, 'e2e_crud')

  const leadName = `E2E Lead ${Date.now()}`

  // ── Create ──────────────────────────────────────────────
  await page.getByRole('button', { name: /create lead/i }).click()
  await expect(page.getByRole('heading', { name: 'Create Lead' })).toBeVisible()

  await page.getByPlaceholder('Key person name').fill(leadName)
  await page.getByRole('button', { name: /^Contact/ }).click()
  await page.getByPlaceholder('+84 xxx xxx xxx').fill('0901234567')
  await page.locator('label:text-is("Source *")').locator('xpath=following-sibling::select[1]').selectOption('Inbound')
  await page.locator('label:text-is("Account Type *")').locator('xpath=following-sibling::select[1]').selectOption('New')
  await page.getByLabel('Is this from Digital (Web/Social)?').check()

  // Must assign to self — Edit/Delete are only rendered for leads the current user owns
  // (canManage(lead.salesRepId)), and a SALE user isn't privileged to bypass that check.
  // Selecting by option value (the user id) rather than by label avoids any ambiguity if
  // another SALE user happens to share the same full name.
  const salesRepSelect = page.locator('label:text-is("BD Representative *")').locator('xpath=following-sibling::select[1]')
  await salesRepSelect.selectOption(String(me.id))

  await page.locator('form button[type="submit"]').click()
  await expect(page.getByRole('heading', { name: 'Create Lead' })).toHaveCount(0)
  await expect(page.getByText(leadName)).toBeVisible()

  // ── Edit ────────────────────────────────────────────────
  const row = page.locator('tbody tr', { has: page.getByText(leadName) })
  await row.getByTitle('Edit').click()
  await expect(page.getByRole('heading', { name: 'Edit Lead' })).toBeVisible()
  await page.getByPlaceholder('Company name').fill('E2E Updated Company')
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByRole('heading', { name: 'Edit Lead' })).toHaveCount(0)
  await expect(row.getByText('E2E Updated Company')).toBeVisible()

  // ── Delete ──────────────────────────────────────────────
  await row.getByTitle('Delete').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Delete Lead' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByText(leadName)).toHaveCount(0)
})
