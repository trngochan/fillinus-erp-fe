import { expect, test } from '@playwright/test'

// SampleDataSeederService.seedForNewSalesRep() runs 5 chains covering every status on every
// Sales screen right after a new SALE account registers. This automates the exact manual
// verification done by hand during that feature's development: register, then confirm real
// data (not an empty state) shows up on all 5 tabs.
test('registering a new Sales account seeds sample data across all 5 Sales screens', async ({ page }) => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const username = `e2e_${suffix}`

  await page.goto('/register')
  await page.getByLabel('Full Name').fill('E2E Test Rep')
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Password', { exact: true }).fill('password123')
  await page.getByLabel('Confirm Password').fill('password123')
  await page.getByRole('button', { name: /create account/i }).click()

  await expect(page).toHaveURL(/\/sales/)
  await expect(page.getByRole('heading', { name: 'LEADS MANAGEMENT' })).toBeVisible()

  // Leads tab (default landing tab) — seeder always creates "Sample Lead — Fresh Prospect"
  // (not scoped to .first() being THIS user's row: SALE users see all leads, and the seeder
  // doesn't suffix Lead names uniquely, so older runs may have left same-named rows behind).
  await expect(page.getByText('Sample Lead — Fresh Prospect').first()).toBeVisible()
  await expect(page.getByText('No leads found. Create one or import from Excel.')).toHaveCount(0)

  const otherTabs: Array<{ tab: string; emptyStateText: string }> = [
    { tab: 'opportunities', emptyStateText: 'No opportunities yet. Create one or convert a Lead to get started!' },
    { tab: 'quotations', emptyStateText: 'No quotations yet. Create one from an Opportunity.' },
    { tab: 'negotiations', emptyStateText: 'No deal negotiations yet. Start one from a Draft Quotation.' },
    { tab: 'dealResults', emptyStateText: 'No completed deals yet. Complete a Negotiation to record a Won/Lost result.' },
  ]

  for (const { tab, emptyStateText } of otherTabs) {
    await page.goto(`/sales?tab=${tab}`)
    await expect(page.getByText(emptyStateText)).toHaveCount(0)
    await expect(page.locator('tbody tr').first()).toBeVisible()
  }
})
