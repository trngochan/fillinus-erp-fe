import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmounts any rendered component tree after each test so DOM state (and matches like
// getByText) don't leak between tests in the same file — RTL's automatic cleanup relies on
// a global `afterEach`, which isn't present since this project doesn't enable Vitest's
// `globals: true`.
afterEach(() => {
  cleanup()
})
