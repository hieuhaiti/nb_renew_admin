import { type ReactNode, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  PaginationCustom,
  type PaginationCustomProps,
} from '@/components/features/PaginationCustom'
import { RefreshCw, Search, X } from 'lucide-react'
import { Input } from '../ui/input'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '../ui/button'

type Props = {
  searchValue: string
  setSearchValue: (value: string) => void
  isSearchLoading?: boolean
  filter?: ReactNode
  children: ReactNode
  total?: number
  pagination?: PaginationCustomProps
  className?: string
  /** timestamp từ query.dataUpdatedAt — hiển thị thời điểm cache ở footer */
  dataUpdatedAt?: number
  /** callback khi bấm nút refresh */
  onRefresh?: () => void
  /** true khi query đang refetch (query.isFetching && !query.isLoading) */
  isRefreshing?: boolean
}

export default function ToolTableCustom({
  className,
  searchValue,
  setSearchValue,
  filter,
  children,
  pagination,
  total,
  dataUpdatedAt,
  onRefresh,
  isRefreshing,
}: Props) {
  const [localSearch, setLocalSearch] = useState<string>(searchValue)
  const debounced = useDebounce<string>(localSearch, 400)

  useEffect(() => {
    // keep local input in sync when parent changes searchValue
    setLocalSearch(searchValue)
  }, [searchValue])

  useEffect(() => {
    // propagate debounced value to parent
    if (debounced !== searchValue) setSearchValue(debounced)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  return (
    <Card className={`flex h-full flex-col overflow-hidden p-3 sm:p-4 md:p-6 shadow-xs ${className ?? ''}`}>
      {/* Header sticky section */}
      <div className="bg-card sticky top-0 z-10 pb-3 sm:pb-4 border-b border-border/40">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform pointer-events-none" />
            <Input
              id="tool-table-search"
              name="search"
              aria-label="Tìm kiếm dữ liệu"
              placeholder="Tìm kiếm..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="text-foreground pr-9 pl-9 w-full"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={() => {
                  setLocalSearch('')
                  setSearchValue('')
                }}
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Tải lại danh sách"
                className="gap-1.5 px-3 h-9 text-xs sm:text-sm font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Đang tải...' : 'Tải lại'}</span>
              </Button>
            )}
            {filter}
          </div>
        </div>
      </div>

      {/* Table area with overflow */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto pt-2">{children}</div>

      {/* Footer sticky section */}
      <div className="bg-card sticky bottom-0 z-10 pt-3 sm:pt-4 border-t border-border/40 mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Left: total count */}
          <span className="text-muted-foreground whitespace-nowrap font-medium">
            Tổng {total !== undefined ? Number(total).toLocaleString('vi-VN') : ''} mục
          </span>

          {/* Center: pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex min-w-0 w-full sm:w-auto items-center justify-center">
              <div className="min-w-0 overflow-x-auto max-w-full">
                <PaginationCustom {...pagination} />
              </div>
            </div>
          )}

          {/* Right: cache timestamp */}
          {dataUpdatedAt && dataUpdatedAt > 0 ? (
            <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
              Cập nhật lúc{' '}
              {new Date(dataUpdatedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          ) : (
            <span />
          )}
        </div>
      </div>
    </Card>
  )
}

export { ToolTableCustom }
