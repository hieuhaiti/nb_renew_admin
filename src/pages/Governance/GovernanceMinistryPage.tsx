import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, governanceService } from '@/service'
import type { ApiResponse } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MapPin, Building2, AlertTriangle, TreePine, TrendingUp } from 'lucide-react'
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
          <p className="text-2xl font-bold">{value ?? '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GovernanceMinistryPage(): JSX.Element {
  // ─── Overview ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)

  const overviewQuery = useApiQuery<ApiResponse<any>>(
    ['governance-ministry-overview', fromDate, toDate],
    () => governanceService.getMinistryOverview({ from_date: fromDate, to_date: toDate }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const overviewData = (overviewQuery.data as ApiResponse<any> | undefined)?.data ?? {}
  const aggregate = (overviewData as any).aggregate ?? {}
  const provinces: any[] = Array.isArray((overviewData as any).provinces) ? (overviewData as any).provinces : []
  const overloadAlerts = (overviewData as any).overload_alerts ?? { total: 0 }
  const conservationMonitoring = (overviewData as any).conservation_monitoring ?? { total: 0 }

  // ─── Capacity alerts ─────────────────────────────────────────────────────────
  const [capacityStatus, setCapacityStatus] = useState('all')
  const [capacityLimit, setCapacityLimit] = useState('50')

  const capacityQuery = useApiQuery<ApiResponse<any>>(
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
  const capacityData = (capacityQuery.data as ApiResponse<any> | undefined)?.data ?? {}
  const capacityTotal: number = (capacityData as any).total ?? 0
  const capacityItems: any[] = Array.isArray((capacityData as any).items) ? (capacityData as any).items : []

  // ─── Conservation ────────────────────────────────────────────────────────────
  const [conservDays, setConservDays] = useState('30')

  const conservQuery = useApiQuery<ApiResponse<any>>(
    ['governance-ministry-conservation', conservDays],
    () => governanceService.getMinistryConservationSummary({ days: Number(conservDays) }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const conservData = (conservQuery.data as ApiResponse<any> | undefined)?.data ?? {}
  const conservTotal: number = (conservData as any).total ?? 0
  const conservItems: any[] = Array.isArray((conservData as any).items) ? (conservData as any).items : []

  return (
    <PageLayout
      title="Bộ VHTTDL – Quản trị nâng cao"
      description="Tổng quan du lịch quốc gia, cảnh báo sức chứa và bảo tồn"
    >
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="capacity">Cảnh báo sức chứa</TabsTrigger>
          <TabsTrigger value="conservation">Bảo tồn</TabsTrigger>
        </TabsList>

        {/* ── Tab: Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="typo-section-title">Bộ lọc thời gian</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <Label>Từ ngày</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-44"
                />
              </div>
              <div className="space-y-1">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-44"
                />
              </div>
              <Button onClick={() => overviewQuery.refetch()} disabled={overviewQuery.isFetching}>
                {overviewQuery.isFetching ? 'Đang tải...' : 'Cập nhật'}
              </Button>
            </CardContent>
          </Card>

          {overviewQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu tổng quan.</p>
          )}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Điểm tham quan"
              value={Number(aggregate.total_spots ?? 0).toLocaleString('vi-VN')}
              colorClass="text-blue-600"
            />
            <StatCard
              icon={<Building2 className="size-5" />}
              label="Đơn vị dịch vụ"
              value={Number(aggregate.total_service_units ?? 0).toLocaleString('vi-VN')}
              colorClass="text-purple-600"
            />
            <StatCard
              icon={<Building2 className="size-5" />}
              label="Doanh nghiệp mới"
              value={Number(aggregate.new_businesses ?? 0).toLocaleString('vi-VN')}
              colorClass="text-primary"
            />
            <StatCard
              icon={<TrendingUp className="size-5" />}
              label="Doanh thu báo cáo (VNĐ)"
              value={Number(aggregate.reported_revenue_vnd ?? 0).toLocaleString('vi-VN')}
              colorClass="text-success"
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Cảnh báo sức chứa"
              value={overloadAlerts.total ?? 0}
              colorClass="text-warning"
            />
            <StatCard
              icon={<TreePine className="size-5" />}
              label="Giám sát bảo tồn"
              value={conservationMonitoring.total ?? 0}
              colorClass="text-success"
            />
          </div>

          {provinces.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="typo-section-title">Thống kê theo tỉnh/thành</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tỉnh/Thành</TableHead>
                      <TableHead className="text-right">Điểm DL</TableHead>
                      <TableHead className="text-right">Đơn vị DV</TableHead>
                      <TableHead className="text-right">DN mới</TableHead>
                      <TableHead className="text-right">Doanh thu (VNĐ)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provinces.map((p: any) => (
                      <TableRow key={p.province_code}>
                        <TableCell className="typo-table-cell font-medium">{p.province_name}</TableCell>
                        <TableCell className="typo-table-cell text-right">{Number(p.spot_count ?? 0).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="typo-table-cell text-right">{Number(p.service_unit_count ?? 0).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="typo-table-cell text-right">{Number(p.new_business_count ?? 0).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="typo-table-cell text-right">{Number(p.reported_revenue_vnd ?? 0).toLocaleString('vi-VN')}</TableCell>
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

        {/* ── Tab: Capacity Alerts ── */}
        <TabsContent value="capacity" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
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
                  <TableHead className="text-right">Tỷ lệ (%)</TableHead>
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
                  capacityItems.map((item: any, idx: number) => {
                    const st = item.status ?? 'normal'
                    return (
                      <TableRow key={item.spot_id ?? idx}>
                        <TableCell className="typo-table-cell font-medium">
                          {item.name_vi ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground">
                          {item.province_name ?? '-'}
                        </TableCell>
                        <TableCell>
                          <StatusDotBadge
                            label={CAPACITY_STATUS_LABEL[st] ?? st}
                            dotClass={CAPACITY_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                            badgeClass={
                              CAPACITY_STATUS_BADGE[st] ??
                              'bg-muted/40 text-muted-foreground border-border'
                            }
                          />
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {item.visitor_count?.toLocaleString('vi-VN') ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {item.max_capacity?.toLocaleString('vi-VN') ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {item.capacity_pct != null ? `${Number(item.capacity_pct).toFixed(1)}%` : '-'}
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

        {/* ── Tab: Conservation ── */}
        <TabsContent value="conservation" className="space-y-4">
          <div className="flex items-end gap-4">
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

          {conservQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu bảo tồn.</p>
          )}

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
                  <TableHead className="text-right">Diện tích biến động (ha)</TableHead>
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
                  conservItems.map((item: any, idx: number) => (
                    <TableRow key={item.conservation_id ?? idx}>
                      <TableCell className="typo-table-cell font-medium">
                        {item.conservation_name ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-muted-foreground">
                        {item.province_name ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {item.detected_changes?.toLocaleString('vi-VN') ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {item.total_change_area_ha != null
                          ? `${Number(item.total_change_area_ha).toFixed(2)} ha`
                          : '-'}
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
