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
import { STALE_HOT } from '@/constant/queryConstant'

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

  const handleDateChange = () => {
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
              <TableHead className="w-48">Người dùng</TableHead>
              <TableHead className="w-40">Hành động</TableHead>
              <TableHead className="w-36">Loại thực thể</TableHead>
              <TableHead className="w-36">ID thực thể</TableHead>
              <TableHead className="w-36">IP</TableHead>
              <TableHead className="w-40">Thời gian</TableHead>
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
                  <TableCell className="text-muted-foreground text-xs">{log.id}</TableCell>
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
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{log.entity_type ?? '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entity_id ?? '-'}</TableCell>
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
