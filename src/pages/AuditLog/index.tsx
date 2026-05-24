import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, auditLogService } from '@/service'
import type {
  ApiResponse,
  AuditLog,
  AuditLogListData,
  AuditLogListParams,
  Pagination,
} from '@/types/api'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import PageLayout from '@/layout/pageLayout'
import AuditLogDetailDialog from './AuditLogDetailDialog'
import { formatDateTime } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
import { CalendarIcon, MonitorSmartphone, Download, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr)
  return format(date, 'dd/MM/yyyy', { locale: vi })
}

const ACTION_VERB_CLASS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  update: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  delete: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  login:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
  logout: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
}

function ActionBadge({ action }: { action: string }) {
  const parts = action.split('.')
  const verb = parts[parts.length - 1]
  const module = parts.slice(0, -1).join('.')
  const cls = ACTION_VERB_CLASS[verb] ?? 'bg-muted text-muted-foreground border'

  return (
    <div className="flex items-center gap-1.5">
      {module && (
        <span className="text-muted-foreground font-mono text-xs">{module}</span>
      )}
      <Badge className={cn('border font-mono text-xs', cls)}>{verb}</Badge>
    </div>
  )
}

export default function AuditLogPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(20)
  const [searchValue, setSearchValue] = useState<string>('')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const isInvalidDateRange = Boolean(fromDate && toDate && fromDate > toDate)

  const queryParams: AuditLogListParams = {
    page: currentPage,
    limit,
    ...(searchValue && { search: searchValue }),
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
  }

  const dbQuery = useApiQuery(
    ['audit-logs', queryParams],
    () => auditLogService.getAll(queryParams),
    { enabled: !isInvalidDateRange, staleTime: STALE_HOT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<AuditLogListData>)?.data
  const logs = data?.logs ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setDetailDialogOpen(true)
  }

  const handleSearch = (val: string) => {
    setSearchValue(val)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchValue('')
    setFromDate('')
    setToDate('')
    setCurrentPage(1)
  }

  const handleExportCsv = () => {
    if (!logs.length) return

    const escapeCsv = (value: unknown) => {
      const raw = value == null ? '' : String(value)
      const escaped = raw.replace(/"/g, '""')
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
    }

    const headers = ['ID', 'Nguoi dung', 'Email', 'Hanh dong', 'Loai thuc the', 'ID thuc the', 'IP', 'Thoi gian']
    const rows = logs.map((log) =>
      [
        log.id,
        log.user?.full_name ?? 'Khach',
        log.user?.email ?? '',
        log.action,
        log.entity_type ?? '',
        log.entity_id ?? '',
        log.ip_address ?? '',
        formatDateTime(log.created_at),
      ]
        .map(escapeCsv)
        .join(',')
    )

    const csvText = '﻿' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const hasActiveFilters = Boolean(searchValue) || Boolean(fromDate) || Boolean(toDate)

  return (
    <PageLayout title="Nhật ký hệ thống" description="Theo dõi hoạt động người dùng và hệ thống">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={handleSearch}
        isSearchLoading={dbQuery.isFetching}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={isInvalidDateRange ? undefined : () => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        total={total}
        filter={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
                <SelectItem value="100">100 / trang</SelectItem>
              </SelectContent>
            </Select>

            {/* From date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 w-40 justify-start gap-2 text-left font-normal',
                    !fromDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  {fromDate ? formatDisplayDate(fromDate) : 'Từ ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate ? parseLocalDate(fromDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFromDate(formatToYYYYMMDD(date))
                      setCurrentPage(1)
                    }
                  }}
                  disabled={(date) => (toDate ? date > parseLocalDate(toDate) : false)}
                />
                {fromDate && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => { setFromDate(''); setCurrentPage(1) }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* To date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'h-9 w-40 justify-start gap-2 text-left font-normal',
                    !toDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  {toDate ? formatDisplayDate(toDate) : 'Đến ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate ? parseLocalDate(toDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setToDate(formatToYYYYMMDD(date))
                      setCurrentPage(1)
                    }
                  }}
                  disabled={(date) => (fromDate ? date < parseLocalDate(fromDate) : false)}
                />
                {toDate && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => { setToDate(''); setCurrentPage(1) }}
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={handleExportCsv}
              disabled={!logs.length}
            >
              <Download className="h-3.5 w-3.5" />
              Xuất CSV
            </Button>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-9 gap-1.5"
                onClick={handleResetFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Xóa lọc
              </Button>
            )}
          </div>
        }
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Người dùng</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead className="hidden md:table-cell">Thực thể</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
              <TableHead className="hidden lg:table-cell">Trình duyệt</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInvalidDateRange ? (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive py-8 text-center">
                  Ngày bắt đầu không được lớn hơn ngày kết thúc.
                </TableCell>
              </TableRow>
            ) : dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive py-8 text-center">
                  Không tải được dữ liệu nhật ký.
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Không có bản ghi nào.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => handleViewDetail(log)}
                >
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    #{log.id}
                  </TableCell>

                  <TableCell>
                    {log.user ? (
                      <div>
                        <p className="text-sm leading-tight font-medium">{log.user.full_name}</p>
                        <p className="text-muted-foreground text-xs">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Khách</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    {log.entity_type || log.entity_id ? (
                      <div className="text-xs">
                        {log.entity_type && (
                          <p className="text-muted-foreground">{log.entity_type}</p>
                        )}
                        {log.entity_id && (
                          <p className="font-mono">{log.entity_id}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell font-mono text-xs">
                    {log.ip_address || <span className="text-muted-foreground">—</span>}
                  </TableCell>

                  <TableCell className="hidden lg:table-cell">
                    {log.user_agent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground flex cursor-default items-center gap-1 text-xs">
                              <MonitorSmartphone className="h-3.5 w-3.5 shrink-0" />
                              <span className="max-w-45 truncate">{log.user_agent}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs break-all text-xs">
                            {log.user_agent}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-xs">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <AuditLogDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        log={selectedLog}
      />
    </PageLayout>
  )
}
