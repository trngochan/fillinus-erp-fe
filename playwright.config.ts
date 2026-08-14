import { defineConfig, devices } from '@playwright/test'

// True end-to-end tests against the real API — no mocking layer exists in this app.
// Precondition: the BE must already be running locally (fillinus-erp: `./gradlew bootRun`)
// with its Postgres container up (`docker-compose up` in that repo), since these specs
// register real users, create real Leads, etc. This config only starts the FE dev server.
export default defineConfig({
  testDir: './e2e',
  // Serial, not parallel: these specs register real users against the shared local dev
  // database, and SALE users see ALL leads ("View All" permission model) — concurrent
  // registrations from parallel workers bleed into each other's assertions otherwise.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
