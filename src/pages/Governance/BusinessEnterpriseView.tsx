import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, governanceService, businessService } from '@/service'
import type {
  ApiResponse,
  GovernanceEnterpriseDashboard,
  GovernanceEnterpriseFeedback,
} from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/common/SearchSelect'
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
import { Building2, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'
import { EnterpriseDashboardSections } from './EnterpriseDashboardSections'

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
  const [dashVariant, setDashVariant] = useState('auto')
  const dashboardQuery = useApiQuery<ApiResponse<GovernanceEnterpriseDashboard>>(
    ['gov-biz-dashboard', selectedBizId, dashPeriod, dashVariant],
    () =>
      governanceService.getEnterpriseDashboard(selectedBizId, {
        period: dashPeriod,
        year: new Date().getFullYear(),
        ...(dashVariant !== 'auto' && { variant: dashVariant }),
      }),
    { staleTime: STALE_DEFAULT, enabled: !!selectedBizId },
    false,
    false
  )
  const dashboard = (dashboardQuery.data?.data ?? {}) as GovernanceEnterpriseDashboard

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
              <div className="flex flex-wrap gap-3">
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
                <div className="space-y-1">
                  <Label>Biến thể dashboard</Label>
                  <Select value={dashVariant} onValueChange={setDashVariant}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Tự động theo quyền/loại hình</SelectItem>
                      <SelectItem value="spot_operator">Điểm tham quan</SelectItem>
                      <SelectItem value="travel_company">Lữ hành</SelectItem>
                      <SelectItem value="service_provider">Dịch vụ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <EnterpriseDashboardSections dashboard={dashboard} showBusiness />
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
