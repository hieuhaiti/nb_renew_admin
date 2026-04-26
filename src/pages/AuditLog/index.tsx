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
import PageLayout from '@/layout/pageLayout'
import AuditLogDetailDialog from './AuditLogDetailDialog'
import { formatDateTime } from '@/lib/date'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Parse YYYY-MM-DD string to local Date (tránh timezone issue) */
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Format Date to YYYY-MM-DD (local date, không qua UTC) */
const formatToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Display date as DD/MM/YYYY (local) */
const formatDisplayDate = (dateStr: string): string => {
  const date = parseLocalDate(dateStr)
  return format(date, 'dd/MM/yyyy', { locale: vi })
}

function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    GET: 'bg-sky-100 text-sky-700 border-sky-200',
    POST: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    PUT: 'bg-amber-100 text-amber-700 border-amber-200',
    PATCH: 'bg-violet-100 text-violet-700 border-violet-200',
    DELETE: 'bg-red-100 text-red-700 border-red-200',
  }
  const cls = map[method] ?? 'bg-slate-100 text-slate-600 border-slate-200'
  return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>{method}</span>
}

function StatusBadge({ code }: { code: number }) {
  let cls = 'bg-slate-100 text-slate-600 border-slate-200'
  if (code >= 200 && code < 300) cls = 'bg-emerald-100 text-emerald-700 border-emerald-200'
  else if (code >= 400 && code < 500) cls = 'bg-amber-100 text-amber-700 border-amber-200'
  else if (code >= 500) cls = 'bg-red-100 text-red-700 border-red-200'
  return <span className={`rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>{code}</span>
}

export default function AuditLogPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(20)
  const [searchValue, setSearchValue] = useState<string>('')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [statusCodeFilter, setStatusCodeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const isInvalidDateRange = Boolean(fromDate && toDate && fromDate > toDate)

  const queryParams: AuditLogListParams = {
    page: currentPage,
    limit,
    ...(searchValue && { search: searchValue }),
    ...(methodFilter !== 'all' && { method: methodFilter as HttpMethod }),
    ...(statusCodeFilter !== 'all' && { status_code: Number(statusCodeFilter) }),
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
  }

  const dbQuery = useApiQuery(
    ['audit-logs', queryParams],
    () => auditLogService.getAll(queryParams),
    { enabled: !isInvalidDateRange },
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

  // Detail dialog state
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

  const handleMethodChange = (val: string) => {
    setMethodFilter(val)
    setCurrentPage(1)
  }

  const handleDateChange = () => {
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setSearchValue('')
    setMethodFilter('all')
    setStatusCodeFilter('all')
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

    const headers = [
      'ID',
      'Nguoi dung',
      'Username',
      'Hanh dong',
      'Method',
      'Endpoint',
      'Status',
      'Response time (ms)',
      'IP',
      'Created at',
    ]

    const rows = logs.map((log) =>
      [
        log.id,
        log.user?.full_name ?? 'Khach',
        log.user?.username ?? '',
        log.action,
        log.method,
        log.endpoint,
        log.status_code,
        log.response_time_ms ?? '',
        log.ip_address ?? '',
        formatDateTime(log.created_at),
      ]
        .map(escapeCsv)
        .join(',')
    )

    const csvText = '\ufeff' + [headers.join(','), ...rows].join('\n')
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

  const hasActiveFilters =
    Boolean(searchValue) ||
    methodFilter !== 'all' ||
    statusCodeFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate)

  return (
    <PageLayout title="Nhật ký hệ thống" description="Theo dõi hoạt động người dùng và hệ thống">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={handleSearch}
        isSearchLoading={dbQuery.isFetching}
        total={total}
        filter={
          <div className="space-y-3">
            {/* Row 1: Method & Status filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Method filter */}
              <Select value={methodFilter} onValueChange={handleMethodChange}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương thức</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>

              {/* Status code filter */}
              <Select
                value={statusCodeFilter}
                onValueChange={(val) => {
                  setStatusCodeFilter(val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Mã trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mã</SelectItem>
                  <SelectItem value="200">200 - OK</SelectItem>
                  <SelectItem value="201">201 - Created</SelectItem>
                  <SelectItem value="204">204 - No Content</SelectItem>
                  <SelectItem value="400">400 - Bad Request</SelectItem>
                  <SelectItem value="401">401 - Unauthorized</SelectItem>
                  <SelectItem value="403">403 - Forbidden</SelectItem>
                  <SelectItem value="404">404 - Not Found</SelectItem>
                  <SelectItem value="422">422 - Validation Error</SelectItem>
                  <SelectItem value="500">500 - Server Error</SelectItem>
                  <SelectItem value="503">503 - Service Unavailable</SelectItem>
                </SelectContent>
              </Select>

              {/* Rows per page */}
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => dbQuery.refetch()}
                disabled={dbQuery.isFetching || isInvalidDateRange}
              >
                Làm mới
              </Button>
            </div>

            {/* Row 2: Date range, Rows per page, Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* From date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-40 justify-start text-left font-normal"
                  >
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
                        handleDateChange()
                      }
                    }}
                    disabled={(date) => (toDate ? date > parseLocalDate(toDate) : false)}
                  />
                </PopoverContent>
              </Popover>

              {/* To date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-40 justify-start text-left font-normal"
                  >
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
                        handleDateChange()
                      }
                    }}
                    disabled={(date) => (fromDate ? date < parseLocalDate(fromDate) : false)}
                  />
                </PopoverContent>
              </Popover>

              {/* Export CSV */}
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={handleExportCsv}
                disabled={!logs.length}
              >
                Xuất CSV
              </Button>

              {/* Reset filters */}
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                Xóa lọc
              </Button>
            </div>
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
              <TableHead className="w-14">ID</TableHead>
              <TableHead className="w-44">Người dùng</TableHead>
              <TableHead className="w-40">Hành động</TableHead>
              <TableHead className="w-24">Phương thức</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead className="w-24">Mã TT</TableHead>
              <TableHead className="w-28">Thời gian PH</TableHead>
              <TableHead className="w-36">IP</TableHead>
              <TableHead className="w-40">Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isInvalidDateRange ? (
              <TableRow>
                <TableCell colSpan={9} className="text-destructive py-8 text-center">
                  Ngày bắt đầu không được lớn hơn ngày kết thúc.
                </TableCell>
              </TableRow>
            ) : dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-destructive py-8 text-center">
                  Không tải được dữ liệu nhật ký.
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
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
                  <TableCell className="text-muted-foreground text-xs">{log.id}</TableCell>
                  <TableCell>
                    {log.user ? (
                      <div>
                        <p className="text-sm leading-tight font-medium">{log.user.full_name}</p>
                        <p className="text-muted-foreground text-xs">{log.user.username}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Khách</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <MethodBadge method={log.method} />
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate font-mono text-xs"
                    title={log.endpoint}
                  >
                    {log.endpoint}
                  </TableCell>
                  <TableCell>
                    <StatusBadge code={log.status_code} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.response_time_ms !== undefined ? `${log.response_time_ms} ms` : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                  <TableCell className="text-xs">{formatDateTime(log.created_at)}</TableCell>
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
