import type { JSX, ReactNode } from 'react'
import { useState } from 'react'
import { useApiQuery, auditLogService } from '@/service'
import type {
  VisitorStatisticsOverview,
  VisitorStatisticsTimeSeries,
  VisitorStatisticsTopAction,
  VisitorStatsParams,
} from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, Globe, Activity, Layers, RotateCcw, TrendingUp } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatPeriod } from '@/lib/date'
import { cn } from '@/lib/utils'

type OverviewData = Record<keyof VisitorStatisticsOverview, number>
type TimeSeriesItem = Omit<VisitorStatisticsTimeSeries, 'actions' | 'unique_users'> & {
  actions: number
  unique_users: number
}
type TopActionItem = Omit<VisitorStatisticsTopAction, 'count'> & { count: number }

// ─── Components ───────────────────────────────────────────────────────────────

type StatTone = 'primary' | 'info' | 'success' | 'warning'

const STAT_TONE_CLASS: Record<StatTone, { icon: string; bar: string }> = {
  primary: { icon: 'bg-primary/10 text-primary ring-primary/15', bar: 'bg-primary' },
  info: { icon: 'bg-info/10 text-info ring-info/15', bar: 'bg-info' },
  success: { icon: 'bg-success/10 text-success ring-success/15', bar: 'bg-success' },
  warning: { icon: 'bg-warning/10 text-warning ring-warning/15', bar: 'bg-warning' },
}

function StatCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper?: string
  tone?: StatTone
}) {
  const classes = STAT_TONE_CLASS[tone]

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex min-h-28 items-start gap-4 p-5">
        <div className={cn('absolute inset-x-0 top-0 h-1', classes.bar)} />
        <div className={cn('rounded-xl p-3 ring-1', classes.icon)}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-label text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          {helper && <p className="text-muted-foreground mt-1 text-xs">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const toNumber = (value: string | number | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const fmt = (value: string | number | null | undefined) => toNumber(value).toLocaleString('vi-VN')

function normalizeOverview(overview?: VisitorStatisticsOverview): OverviewData | undefined {
  if (!overview) return undefined

  return {
    total_actions: toNumber(overview.total_actions),
    unique_users: toNumber(overview.unique_users),
    unique_ips: toNumber(overview.unique_ips),
    entity_types_affected: toNumber(overview.entity_types_affected),
  }
}

function normalizeTimeSeries(items?: VisitorStatisticsTimeSeries[]): TimeSeriesItem[] {
  return (items ?? []).map((item) => ({
    period: item.period,
    actions: toNumber(item.actions),
    unique_users: toNumber(item.unique_users),
  }))
}

function normalizeTopActions(items?: VisitorStatisticsTopAction[]): TopActionItem[] {
  return (items ?? []).map((item) => ({
    action: item.action,
    entity_type: item.entity_type,
    count: toNumber(item.count),
  }))
}

const ACTION_VERB_CLASS: Record<string, string> = {
  create: 'border-success/20 bg-success/10 text-success',
  update: 'border-primary/20 bg-primary/10 text-primary',
  delete: 'border-destructive/20 bg-destructive/10 text-destructive',
  login: 'border-info/20 bg-info/10 text-info',
  logout: 'border-warning/20 bg-warning/10 text-warning',
}

function splitAction(action: string) {
  const parts = action.split('.').filter(Boolean)
  const verb = parts.pop() ?? action
  return { module: parts.join('.'), verb }
}

function ActionBadge({ action }: { action: string }) {
  const { module, verb } = splitAction(action)
  const cls = ACTION_VERB_CLASS[verb] ?? 'border-border bg-muted/50 text-muted-foreground'

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

function getGroupByLabel(groupBy: 'day' | 'week' | 'month') {
  if (groupBy === 'day') return 'ngày'
  if (groupBy === 'month') return 'tháng'
  return 'tuần'
}

type TrafficChartKey = 'Hành động' | 'Người dùng'

function TrafficChart({
  title,
  description,
  badgeClassName,
  dataKey,
  fill,
  data,
}: {
  title: string
  description: string
  badgeClassName: string
  dataKey: TrafficChartKey
  fill: string
  data: Array<{ period: string } & Record<TrafficChartKey, number>>
}) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="typo-section-title">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge className={badgeClassName}>{dataKey}</Badge>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height={288} minWidth={0} minHeight={288}>
            <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--primary) / 0.06)' }}
                contentStyle={{
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 12,
                }}
                formatter={(value: string | number | undefined) => fmt(value)}
              />
              <Bar dataKey={dataKey} fill={fill} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisitorStatisticsPage(): JSX.Element {
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week')
  const isInvalidDateRange = Boolean(fromDate && toDate && fromDate > toDate)

  const queryParams: VisitorStatsParams = {
    ...(fromDate && { from_date: fromDate }),
    ...(toDate && { to_date: toDate }),
    group_by: groupBy,
  }

  const dbQuery = useApiQuery(
    ['visitor-statistics', queryParams],
    () => auditLogService.getVisitorStatistics(queryParams),
    { enabled: !isInvalidDateRange },
    false,
    false
  )

  const stats = dbQuery.data?.data
  const overview = normalizeOverview(stats?.overview)
  const timeSeries = normalizeTimeSeries(stats?.time_series)
  const topActions = normalizeTopActions(stats?.top_actions)

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
  const maxActionCount = Math.max(...topActions.map((item) => item.count), 1)
  const totalActions =
    overview?.total_actions ?? topActions.reduce((sum, item) => sum + item.count, 0)
  const groupByLabel = getGroupByLabel(groupBy)
  const hasActiveFilters = Boolean(fromDate) || Boolean(toDate) || groupBy !== 'week'

  const handleResetFilters = () => {
    setFromDate('')
    setToDate('')
    setGroupBy('week')
  }

  return (
    <PageLayout
      title="Thống kê truy cập"
      description="Tổng quan lưu lượng hành động, người dùng và IP truy cập trong hệ thống"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-border/80 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="typo-section-title">Bộ lọc dữ liệu</p>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    Theo {groupByLabel}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Dữ liệu được tổng hợp từ nhật ký hệ thống và cập nhật theo bộ lọc thời gian.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
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
            </div>

            <div className="mt-4 min-h-5">
              {isInvalidDateRange && (
                <p className="text-destructive text-sm">
                  Ngày bắt đầu không được lớn hơn ngày kết thúc.
                </p>
              )}
              {!isInvalidDateRange && dbQuery.isFetching && (
                <p className="text-muted-foreground text-xs">Đang tải dữ liệu mới...</p>
              )}
              {!isInvalidDateRange && dbQuery.isError && (
                <p className="text-destructive text-sm">Không thể tải dữ liệu.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Activity className="size-5" />}
              label="Tổng hành động"
              value={fmt(overview.total_actions)}
              helper={`Ghi nhận theo ${groupByLabel}`}
              tone="primary"
            />
            <StatCard
              icon={<Users className="size-5" />}
              label="Tài khoản người dùng"
              value={fmt(overview.unique_users)}
              helper="Tài khoản có phát sinh log"
              tone="info"
            />
            <StatCard
              icon={<Globe className="size-5" />}
              label="IP duy nhất"
              value={fmt(overview.unique_ips)}
              helper="Nguồn truy cập khác nhau"
              tone="success"
            />
            <StatCard
              icon={<Layers className="size-5" />}
              label="Loại đối tượng"
              value={fmt(overview.entity_types_affected)}
              helper="Nhóm dữ liệu bị tác động"
              tone="warning"
            />
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Activity className="text-muted-foreground size-10" />
              <p className="text-muted-foreground font-medium">
                Không có dữ liệu trong khoảng thời gian này
              </p>
              <p className="text-muted-foreground text-sm">
                Thử chọn khoảng thời gian khác hoặc điều chỉnh bộ lọc.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Time Series Charts */}
        {chartData.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-2">
            <TrafficChart
              title="Lưu lượng hành động"
              description={`Tổng số thao tác được ghi nhận theo từng ${groupByLabel}.`}
              badgeClassName="border-primary/20 bg-primary/10 text-primary"
              dataKey="Hành động"
              fill="hsl(var(--chart-1))"
              data={chartData}
            />
            <TrafficChart
              title="Lưu lượng người dùng"
              description={`Số tài khoản người dùng có phát sinh hoạt động theo từng ${groupByLabel}.`}
              badgeClassName="border-info/20 bg-info/10 text-info"
              dataKey="Người dùng"
              fill="hsl(var(--chart-2))"
              data={chartData}
            />
          </div>
        )}

        {/* Top Actions Table */}
        {topActions.length > 0 && (
          <Card className="border-border/80 overflow-hidden shadow-sm">
            <CardHeader className="flex flex-col gap-2 pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="typo-section-title">Hành động nhiều nhất</CardTitle>
                <CardDescription>
                  Xếp hạng theo tần suất để nhận diện luồng nghiệp vụ được sử dụng nhiều.
                </CardDescription>
              </div>
              <Badge className="border-success/20 bg-success/10 text-success">
                <TrendingUp className="mr-1 h-3.5 w-3.5" />
                {fmt(totalActions)} lượt
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[720px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Loại đối tượng</TableHead>
                    <TableHead className="w-56">Tỷ trọng</TableHead>
                    <TableHead className="w-28 text-right">Số lần</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topActions.map((item, idx) => {
                    const percent =
                      totalActions > 0 ? Math.round((item.count / totalActions) * 100) : 0
                    const width = Math.max(4, Math.round((item.count / maxActionCount) * 100))

                    return (
                      <TableRow
                        key={`${item.action}-${item.entity_type ?? 'system'}`}
                        className="hover:bg-primary/5"
                      >
                        <TableCell className="typo-table-cell">
                          <span className="bg-muted text-muted-foreground inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                            {idx + 1}
                          </span>
                        </TableCell>
                        <TableCell className="typo-table-cell font-medium">
                          <ActionBadge action={item.action} />
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          {item.entity_type ? (
                            <Badge variant="outline" className="bg-card text-muted-foreground">
                              {item.entity_type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Toàn hệ thống</span>
                          )}
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          <div className="flex items-center gap-3">
                            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                              <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
                              {percent}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="typo-table-cell text-right font-semibold tabular-nums">
                          {fmt(item.count)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
