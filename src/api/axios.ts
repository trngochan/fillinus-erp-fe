import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

/**
 * BE puts the failure reason in `data.error` (success responses use `data.message` instead —
 * see ApiResponse.java). Reads either so callers show the real reason instead of a generic fallback.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
  return data?.error ?? data?.message ?? fallback
}

/**
 * GlobalExceptionHandler joins @Valid bean-validation failures as "field: message; field2: message2"
 * (nested list items as "details[0].field: message"). Parses that shape so form-level errors can be
 * routed under the offending input instead of a generic top-of-form banner. Returns null when the
 * error string isn't in that shape (e.g. a plain business-rule RuntimeException message) — callers
 * fall back to keyword matching or the banner in that case.
 */
export interface ParsedFieldErrors {
  flat: Record<string, string>
  detail: Record<number, Record<string, string>>
}

export function parseApiFieldErrors(err: unknown): ParsedFieldErrors | null {
  const data = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data
  const raw = data?.error ?? data?.message
  if (!raw) return null

  const flat: Record<string, string> = {}
  const detail: Record<number, Record<string, string>> = {}
  let matched = false

  for (const segment of raw.split('; ')) {
    const m = segment.match(/^([a-zA-Z0-9_]+)(?:\[(\d+)\])?(?:\.([a-zA-Z0-9_]+))?:\s*(.+)$/)
    if (!m) continue
    matched = true
    const [, topField, indexStr, subField, message] = m
    if (indexStr !== undefined && subField) {
      const idx = Number(indexStr)
      detail[idx] = { ...(detail[idx] ?? {}), [subField]: message }
    } else {
      flat[topField] = message
    }
  }
  return matched ? { flat, detail } : null
}

/** Maps a plain business-rule error message (not the "field: message" shape) to a form field via caller-supplied patterns. */
export function matchErrorField(message: string, rules: Array<[RegExp, string]>): string | null {
  for (const [pattern, field] of rules) {
    if (pattern.test(message)) return field
  }
  return null
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

// ─── Request interceptor — attach JWT token ───────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor — handle 401 ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
