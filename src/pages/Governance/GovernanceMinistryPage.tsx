import type { JSX, ReactNode } from 'react'
import { useState } from 'react'
import { useApiQuery, governanceService } from '@/service'
import type {
  ApiResponse,
  GovernanceCapacityAlert,
  GovernanceConservationItem,
  GovernanceMinistryOverview,
  GovernanceMinistryProvince,
} from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { MapPin, Building2, AlertTriangle, TreePine, TrendingUp, RefreshCw } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageLayout from '@/layout/pageLayout'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import { formatDate } from '@/lib/date'

const CAPACITY_STATUS_LABEL: Record<string, string> = {
  normal: 'Bình thường',
  busy: 'Đông đúc',
  near_full: 'Gần đầy',
  overloaded: 'Quá tải',
}

const CAPACITY_STATUS_DOT: Record<string, string> = {
  normal: 'bg-success',
  busy: 'bg-warning',
  near_full: 'bg-orange-500',
  overloaded: 'bg-destructive',
}

const CAPACITY_STATUS_BADGE: Record<string, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
}

type StatTone = 'primary' | 'info' | 'success' | 'warning' | 'danger'

const STAT_TONE_CLASS: Record<StatTone, { icon: string; bar: string }> = {
  primary: { icon: 'bg-primary/10 text-primary ring-primary/15', bar: 'bg-primary' },
  info: { icon: 'bg-info/10 text-info ring-info/15', bar: 'bg-info' },
  success: { icon: 'bg-success/10 text-success ring-success/15', bar: 'bg-success' },
  warning: { icon: 'bg-warning/10 text-warning ring-warning/15', bar: 'bg-warning' },
  danger: {
    icon: 'bg-destructive/10 text-destructive ring-destructive/15',
    bar: 'bg-destructive',
  },
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatNumber(value: unknown): string {
  return toNumber(value).toLocaleString('vi-VN')
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(toNumber(value))
}

function formatCompactCurrency(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ`
  if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(0)} tr`
  return formatCurrency(parsed)
}

function getCapacityPct(item: GovernanceCapacityAlert): number {
  return Math.min(toNumber(item.capacity_pct), 120)
}

function getCapacityBarClass(status?: string): string {
  if (status === 'overloaded') return 'bg-destructive'
  if (status === 'near_full' || status === 'busy') return 'bg-warning'
  return 'bg-success'
}

function normalizeProvinces(provinces: GovernanceMinistryProvince[]) {
  return provinces.map((province) => ({
    code: province.province_code ?? '-',
    province: province.province_name ?? '-',
    spots: toNumber(province.spot_count),
    serviceUnits: toNumber(province.service_unit_count),
    newBusinesses: toNumber(province.new_business_count),
    revenue: toNumber(province.reported_revenue_vnd),
  }))
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
      <CardContent className="relative flex items-start gap-4 p-5">
        <div className={`absolute inset-x-0 top-0 h-1 ${classes.bar}`} />
        <div className={`${classes.icon} rounded-xl p-3 ring-1`}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-meta text-muted-foreground">{label}</p>
          <p className="typo-section-title mt-1 truncate">{value ?? '-'}</p>
          {helper && <p className="typo-caption text-muted-foreground mt-1">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function ProvincePerformanceChart({ provinces }: { provinces: GovernanceMinistryProvince[] }) {
  const chartData = normalizeProvinces(provinces)
    .filter(
      (item) =>
        item.spots > 0 || item.serviceUnits > 0 || item.newBusinesses > 0 || item.revenue > 0
    )
    .sort((a, b) => b.revenue - a.revenue || b.spots - a.spots)
    .slice(0, 8)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="typo-section-title">Hiệu suất tỉnh/thành</CardTitle>
          <CardDescription>Chưa có tỉnh/thành phát sinh dữ liệu trong kỳ đã chọn.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Hiệu suất tỉnh/thành nổi bật</CardTitle>
        <CardDescription>
          So sánh điểm du lịch, đơn vị dịch vụ, doanh nghiệp mới và doanh thu báo cáo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="province" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="count"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
              />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={formatCompactCurrency}
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
              <Bar
                yAxisId="count"
                dataKey="spots"
                name="Điểm DL"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                barSize={22}
              />
              <Bar
                yAxisId="count"
                dataKey="serviceUnits"
                name="Đơn vị DV"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
                barSize={22}
              />
              <Bar
                yAxisId="count"
                dataKey="newBusinesses"
                name="DN mới"
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                barSize={22}
              />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">Điểm du lịch</Badge>
          <Badge className="bg-info/10 text-info border-info/20">Đơn vị dịch vụ</Badge>
          <Badge className="bg-success/10 text-success border-success/20">Doanh nghiệp mới</Badge>
          <Badge className="bg-warning/10 text-warning border-warning/20">Doanh thu</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertPressurePanel({ alerts }: { alerts: GovernanceCapacityAlert[] }) {
  const topAlerts = [...alerts]
    .sort((a, b) => toNumber(b.capacity_pct) - toNumber(a.capacity_pct))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Áp lực sức chứa</CardTitle>
        <CardDescription>Các điểm có tỷ lệ sử dụng cao nhất trong kỳ tổng quan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topAlerts.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Không có cảnh báo quá tải</p>
            <p className="typo-meta text-muted-foreground">
              Chưa ghi nhận điểm tham quan vượt ngưỡng trong khoảng thời gian này.
            </p>
          </div>
        ) : (
          topAlerts.map((alert) => {
            const status = alert.status ?? 'normal'
            const pct = getCapacityPct(alert)

            return (
              <div
                key={`${alert.spot_id}-${alert.recorded_at}`}
                className="border-border rounded-lg border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="typo-body-sm truncate font-semibold">{alert.name_vi ?? '-'}</p>
                    <p className="typo-caption text-muted-foreground">
                      {alert.province_name ?? '-'} · {formatNumber(alert.visitor_count)} khách
                    </p>
                  </div>
                  <StatusDotBadge
                    label={CAPACITY_STATUS_LABEL[status] ?? status}
                    dotClass={CAPACITY_STATUS_DOT[status] ?? 'bg-muted-foreground'}
                    badgeClass={
                      CAPACITY_STATUS_BADGE[status] ??
                      'bg-muted text-muted-foreground border-border'
                    }
                  />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="bg-muted h-2 flex-1 rounded-full">
                    <div
                      className={`${getCapacityBarClass(status)} h-2 rounded-full`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="typo-body-sm min-w-14 text-right font-semibold">
                    {toNumber(alert.capacity_pct).toFixed(1)}%
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

function ConservationPanel({ items }: { items: GovernanceConservationItem[] }) {
  const chartData = items.map((item) => ({
    name: item.conservation_name ?? '-',
    changes: toNumber(item.detected_changes),
    area: toNumber(item.total_change_area_ha),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Biến động bảo tồn</CardTitle>
        <CardDescription>
          Diện tích biến động và số thay đổi được phát hiện theo khu bảo tồn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Không có dữ liệu bảo tồn</p>
            <p className="typo-meta text-muted-foreground">
              Chưa có kết quả phân tích trong kỳ này.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    fontSize: 12,
                  }}
                  formatter={(value, name) => {
                    if (name === 'Diện tích') return [`${toNumber(value).toFixed(2)} ha`, name]
                    return [formatNumber(value), name]
                  }}
                />
                <Bar
                  dataKey="area"
                  name="Diện tích"
                  fill="hsl(var(--chart-3))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="changes"
                  name="Biến động"
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function GovernanceMinistryPage(): JSX.Element {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)

  const overviewQuery = useApiQuery<ApiResponse<GovernanceMinistryOverview>>(
    ['governance-ministry-overview', fromDate, toDate],
    () => governanceService.getMinistryOverview({ from_date: fromDate, to_date: toDate }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const overviewData = overviewQuery.data?.data ?? {}
  const aggregate = overviewData.aggregate ?? {}
  const provinces = overviewData.provinces ?? []
  const overloadAlerts = overviewData.overload_alerts ?? { total: 0, items: [] }
  const conservationMonitoring = overviewData.conservation_monitoring ?? { total: 0, items: [] }
  const activeProvinceCount = normalizeProvinces(provinces).filter(
    (item) => item.spots > 0 || item.serviceUnits > 0 || item.newBusinesses > 0 || item.revenue > 0
  ).length

  const [capacityStatus, setCapacityStatus] = useState('all')
  const [capacityLimit, setCapacityLimit] = useState('50')

  const capacityQuery = useApiQuery<
    ApiResponse<{ total?: number; items?: GovernanceCapacityAlert[] }>
  >(
    ['governance-ministry-capacity', capacityStatus, capacityLimit],
    () =>
      governanceService.getMinistryCapacityAlerts({
        limit: Number(capacityLimit),
        ...(capacityStatus !== 'all' && { statuses: capacityStatus }),
      }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const capacityData = capacityQuery.data?.data ?? {}
  const capacityTotal = capacityData.total ?? 0
  const capacityItems = capacityData.items ?? []

  const [conservDays, setConservDays] = useState('30')

  const conservQuery = useApiQuery<
    ApiResponse<{ total?: number; items?: GovernanceConservationItem[] }>
  >(
    ['governance-ministry-conservation', conservDays],
    () => governanceService.getMinistryConservationSummary({ days: Number(conservDays) }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const conservData = conservQuery.data?.data ?? {}
  const conservTotal = conservData.total ?? 0
  const conservItems = conservData.items ?? []

  return (
    <PageLayout
      title="Bộ VHTTDL - Quản trị nâng cao"
      description="Tổng quan du lịch quốc gia, cảnh báo sức chứa và giám sát bảo tồn"
    >
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="capacity">Cảnh báo sức chứa</TabsTrigger>
          <TabsTrigger value="conservation">Bảo tồn</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="typo-section-title">Tổng quan điều hành cấp Bộ</p>
                <p className="typo-meta text-muted-foreground">
                  Dữ liệu tổng hợp theo tỉnh/thành, sức chứa điểm đến và biến động bảo tồn.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label>Từ ngày</Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="w-44"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Đến ngày</Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="w-44"
                  />
                </div>
                <Button
                  onClick={() => overviewQuery.refetch()}
                  disabled={overviewQuery.isFetching}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`size-4 ${overviewQuery.isFetching ? 'animate-spin' : ''}`}
                  />
                  {overviewQuery.isFetching ? 'Đang tải...' : 'Cập nhật'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {overviewQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu tổng quan.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Điểm tham quan"
              value={formatNumber(aggregate.total_spots)}
              helper={`${activeProvinceCount} tỉnh/thành có dữ liệu`}
              tone="primary"
            />
            <StatCard
              icon={<Building2 className="size-5" />}
              label="Đơn vị dịch vụ"
              value={formatNumber(aggregate.total_service_units)}
              helper="Cơ sở dịch vụ được ghi nhận"
              tone="info"
            />
            <StatCard
              icon={<Building2 className="size-5" />}
              label="Doanh nghiệp mới"
              value={formatNumber(aggregate.new_businesses)}
              helper="Phát sinh trong kỳ"
              tone="success"
            />
            <StatCard
              icon={<TrendingUp className="size-5" />}
              label="Doanh thu báo cáo"
              value={formatCompactCurrency(aggregate.reported_revenue_vnd)}
              helper={formatCurrency(aggregate.reported_revenue_vnd)}
              tone="warning"
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Cảnh báo sức chứa"
              value={formatNumber(overloadAlerts.total)}
              helper="Quá tải hoặc gần đầy"
              tone={toNumber(overloadAlerts.total) > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={<TreePine className="size-5" />}
              label="Giám sát bảo tồn"
              value={formatNumber(conservationMonitoring.total)}
              helper="Khu vực có phân tích"
              tone="success"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <ProvincePerformanceChart provinces={provinces} />
            <AlertPressurePanel alerts={overloadAlerts.items ?? []} />
          </div>

          <ConservationPanel items={conservationMonitoring.items ?? []} />

          {provinces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="typo-section-title">Thống kê theo tỉnh/thành</CardTitle>
                <CardDescription>
                  Bảng chi tiết giữ lại để rà soát số liệu từng địa phương sau khi xem biểu đồ.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tỉnh/Thành</TableHead>
                      <TableHead className="text-right">Điểm DL</TableHead>
                      <TableHead className="text-right">Đơn vị DV</TableHead>
                      <TableHead className="text-right">DN mới</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((province) => (
                      <TableRow key={province.province_code}>
                        <TableCell className="typo-table-cell font-medium">
                          {province.province_name}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(province.spot_count)}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(province.service_unit_count)}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(province.new_business_count)}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right font-semibold">
                          {formatCurrency(province.reported_revenue_vnd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {overviewQuery.isLoading && (
            <p className="text-muted-foreground text-sm">Đang tải dữ liệu tổng quan...</p>
          )}
        </TabsContent>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="typo-section-title">Cảnh báo sức chứa toàn quốc</p>
                <p className="typo-meta text-muted-foreground">
                  Ưu tiên theo dõi điểm gần đầy và quá tải để điều phối vận hành.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label>Trạng thái</Label>
                  <Select value={capacityStatus} onValueChange={setCapacityStatus}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="busy">Đông đúc</SelectItem>
                      <SelectItem value="near_full">Gần đầy</SelectItem>
                      <SelectItem value="overloaded">Quá tải</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Giới hạn</Label>
                  <Select value={capacityLimit} onValueChange={setCapacityLimit}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Tổng cảnh báo"
              value={formatNumber(capacityTotal)}
              helper="Theo bộ lọc hiện tại"
              tone={capacityTotal > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={<TrendingUp className="size-5" />}
              label="Tỷ lệ cao nhất"
              value={
                capacityItems.length > 0
                  ? `${Math.max(...capacityItems.map((item) => toNumber(item.capacity_pct))).toFixed(1)}%`
                  : '-'
              }
              helper="Dùng để ưu tiên điều phối"
              tone="warning"
            />
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Điểm đang hiển thị"
              value={formatNumber(capacityItems.length)}
              helper="Theo giới hạn tải dữ liệu"
              tone="info"
            />
          </div>

          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={capacityQuery.dataUpdatedAt}
            onRefresh={() => capacityQuery.refetch()}
            isRefreshing={capacityQuery.isFetching && !capacityQuery.isLoading}
            total={capacityTotal}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Điểm tham quan</TableHead>
                  <TableHead>Tỉnh/Thành</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Khách hiện tại</TableHead>
                  <TableHead className="text-right">Sức chứa tối đa</TableHead>
                  <TableHead className="min-w-44">Tỷ lệ sức chứa</TableHead>
                  <TableHead className="w-40">Ghi nhận lúc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacityQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : capacityItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground text-center">
                      Không có cảnh báo
                    </TableCell>
                  </TableRow>
                ) : (
                  capacityItems.map((item, index) => {
                    const status = item.status ?? 'normal'

                    return (
                      <TableRow key={item.spot_id ?? index}>
                        <TableCell className="typo-table-cell font-medium">
                          {item.name_vi ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground">
                          {item.province_name ?? '-'}
                        </TableCell>
                        <TableCell>
                          <StatusDotBadge
                            label={CAPACITY_STATUS_LABEL[status] ?? status}
                            dotClass={CAPACITY_STATUS_DOT[status] ?? 'bg-muted-foreground'}
                            badgeClass={
                              CAPACITY_STATUS_BADGE[status] ??
                              'bg-muted text-muted-foreground border-border'
                            }
                          />
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(item.visitor_count)}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(item.max_capacity)}
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          <div className="flex items-center gap-3">
                            <div className="bg-muted h-2 flex-1 rounded-full">
                              <div
                                className={`${getCapacityBarClass(status)} h-2 rounded-full`}
                                style={{ width: `${Math.min(getCapacityPct(item), 100)}%` }}
                              />
                            </div>
                            <span className="min-w-14 text-right font-semibold">
                              {toNumber(item.capacity_pct).toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground">
                          {item.recorded_at
                            ? new Date(item.recorded_at).toLocaleString('vi-VN')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>
        </TabsContent>

        <TabsContent value="conservation" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="typo-section-title">Giám sát bảo tồn</p>
                <p className="typo-meta text-muted-foreground">
                  Theo dõi số biến động và diện tích thay đổi tại các khu bảo tồn.
                </p>
              </div>
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label>Số ngày gần nhất</Label>
                  <Select value={conservDays} onValueChange={setConservDays}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="14">14 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="60">60 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => conservQuery.refetch()} disabled={conservQuery.isFetching}>
                  {conservQuery.isFetching ? 'Đang tải...' : 'Cập nhật'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {conservQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu bảo tồn.</p>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<TreePine className="size-5" />}
              label="Khu vực giám sát"
              value={formatNumber(conservTotal)}
              helper="Theo kỳ đã chọn"
              tone="success"
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Biến động phát hiện"
              value={formatNumber(
                conservItems.reduce((sum, item) => sum + toNumber(item.detected_changes), 0)
              )}
              helper="Tổng số thay đổi"
              tone="warning"
            />
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Diện tích biến động"
              value={`${conservItems
                .reduce((sum, item) => sum + toNumber(item.total_change_area_ha), 0)
                .toFixed(2)} ha`}
              helper="Tổng diện tích ảnh hưởng"
              tone="danger"
            />
          </div>

          <ConservationPanel items={conservItems} />

          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={conservQuery.dataUpdatedAt}
            onRefresh={() => conservQuery.refetch()}
            isRefreshing={conservQuery.isFetching && !conservQuery.isLoading}
            total={conservTotal}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Khu bảo tồn</TableHead>
                  <TableHead>Tỉnh/Thành</TableHead>
                  <TableHead className="text-right">Biến động phát hiện</TableHead>
                  <TableHead className="text-right">Diện tích biến động</TableHead>
                  <TableHead className="w-40">Phân tích gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conservQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : conservItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Không có dữ liệu bảo tồn
                    </TableCell>
                  </TableRow>
                ) : (
                  conservItems.map((item, index) => (
                    <TableRow key={item.conservation_id ?? index}>
                      <TableCell className="typo-table-cell font-medium">
                        {item.conservation_name ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-muted-foreground">
                        {item.province_name ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {formatNumber(item.detected_changes)}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {toNumber(item.total_change_area_ha).toFixed(2)} ha
                      </TableCell>
                      <TableCell className="typo-table-cell text-muted-foreground">
                        {item.latest_analyzed_at ? formatDate(item.latest_analyzed_at) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
