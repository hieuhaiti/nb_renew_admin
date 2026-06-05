import type { JSX, ReactNode } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import PageLayout from '@/layout/pageLayout'
import AuditLogDetailDialog from './AuditLogDetailDialog'
import { formatDateTime } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
import {
  Activity,
  CalendarIcon,
  Download,
  Globe,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react'
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
  create: 'border-success/20 bg-success/10 text-success',
  update: 'border-primary/20 bg-primary/10 text-primary',
  delete: 'border-destructive/20 bg-destructive/10 text-destructive',
  login: 'border-info/20 bg-info/10 text-info',
  logout: 'border-warning/20 bg-warning/10 text-warning',
}

function ActionBadge({ action }: { action: string }) {
  const parts = action.split('.')
  const verb = parts[parts.length - 1]
  const module = parts.slice(0, -1).join('.')
  const cls = ACTION_VERB_CLASS[verb] ?? 'bg-muted text-muted-foreground border'

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {module && (
        <Badge variant="outline" className="bg-card text-muted-foreground font-mono text-xs">
          {module}
        </Badge>
      )}
      <Badge variant="outline" className={cn('font-mono text-xs', cls)}>
        {verb}
      </Badge>
    </div>
  )
}

type AuditStatTone = 'primary' | 'info' | 'success' | 'warning'

const AUDIT_STAT_TONE_CLASS: Record<AuditStatTone, { icon: string; bar: string }> = {
  primary: { icon: 'bg-primary/10 text-primary ring-primary/15', bar: 'bg-primary' },
  info: { icon: 'bg-info/10 text-info ring-info/15', bar: 'bg-info' },
  success: { icon: 'bg-success/10 text-success ring-success/15', bar: 'bg-success' },
  warning: { icon: 'bg-warning/10 text-warning ring-warning/15', bar: 'bg-warning' },
}

function AuditSummaryCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper: string
  tone?: AuditStatTone
}) {
  const classes = AUDIT_STAT_TONE_CLASS[tone]

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex min-h-28 items-start gap-4 p-5">
        <div className={cn('absolute inset-x-0 top-0 h-1', classes.bar)} />
        <div className={cn('rounded-xl p-3 ring-1', classes.icon)}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-label text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-muted-foreground mt-1 truncate text-xs">{helper}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function getUserInitial(log: AuditLog): string {
  const name = log.user?.full_name?.trim() || log.user?.email?.trim() || 'K'
  return name.charAt(0).toUpperCase()
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
  const visibleUniqueUsers = new Set(
    logs.map((log) => log.user?.email ?? log.user_id).filter(Boolean)
  ).size
  const visibleUniqueIps = new Set(logs.map((log) => log.ip_address).filter(Boolean)).size
  const visibleWriteActions = logs.filter((log) =>
    ['create', 'update', 'delete'].includes(log.action.split('.').pop() ?? '')
  ).length
  const latestActivity = logs[0]?.created_at ? formatDateTime(logs[0].created_at) : '-'

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

    const headers = [
      'ID',
      'Nguoi dung',
      'Email',
      'Hanh dong',
      'Loai thuc the',
      'ID thuc the',
      'IP',
      'Thoi gian',
    ]
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <AuditSummaryCard
            icon={<Activity className="size-5" />}
            label="Tổng bản ghi"
            value={total.toLocaleString('vi-VN')}
            helper={`Trang ${currentPage}/${totalPages}`}
            tone="primary"
          />
          <AuditSummaryCard
            icon={<Users className="size-5" />}
            label="Người dùng"
            value={visibleUniqueUsers.toLocaleString('vi-VN')}
            helper={`Trong ${logs.length} dòng đang xem`}
            tone="info"
          />
          <AuditSummaryCard
            icon={<Globe className="size-5" />}
            label="IP truy cập"
            value={visibleUniqueIps.toLocaleString('vi-VN')}
            helper="Nguồn truy cập trên trang"
            tone="success"
          />
          <AuditSummaryCard
            icon={<ShieldCheck className="size-5" />}
            label="Ghi sửa dữ liệu"
            value={visibleWriteActions.toLocaleString('vi-VN')}
            helper={`Mới nhất: ${latestActivity}`}
            tone="warning"
          />
        </div>

        <ToolTableCustom
          className="border-border/80 shadow-sm"
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
                        onClick={() => {
                          setFromDate('')
                          setCurrentPage(1)
                        }}
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
                        onClick={() => {
                          setToDate('')
                          setCurrentPage(1)
                        }}
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
          <Table className="min-w-[980px]">
            <TableHeader className="bg-muted/40">
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
                    className="hover:bg-primary/5 cursor-pointer"
                    onClick={() => handleViewDetail(log)}
                  >
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      #{log.id}
                    </TableCell>

                    <TableCell>
                      {log.user ? (
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="bg-primary/10 text-primary ring-primary/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1">
                            {getUserInitial(log)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm leading-tight font-medium">
                              {log.user.full_name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {log.user.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                            K
                          </div>
                          <span className="text-muted-foreground text-xs italic">Khách</span>
                        </div>
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
                          {log.entity_id && <p className="font-mono">{log.entity_id}</p>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden font-mono text-xs lg:table-cell">
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
                            <TooltipContent side="left" className="max-w-xs text-xs break-all">
                              {log.user_agent}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs">{formatDateTime(log.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ToolTableCustom>
      </div>

      <AuditLogDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        log={selectedLog}
      />
    </PageLayout>
  )
}
