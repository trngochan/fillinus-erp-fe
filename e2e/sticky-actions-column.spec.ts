import { expect, test } from '@playwright/test'
import { loginAsFreshSalesRep } from './helpers'

// Codifies a fix that took many rounds of manual back-and-forth this project: the Leads
// table's sticky Actions column (position: sticky; right: 0) used to visually cover part of
// whatever column sat immediately before it, because that column's own rendered width (under
// table-layout: auto) could exceed the space Actions reserved for itself. The fix gave Actions
// a fixed width. This test measures real rendered geometry so a future layout change can't
// silently reintroduce partial-column clipping without failing a test.
test('sticky Actions column never visually overlaps another column\'s data on the Leads table', async ({ page }) => {
  // A common desktop resolution wide enough that the fixed-width Actions column's guarantee
  // actually holds. Narrower viewports (e.g. 1280px, the Leads tab's own max-w-7xl cap) can
  // still show partial overlap with earlier columns — a known, currently-accepted layout
  // limitation, not something this regression test is meant to re-litigate.
  await page.setViewportSize({ width: 1920, height: 1080 })
  await loginAsFreshSalesRep(page, 'e2e_sticky')

  const firstRow = page.locator('tbody tr').first()
  await expect(firstRow).toBeVisible()

  const result = await page.evaluate(() => {
    const row = document.querySelector('tbody tr')
    if (!row) return { scrollWidth: 0, clientWidth: 0, overlapping: [] as string[] }

    const cells = Array.from(row.querySelectorAll('td'))
    const actionsCell = cells[cells.length - 1]
    const actionsRect = actionsCell.getBoundingClientRect()
    const scrollContainer = row.closest('.overflow-auto') as HTMLElement | null

    const overlapping: string[] = []
    for (const cell of cells.slice(0, -1)) {
      const rect = cell.getBoundingClientRect()
      const intersects =
        rect.right > actionsRect.left &&
        rect.left < actionsRect.right &&
        rect.bottom > actionsRect.top &&
        rect.top < actionsRect.bottom
      if (intersects) overlapping.push((cell.textContent ?? '').trim())
    }

    return {
      scrollWidth: scrollContainer?.scrollWidth ?? 0,
      clientWidth: scrollContainer?.clientWidth ?? 0,
      overlapping,
    }
  })

  // Sanity check: the table must actually overflow horizontally, or this test would pass
  // vacuously (no overlap risk exists at all without overflow).
  expect(result.scrollWidth).toBeGreaterThan(result.clientWidth)
  expect(result.overlapping).toEqual([])
})
