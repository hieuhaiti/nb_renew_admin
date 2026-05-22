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
    <Card className={`flex h-full flex-col overflow-hidden p-6 ${className ?? ''}`}>
      {/* Header sticky section */}
      <div className="bg-card sticky top-0 z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Tìm kiếm..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="text-foreground pr-9 pl-9"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLocalSearch('')
                  setSearchValue('')
                }}
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-2"
              >
                <X className="text-foreground h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="secondary"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="gap-1.5 px-3"
              >
                <RefreshCw className={`h-6 w-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Đang tải...' : 'Tải lại'}
              </Button>
            )}
            {filter}
          </div>
        </div>
      </div>

      {/* Table area with overflow */}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {/* Footer sticky section */}
      <div className="bg-card sticky bottom-0 z-10 pt-4">
        <hr className="mb-4" />
        <div className="flex flex-nowrap items-center justify-between gap-4">
          {/* Left: total count */}
          <span className="text-muted-foreground text-sm whitespace-nowrap">
            Tổng {total ?? ''} mục
          </span>

          {/* Center: pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex min-w-0 flex-1 items-center justify-center">
              <div className="min-w-0 overflow-auto">
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
