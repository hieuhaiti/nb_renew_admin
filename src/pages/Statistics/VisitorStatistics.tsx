import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, auditLogService } from '@/service'
import type {
  ApiResponse,
  VisitorStatistics,
  VisitorStatisticsTimeSeries,
  VisitorStatisticsTopUser,
  VisitorStatsParams,
} from '@/types/api'
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
import { Users, Globe, Activity, CheckCircle, Clock } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatPeriod } from '@/lib/date'

function StatCard({
  icon,
  label,
  value,
  subLabel,
  colorClass = 'text-primary',
}: {
  icon: JSX.Element
  label: string
  value: string | number
  subLabel?: string
  colorClass?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`bg-muted rounded-full p-3 ${colorClass}`}>{icon}</div>
        <div>
          <p className="text-muted-foreground text-xs">{label}</p>
          <p className="text-2xl font-bold">{value ?? '-'}</p>
          {subLabel && <p className="text-muted-foreground text-xs">{subLabel}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const fmt = (v: string | number | undefined) =>
  v !== undefined && v !== null ? Number(v).toLocaleString('vi-VN') : '-'

const fmtMs = (v: string | number | undefined) =>
  v !== undefined && v !== null ? `${Number(v).toFixed(0)} ms` : '-'

export default function VisitorStatisticsPage(): JSX.Element {
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

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

  const stats = (dbQuery.data as ApiResponse<VisitorStatistics>)?.data
  const overview = stats?.overview
  const timeSeries: VisitorStatisticsTimeSeries[] =
    (stats as any)?.timeSeries ?? (stats as any)?.time_series ?? []
  const topUsers: VisitorStatisticsTopUser[] =
    (stats as any)?.topUsers ?? (stats as any)?.top_users ?? []

  const totalVisits = overview?.total_visits
  const requestsByMethod =
    (overview as any)?.requests_by_method ?? {
      post: (overview as any)?.post_requests,
      put: (overview as any)?.put_requests,
      delete: (overview as any)?.delete_requests,
    }
  const successRateRaw =
    (overview as any)?.success_rate ??
    ((overview as any)?.successful_requests && totalVisits
      ? (Number((overview as any).successful_requests) / Number(totalVisits)) * 100
      : undefined)

  const chartData = [...timeSeries].reverse().map((row) => ({
    period: formatPeriod(row.period, groupBy),
    'Lượt truy cập': Number(row.visits),
    'Người dùng': Number(row.unique_users),
    'IP duy nhất': Number(row.unique_ips),
  }))

  const handleDateChange = (field: 'from' | 'to', val: string) => {
    if (field === 'from') setFromDate(val)
    else setToDate(val)
  }

  return (
    <PageLayout title="Thống kê truy cập" description="Tổng quan lưu lượng truy cập hệ thống">
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-4 p-5">
            <div className="space-y-1">
              <p className="text-xs font-medium">Từ ngày</p>
              <Input
                type="date"
                className="h-9 w-40"
                value={fromDate}
                onChange={(e) => handleDateChange('from', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Đến ngày</p>
              <Input
                type="date"
                className="h-9 w-40"
                value={toDate}
                onChange={(e) => handleDateChange('to', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium">Nhóm theo</p>
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
          </CardContent>
        </Card>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Tổng lượt truy cập"
            value={fmt(overview?.total_visits)}
            colorClass="text-primary"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Người dùng duy nhất"
            value={fmt(overview?.unique_users)}
            colorClass="text-sky-600"
          />
          <StatCard
            icon={<Globe className="h-5 w-5" />}
            label="IP duy nhất"
            value={fmt(overview?.unique_ips)}
            colorClass="text-violet-600"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="Thời gian PH trung bình"
            value={fmtMs(overview?.avg_response_time)}
            colorClass="text-amber-600"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Tỷ lệ thành công"
            value={
              successRateRaw !== undefined && successRateRaw !== null
                ? `${Number(successRateRaw).toFixed(2)}%`
                : '-'
            }
            colorClass="text-emerald-600"
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="POST / PUT / DELETE"
            value={`${fmt((requestsByMethod as any)?.post)} / ${fmt(
              (requestsByMethod as any)?.put
            )} / ${fmt((requestsByMethod as any)?.delete)}`}
            colorClass="text-orange-600"
          />
        </div>

        {/* Time Series Chart */}

        {chartData.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lưu lượng theo thời gian</CardTitle>
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
                  <Bar dataKey="Lượt truy cập" fill="#0369A1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Người dùng" fill="#10B981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="IP duy nhất" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Users Table */}
        {topUsers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Người dùng hoạt động nhiều nhất</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead className="text-right">Số hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((u, idx) => (
                    <TableRow key={`${u.username}-${idx}`}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.full_name}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmt((u as any).visit_count ?? (u as any).action_count)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!dbQuery.isLoading && !overview && (
          <p className="text-muted-foreground py-12 text-center">Chưa có dữ liệu thống kê.</p>
        )}
      </div>
    </PageLayout>
  )
}
