import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number          // 0-based
  pageSize: number
  totalElements: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/** Shared pagination bar — page-size is restricted to 10/20/50/100 across all Sales lists. */
export default function Pagination({
  page, pageSize, totalElements, onPageChange, onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize))
  const from = totalElements === 0 ? 0 : page * pageSize + 1
  const to = Math.min(totalElements, (page + 1) * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-800 text-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="input-field py-1.5 px-2 w-auto text-xs"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span className="hidden sm:inline">
          {totalElements === 0 ? 'No results' : `${from}–${to} of ${totalElements}`}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-2 text-slate-400 whitespace-nowrap">
          Page {page + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          className="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
