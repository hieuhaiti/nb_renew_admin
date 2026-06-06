import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, governanceService, businessService } from '@/service'
import type {
  ApiResponse,
  GovernanceEnterpriseDashboard,
  GovernanceEnterpriseFeedback,
} from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/common/SearchSelect'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  DollarSign,
  MapPin,
  Percent,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDate, formatDateTime } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'

// ─── Status maps ──────────────────────────────────────────────────────────────

const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
}
const FEEDBACK_STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning',
  in_progress: 'bg-blue-500',
  resolved: 'bg-success',
  rejected: 'bg-destructive',
}
const FEEDBACK_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  resolved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

const BUSINESS_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  suspended: 'Tạm khóa',
}

const BUSINESS_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted text-muted-foreground border-border',
}

const CAPACITY_STATUS_LABEL: Record<string, string> = {
  normal: 'Bình thường',
  busy: 'Đông khách',
  near_full: 'Gần đầy',
  overloaded: 'Quá tải',
}

const CAPACITY_STATUS_BADGE: Record<string, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeList(data: unknown, keys: string[]): any[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const r = data as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(r[key])) return r[key] as any[]
  }
  for (const topKey of ['data', 'items']) {
    if (r[topKey] && typeof r[topKey] === 'object' && !Array.isArray(r[topKey])) {
      const nested = r[topKey] as Record<string, unknown>
      for (const key of keys) {
        if (Array.isArray(nested[key])) return nested[key] as any[]
      }
    }
    if (Array.isArray(r[topKey])) return r[topKey] as any[]
  }
  return []
}

function toNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatNumber(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : parsed.toLocaleString('vi-VN')
}

function formatCurrency(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(parsed)
}

function formatCompactCurrency(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  if (parsed >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ`
  if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(0)} tr`
  return formatCurrency(parsed)
}

function formatCompactNumber(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)} tr`
  if (parsed >= 1_000) return `${(parsed / 1_000).toFixed(1)} k`
  return parsed.toLocaleString('vi-VN')
}

function formatPercent(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : `${parsed.toFixed(1)}%`
}

function StatCard({
  icon,
  label,
  value,
  helper,
  colorClass = 'text-primary',
}: {
  icon: JSX.Element
  label: string
  value: string | number
  helper?: string
  colorClass?: string
}) {
  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex items-start gap-4 p-5">
        <div className={`absolute inset-x-0 top-0 h-1 bg-current opacity-70 ${colorClass}`} />
        <div className={`bg-muted ring-border/70 rounded-xl p-3 ring-1 ${colorClass}`}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-label text-muted-foreground">{label}</p>
          <p className="typo-section-title mt-1 truncate">{value ?? '-'}</p>
          {helper && <p className="typo-caption text-muted-foreground mt-1">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function BusinessSnapshot({ dashboard }: { dashboard: GovernanceEnterpriseDashboard }) {
  const business = (dashboard.business ?? {}) as Record<string, unknown>
  const summary = dashboard.summary ?? {}
  const period =
    dashboard.period && typeof dashboard.period === 'object' ? dashboard.period : undefined
  const status = String(business.status ?? '')
  const name = String(business.business_name ?? business.name ?? 'Doanh nghiệp')
  const businessCode = String(business.business_code ?? business.tax_id ?? '')

  return (
    <div className="border-border/80 bg-card rounded-lg border p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="typo-page-title truncate">{name}</h2>
            {status && (
              <Badge className={BUSINESS_STATUS_BADGE[status] ?? 'bg-muted text-muted-foreground'}>
                {BUSINESS_STATUS_LABEL[status] ?? status}
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="text-primary size-4 shrink-0" />
              <span className="truncate">{businessCode || '-'}</span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <MapPin className="text-primary size-4 shrink-0" />
              <span className="truncate">{String(business.address_vi ?? '-')}</span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <CalendarDays className="text-primary size-4 shrink-0" />
              <span className="truncate">
                {period?.from && period?.to
                  ? `${formatDate(period.from)} - ${formatDate(period.to)}`
                  : 'Kỳ hiện tại'}
              </span>
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <Star className="text-warning size-4 shrink-0" />
              <span className="truncate">
                {formatNumber(business.rating_count)} đánh giá, TB{' '}
                {formatNumber(business.rating_avg)}
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <div className="bg-primary/5 rounded-md p-3">
            <p className="typo-caption text-muted-foreground">Báo cáo</p>
            <p className="typo-body-sm text-primary mt-1 font-semibold">
              {formatNumber(summary.report_count)}
            </p>
          </div>
          <div className="bg-success/5 rounded-md p-3">
            <p className="typo-caption text-muted-foreground">Doanh thu</p>
            <p className="typo-body-sm text-success mt-1 font-semibold">
              {formatCompactCurrency(summary.total_revenue_vnd ?? dashboard.total_revenue_vnd)}
            </p>
          </div>
          <div className="bg-warning/5 rounded-md p-3">
            <p className="typo-caption text-muted-foreground">Sức chứa</p>
            <p className="typo-body-sm text-warning mt-1 font-semibold">
              {formatPercent(summary.avg_capacity_pct ?? dashboard.capacity_pct)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueTrendCard({
  items,
}: {
  items: NonNullable<GovernanceEnterpriseDashboard['revenue_trend']>
}) {
  const chartData = items.map((item) => ({
    period: item.period ?? '-',
    revenue: toNumber(item.revenue_vnd) ?? 0,
    bookings: toNumber(item.bookings) ?? 0,
    visitors: toNumber(item.visitors) ?? 0,
  }))
  const latest = chartData.at(-1)
  const previous = chartData.at(-2)
  const revenueDelta =
    latest && previous && previous.revenue > 0
      ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
      : undefined

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="typo-section-title">Xu hướng doanh thu</CardTitle>
            <CardDescription>
              Doanh thu, lượt đặt chỗ và lượt khách theo kỳ báo cáo.
            </CardDescription>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {revenueDelta == null
              ? 'Chưa đủ kỳ'
              : `${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(1)}%`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chartData.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-6 text-center">
            <p className="typo-body-sm font-semibold">Chưa có dữ liệu xu hướng</p>
            <p className="typo-caption text-muted-foreground mt-1">
              Khi có báo cáo doanh nghiệp, biểu đồ sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={320}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminEnterpriseRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.26} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={54}
                    tickFormatter={formatCompactCurrency}
                  />
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={42}
                    tickFormatter={formatCompactNumber}
                  />
                  <Tooltip
                    contentStyle={{
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 8,
                      boxShadow: 'var(--shadow-md)',
                      fontSize: 12,
                    }}
                    formatter={(value, name) => {
                      if (name === 'Doanh thu') return [formatCurrency(value), name]
                      return [formatNumber(value), name]
                    }}
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu"
                    fill="url(#adminEnterpriseRevenueFill)"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="volume"
                    dataKey="visitors"
                    name="Lượt khách"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.74}
                    radius={[4, 4, 0, 0]}
                    barSize={22}
                  />
                  <Line
                    yAxisId="volume"
                    type="monotone"
                    dataKey="bookings"
                    name="Đặt chỗ"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2.5}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {chartData.map((item) => (
                <div key={item.period} className="border-border rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="typo-body-sm font-semibold">{item.period}</p>
                    <p className="typo-body-sm text-primary font-semibold">
                      {formatCompactCurrency(item.revenue)}
                    </p>
                  </div>
                  <p className="typo-caption text-muted-foreground mt-1">
                    {formatNumber(item.visitors)} khách · {formatNumber(item.bookings)} đặt chỗ
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CapacityAlertsCard({
  alerts,
}: {
  alerts: NonNullable<GovernanceEnterpriseDashboard['capacity_alerts']>
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="typo-section-title">Cảnh báo sức chứa</CardTitle>
        <CardDescription>Các điểm liên quan cần theo dõi trong kỳ đang xem.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-5 text-center">
            <p className="typo-body-sm font-semibold">Không có cảnh báo</p>
            <p className="typo-caption text-muted-foreground mt-1">
              Chưa ghi nhận điểm gần đầy hoặc quá tải.
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const pct = Math.min(toNumber(alert.capacity_pct) ?? 0, 100)
            const status = alert.status ?? 'normal'

            return (
              <div
                key={`${alert.spot_id}-${alert.recorded_at}`}
                className="border-border rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="typo-body-sm truncate font-semibold">
                      {alert.name_vi ?? 'Điểm theo dõi'}
                    </p>
                    <p className="typo-caption text-muted-foreground">
                      {formatDateTime(alert.recorded_at)}
                    </p>
                  </div>
                  <Badge
                    className={CAPACITY_STATUS_BADGE[status] ?? 'bg-muted text-muted-foreground'}
                  >
                    {CAPACITY_STATUS_LABEL[status] ?? status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="bg-muted h-2 flex-1 rounded-full">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'overloaded'
                          ? 'bg-destructive'
                          : status === 'near_full' || status === 'busy'
                            ? 'bg-warning'
                            : 'bg-success'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="typo-body-sm w-14 text-right font-semibold">
                    {formatPercent(alert.capacity_pct)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessEnterpriseView(): JSX.Element {
  // ── Business selector ─────────────────────────────────────────────────────
  const bizListQuery = useApiQuery<ApiResponse<any>>(
    ['biz-list-for-gov'],
    () => businessService.getAll({ limit: 50 }),
    { staleTime: STALE_REF },
    false,
    false
  )
  const businesses: { id: string; business_name?: string; name?: string }[] = normalizeList(
    bizListQuery.data?.data,
    ['businesses', 'items', 'data']
  )

  const [selectedBizId, setSelectedBizId] = useState<string>('')

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const [dashPeriod, setDashPeriod] = useState('month')
  const dashboardQuery = useApiQuery<ApiResponse<GovernanceEnterpriseDashboard>>(
    ['gov-biz-dashboard', selectedBizId, dashPeriod],
    () =>
      governanceService.getEnterpriseDashboard(selectedBizId, {
        period: dashPeriod,
        year: new Date().getFullYear(),
      }),
    { staleTime: STALE_DEFAULT, enabled: !!selectedBizId },
    false,
    false
  )
  const dashboard = (dashboardQuery.data?.data ?? {}) as GovernanceEnterpriseDashboard
  const dashboardSummary = dashboard.summary ?? {}
  const revenueTrend = dashboard.revenue_trend ?? []
  const capacityAlerts = dashboard.capacity_alerts ?? []

  // ── Feedbacks ─────────────────────────────────────────────────────────────
  const feedbacksQuery = useApiQuery<ApiResponse<any>>(
    ['gov-biz-feedbacks', selectedBizId],
    () => governanceService.getEnterpriseFeedbacks(selectedBizId, { limit: 50 }),
    { staleTime: STALE_DEFAULT, enabled: !!selectedBizId },
    false,
    false
  )
  const feedbacks: GovernanceEnterpriseFeedback[] = normalizeList(feedbacksQuery.data?.data, [
    'feedbacks',
    'items',
    'data',
  ])

  const bizLabel = (b: { id: string; business_name?: string; name?: string }) =>
    b.business_name ?? b.name ?? b.id

  return (
    <div className="space-y-4">
      {/* Business selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label>Chọn doanh nghiệp</Label>
          {bizListQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Đang tải...</p>
          ) : (
            <SearchSelect
              options={businesses.map((biz) => ({ value: String(biz.id), label: bizLabel(biz) }))}
              value={selectedBizId}
              onValueChange={setSelectedBizId}
              placeholder="-- Chọn doanh nghiệp --"
              className="w-72"
            />
          )}
        </div>
        {bizListQuery.isError && (
          <p className="text-destructive text-sm">Không thể tải danh sách doanh nghiệp.</p>
        )}
      </div>

      {!selectedBizId ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-12 text-center">
            <Building2 className="text-muted-foreground size-8" />
            <p className="text-muted-foreground">Chọn một doanh nghiệp để xem chi tiết.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="feedbacks">Phản ánh lân cận</TabsTrigger>
          </TabsList>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <Label>Kỳ thống kê</Label>
                <Select value={dashPeriod} onValueChange={setDashPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Tuần</SelectItem>
                    <SelectItem value="month">Tháng</SelectItem>
                    <SelectItem value="quarter">Quý</SelectItem>
                    <SelectItem value="year">Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="secondary"
                onClick={() => dashboardQuery.refetch()}
                disabled={dashboardQuery.isFetching}
                className="gap-1.5 px-3"
              >
                <RefreshCw
                  className={`h-6 w-6 ${dashboardQuery.isFetching ? 'animate-spin' : ''}`}
                />
                {dashboardQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
              </Button>
            </div>

            {dashboardQuery.isLoading && (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  Đang tải dashboard...
                </CardContent>
              </Card>
            )}

            {dashboardQuery.isError && (
              <p className="text-destructive text-sm">Không thể tải dữ liệu dashboard.</p>
            )}

            {!dashboardQuery.isLoading && !dashboardQuery.isError && (
              <>
                <BusinessSnapshot dashboard={dashboard} />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  <StatCard
                    icon={<DollarSign className="size-5" />}
                    label="Doanh thu"
                    value={formatCurrency(
                      dashboardSummary.total_revenue_vnd ?? dashboard.total_revenue_vnd
                    )}
                    helper={formatCompactCurrency(
                      dashboardSummary.total_revenue_vnd ?? dashboard.total_revenue_vnd
                    )}
                    colorClass="text-success"
                  />
                  <StatCard
                    icon={<Activity className="size-5" />}
                    label="Đặt chỗ"
                    value={formatNumber(
                      dashboardSummary.total_bookings ?? dashboard.total_bookings
                    )}
                    helper="Tổng booking trong kỳ"
                    colorClass="text-info"
                  />
                  <StatCard
                    icon={<Users className="size-5" />}
                    label="Lượt khách"
                    value={formatNumber(
                      dashboardSummary.total_visitors ?? dashboard.total_visitors
                    )}
                    helper="Khách phục vụ"
                    colorClass="text-primary"
                  />
                  <StatCard
                    icon={<Percent className="size-5" />}
                    label="Sức chứa TB"
                    value={formatPercent(
                      dashboardSummary.avg_capacity_pct ?? dashboard.capacity_pct
                    )}
                    helper="Tỷ lệ sử dụng"
                    colorClass="text-warning"
                  />
                  <StatCard
                    icon={<AlertTriangle className="size-5" />}
                    label="Cảnh báo"
                    value={formatNumber(capacityAlerts.length)}
                    helper="Điểm cần theo dõi"
                    colorClass={capacityAlerts.length > 0 ? 'text-destructive' : 'text-success'}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.8fr)]">
                  <RevenueTrendCard items={revenueTrend} />
                  <div className="space-y-4">
                    <Card className="shadow-sm">
                      <CardHeader>
                        <CardTitle className="typo-section-title">Nhịp vận hành</CardTitle>
                        <CardDescription>Tóm tắt nhanh từ kỳ báo cáo mới nhất.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <div className="border-border flex items-center justify-between rounded-lg border p-3">
                          <span className="text-muted-foreground flex items-center gap-2 text-sm">
                            <TrendingUp className="text-primary size-4" />
                            Doanh thu gần nhất
                          </span>
                          <span className="typo-body-sm font-semibold">
                            {formatCompactCurrency(revenueTrend.at(-1)?.revenue_vnd)}
                          </span>
                        </div>
                        <div className="border-border flex items-center justify-between rounded-lg border p-3">
                          <span className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Users className="text-primary size-4" />
                            Khách gần nhất
                          </span>
                          <span className="typo-body-sm font-semibold">
                            {formatNumber(revenueTrend.at(-1)?.visitors)}
                          </span>
                        </div>
                        <div className="border-border flex items-center justify-between rounded-lg border p-3">
                          <span className="text-muted-foreground flex items-center gap-2 text-sm">
                            <Star className="text-warning size-4" />
                            Đánh giá
                          </span>
                          <span className="typo-body-sm font-semibold">
                            {formatNumber(
                              ((dashboard.business ?? {}) as Record<string, unknown>).rating_avg ??
                                dashboard.avg_rating
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <CapacityAlertsCard alerts={capacityAlerts} />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Feedbacks ── */}
          <TabsContent value="feedbacks" className="space-y-4">
            <ToolTableCustom
              searchValue=""
              setSearchValue={() => {}}
              dataUpdatedAt={feedbacksQuery.dataUpdatedAt}
              onRefresh={() => feedbacksQuery.refetch()}
              isRefreshing={feedbacksQuery.isFetching && !feedbacksQuery.isLoading}
              total={feedbacks.length}
            >
              <Table className="relative">
                <TableHeader className="sticky top-0 z-20">
                  <TableRow>
                    <TableHead>Tiêu đề phản ánh</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Khoảng cách (km)</TableHead>
                    <TableHead className="w-32">Ngày gửi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacksQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        Đang tải...
                      </TableCell>
                    </TableRow>
                  ) : feedbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">
                        Không có phản ánh xung quanh
                      </TableCell>
                    </TableRow>
                  ) : (
                    feedbacks.map((fb: GovernanceEnterpriseFeedback) => {
                      const st = fb.status ?? 'pending'
                      return (
                        <TableRow key={fb.id}>
                          <TableCell className="typo-table-cell max-w-64 font-medium">
                            <span className="line-clamp-1">{fb.title ?? '-'}</span>
                          </TableCell>
                          <TableCell>
                            <StatusDotBadge
                              label={FEEDBACK_STATUS_LABEL[st] ?? st}
                              dotClass={FEEDBACK_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                              badgeClass={
                                FEEDBACK_STATUS_BADGE[st] ??
                                'bg-muted/40 text-muted-foreground border-border'
                              }
                            />
                          </TableCell>
                          <TableCell className="typo-table-cell text-right">
                            {fb.distance_km != null ? `${fb.distance_km.toFixed(1)} km` : '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {fb.created_at ? formatDate(fb.created_at) : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ToolTableCustom>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
