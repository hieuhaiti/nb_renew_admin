import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, auditLogService } from '@/service'
import type { ApiResponse, VisitorStatsParams } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Users, Globe, Activity, Layers } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatPeriod } from '@/lib/date'

// ─── Types từ response thực tế ────────────────────────────────────────────────

interface OverviewData {
  total_actions: number
  unique_users: number
  unique_ips: number
  entity_types_affected: number
}

interface TimeSeriesItem {
  period: string
  actions: number
  unique_users: number
}

interface TopActionItem {
  action: string
  entity_type: string | null
  count: number
}

interface StatsData {
  overview: OverviewData
  time_series: TimeSeriesItem[]
  top_actions: TopActionItem[]
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  colorClass = 'text-primary',
}: {
  icon: JSX.Element
  label: string
  value: string | number
  colorClass?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`bg-muted rounded-full p-3 ${colorClass}`}>{icon}</div>
        <div>
          <p className="typo-label text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const fmt = (v: number | undefined) =>
  v !== undefined && v !== null ? v.toLocaleString('vi-VN') : '-'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisitorStatisticsPage(): JSX.Element {
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week')

  const queryParams: VisitorStatsParams = {
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
    group_by: groupBy,
  }

  const dbQuery = useApiQuery(
    ['visitor-statistics', queryParams],
    () => auditLogService.getVisitorStatistics(queryParams),
    {},
    false,
    false
  )

  const stats = (dbQuery.data as ApiResponse<StatsData>)?.data
  const overview = stats?.overview
  const timeSeries: TimeSeriesItem[] = stats?.time_series ?? []
  const topActions: TopActionItem[] = stats?.top_actions ?? []

  const isEmpty =
    !dbQuery.isLoading &&
    overview != null &&
    overview.total_actions === 0 &&
    timeSeries.length === 0 &&
    topActions.length === 0

  const chartData = [...timeSeries].reverse().map((row) => ({
    period: formatPeriod(row.period, groupBy),
    'Hành động': row.actions,
    'Người dùng': row.unique_users,
  }))

  return (
    <PageLayout title="Thống kê truy cập" description="Tổng quan lưu lượng hành động trong hệ thống">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-5">
            <div className="space-y-1">
              <p className="typo-label font-medium">Từ ngày</p>
              <Input
                type="date"
                className="h-9 w-40"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="typo-label font-medium">Đến ngày</p>
              <Input
                type="date"
                className="h-9 w-40"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="typo-label font-medium">Nhóm theo</p>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}
              >
                <SelectTrigger className="h-9 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Ngày</SelectItem>
                  <SelectItem value="week">Tuần</SelectItem>
                  <SelectItem value="month">Tháng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dbQuery.isFetching && (
              <p className="text-muted-foreground self-end pb-1 text-xs">Đang tải...</p>
            )}
            {dbQuery.isError && (
              <p className="text-destructive self-end pb-1 text-sm">Không thể tải dữ liệu.</p>
            )}
          </CardContent>
        </Card>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Activity className="size-5" />}
              label="Tổng hành động"
              value={fmt(overview.total_actions)}
              colorClass="text-primary"
            />
            <StatCard
              icon={<Users className="size-5" />}
              label="Người dùng duy nhất"
              value={fmt(overview.unique_users)}
              colorClass="text-sky-600"
            />
            <StatCard
              icon={<Globe className="size-5" />}
              label="IP duy nhất"
              value={fmt(overview.unique_ips)}
              colorClass="text-violet-600"
            />
            <StatCard
              icon={<Layers className="size-5" />}
              label="Loại đối tượng"
              value={fmt(overview.entity_types_affected)}
              colorClass="text-amber-600"
            />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Activity className="text-muted-foreground size-10" />
              <p className="text-muted-foreground font-medium">Không có dữ liệu trong khoảng thời gian này</p>
              <p className="text-muted-foreground text-sm">
                Thử chọn khoảng thời gian khác hoặc điều chỉnh bộ lọc.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Time Series Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="typo-section-title">Lưu lượng theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value: number | undefined) => (value ?? 0).toLocaleString('vi-VN')}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Hành động" fill="#0369A1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Người dùng" fill="#10B981" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Actions Table */}
        {topActions.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="typo-section-title">Hành động nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Loại đối tượng</TableHead>
                    <TableHead className="w-28 text-right">Số lần</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topActions.map((item, idx) => (
                    <TableRow key={`${item.action}-${idx}`}>
                      <TableCell className="text-muted-foreground typo-table-cell">{idx + 1}</TableCell>
                      <TableCell className="typo-table-cell font-medium">{item.action}</TableCell>
                      <TableCell className="text-muted-foreground typo-table-cell">
                        {item.entity_type ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right font-semibold">
                        {item.count.toLocaleString('vi-VN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
