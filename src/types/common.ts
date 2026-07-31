// ─── Shared pagination wrapper — matches BE common/PageResponse.java ──────────

export interface PageResponse<T> {
  content: T[]
  page: number       // 0-based
  pageSize: number
  totalElements: number
  totalPages: number
}
