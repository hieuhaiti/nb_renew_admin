import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, governanceService, businessService } from '@/service'
import type {
  ApiResponse,
  Business,
  GovernanceEnterpriseReport,
  GovernanceEnterpriseReportCreateBody,
  GovernanceEnterpriseDashboard,
  GovernanceEnterpriseFeedback,
} from '@/types/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Building2, Users, Star, Activity, Plus, DollarSign, RefreshCw } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'

const BIZ_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  suspended: 'Tạm khóa',
}
const BIZ_STATUS_CLASS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted/40 text-muted-foreground border-border',
}

// ─── Status maps ──────────────────────────────────────────────────────────────

const REPORT_STATUS_LABEL: Record<string, string> = {
  draft: 'Bản nháp',
  submitted: 'Đã nộp',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}
const REPORT_STATUS_DOT: Record<string, string> = {
  draft: 'bg-muted-foreground',
  submitted: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-destructive',
}
const REPORT_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted/40 text-muted-foreground border-border',
  submitted: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

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

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Zod schema ───────────────────────────────────────────────────────────────

const reportSchema = z.object({
  report_period: z.string().min(1, 'Bắt buộc'),
  period_from: z.string().min(1, 'Bắt buộc'),
  period_to: z.string().min(1, 'Bắt buộc'),
  total_revenue_vnd: z.coerce.number().nonnegative().optional(),
  total_bookings: z.coerce.number().int().nonnegative().optional(),
  total_visitors: z.coerce.number().int().nonnegative().optional(),
  avg_capacity_pct: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
})
type ReportFormValues = z.infer<typeof reportSchema>

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GovernanceEnterprisePage(): JSX.Element {
  // ── Lấy doanh nghiệp của tôi ─────────────────────────────────────────────
  const myBizQuery = useApiQuery<ApiResponse<Business>>(
    ['businesses-me'],
    () => businessService.getMe(),
    { staleTime: STALE_REF },
    false,
    false
  )
  const myBizRaw = myBizQuery.data?.data ?? myBizQuery.data
  const myBiz = (Array.isArray((myBizRaw as any)?.businesses)
    ? (myBizRaw as any).businesses[0]
    : myBizRaw) as Business | undefined
  const businessId: string = myBiz?.id ?? ''

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const [dashPeriod, setDashPeriod] = useState('month')
  const dashboardQuery = useApiQuery<ApiResponse<GovernanceEnterpriseDashboard>>(
    ['governance-enterprise-dashboard', businessId, dashPeriod],
    () =>
      governanceService.getEnterpriseDashboard(businessId, {
        period: dashPeriod,
        year: new Date().getFullYear(),
      }),
    { staleTime: STALE_DEFAULT, enabled: !!businessId },
    false,
    false
  )
  const dashboard = (dashboardQuery.data?.data ?? {}) as GovernanceEnterpriseDashboard

  // ── Reports ────────────────────────────────────────────────────────────────
  const reportsQuery = useApiQuery<ApiResponse<any>>(
    ['governance-enterprise-reports', businessId],
    () => governanceService.getEnterpriseReports({ limit: 50 }),
    { staleTime: STALE_DEFAULT, enabled: !!businessId },
    false,
    false
  )
  const reports: GovernanceEnterpriseReport[] = normalizeList(reportsQuery.data?.data, [
    'reports',
    'items',
    'data',
  ])

  const [createReportOpen, setCreateReportOpen] = useState(false)
  const createReportMutation = useApiMutation(
    (data: GovernanceEnterpriseReportCreateBody) => governanceService.createEnterpriseReport(data),
    { onSuccess: () => { reportsQuery.refetch(); setCreateReportOpen(false); reportForm.reset() } },
    true
  )

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      report_period: '',
      period_from: '',
      period_to: '',
      total_revenue_vnd: undefined,
      total_bookings: undefined,
      total_visitors: undefined,
      avg_capacity_pct: undefined,
      notes: '',
    },
  })

  const handleCreateReport: SubmitHandler<ReportFormValues> = (data) => {
    if (!businessId) return
    createReportMutation.mutate({
      business_id: businessId,
      report_period: data.report_period,
      period_from: data.period_from,
      period_to: data.period_to,
      ...(data.total_revenue_vnd !== undefined && { total_revenue_vnd: data.total_revenue_vnd }),
      ...(data.total_bookings !== undefined && { total_bookings: data.total_bookings }),
      ...(data.total_visitors !== undefined && { total_visitors: data.total_visitors }),
      ...(data.avg_capacity_pct !== undefined && { avg_capacity_pct: data.avg_capacity_pct }),
      ...(data.notes?.trim() && { notes: data.notes }),
    })
  }

  // ── Feedbacks ─────────────────────────────────────────────────────────────
  const feedbacksQuery = useApiQuery<ApiResponse<any>>(
    ['governance-enterprise-feedbacks', businessId],
    () => governanceService.getEnterpriseFeedbacks(businessId, { limit: 50 }),
    { staleTime: STALE_DEFAULT, enabled: !!businessId },
    false,
    false
  )
  const feedbacks: GovernanceEnterpriseFeedback[] = normalizeList(feedbacksQuery.data?.data, [
    'feedbacks',
    'items',
    'data',
  ])

  return (
    <PageLayout
      title="Quản trị Doanh nghiệp"
      description="Dashboard, báo cáo kinh doanh và phản ánh xung quanh doanh nghiệp"
    >
      {/* Thông tin doanh nghiệp của tôi */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="bg-muted rounded-full p-3 text-primary">
            <Building2 className="size-5" />
          </div>
          {myBizQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Đang tải thông tin doanh nghiệp...</p>
          ) : myBizQuery.isError || !myBiz ? (
            <p className="text-destructive text-sm">Không tìm thấy doanh nghiệp liên kết với tài khoản này.</p>
          ) : (
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
              <div>
                <p className="typo-label text-muted-foreground">Doanh nghiệp của tôi</p>
                <p className="font-semibold">{myBiz.business_name}</p>
              </div>
              {myBiz.business_type && (
                <Badge variant="outline" className="text-xs">{myBiz.business_type}</Badge>
              )}
              {myBiz.status && (
                <Badge className={`text-xs ${BIZ_STATUS_CLASS[myBiz.status] ?? 'bg-muted/40 text-muted-foreground border-border'}`}>
                  {BIZ_STATUS_LABEL[myBiz.status] ?? myBiz.status}
                </Badge>
              )}
              {myBiz.province_code && (
                <p className="text-muted-foreground text-sm">{myBiz.province_code}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {myBizQuery.isLoading || myBizQuery.isError || !businessId ? (
        !myBizQuery.isLoading && (
          <p className="text-muted-foreground text-sm">Không thể tải dữ liệu doanh nghiệp.</p>
        )
      ) : (
        <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Báo cáo</TabsTrigger>
            <TabsTrigger value="feedbacks">Phản ánh lân cận</TabsTrigger>
          </TabsList>

          {/* ── Tab: Dashboard ── */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex items-end gap-3">
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
                <RefreshCw className={`h-6 w-6 ${dashboardQuery.isFetching ? 'animate-spin' : ''}`} />
                {dashboardQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
              </Button>
            </div>

            {dashboardQuery.isError && (
              <p className="text-destructive text-sm">Không thể tải dữ liệu dashboard.</p>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={<Users className="size-5" />}
                label="Tổng lượt khách"
                value={dashboard.total_visitors?.toLocaleString('vi-VN') ?? '-'}
              />
              <StatCard
                icon={<DollarSign className="size-5" />}
                label="Doanh thu (VNĐ)"
                value={
                  dashboard.total_revenue_vnd != null
                    ? dashboard.total_revenue_vnd.toLocaleString('vi-VN')
                    : '-'
                }
                colorClass="text-success"
              />
              <StatCard
                icon={<Activity className="size-5" />}
                label="Tổng đặt chỗ"
                value={dashboard.total_bookings?.toLocaleString('vi-VN') ?? '-'}
                colorClass="text-blue-600"
              />
              <StatCard
                icon={<Star className="size-5" />}
                label="Đánh giá TB"
                value={
                  dashboard.avg_rating != null ? dashboard.avg_rating.toFixed(1) : '-'
                }
                colorClass="text-warning"
              />
            </div>

            {dashboardQuery.isLoading && (
              <p className="text-muted-foreground text-sm">Đang tải dashboard...</p>
            )}
          </TabsContent>

          {/* ── Tab: Reports ── */}
          <TabsContent value="reports" className="space-y-4">
            {reportsQuery.isError && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                  <p className="text-muted-foreground font-medium">Không có quyền xem danh sách báo cáo</p>
                  <p className="text-muted-foreground text-sm">Bạn vẫn có thể nộp báo cáo mới bên dưới.</p>
                  <Button
                    variant="default"
                    className="mt-2"
                    onClick={() => { reportForm.reset(); setCreateReportOpen(true) }}
                  >
                    <Plus className="mr-1 size-4" />
                    Nộp báo cáo
                  </Button>
                </CardContent>
              </Card>
            )}
            {!reportsQuery.isError && (
            <>
            <ToolTableCustom
              searchValue=""
              setSearchValue={() => {}}
              dataUpdatedAt={reportsQuery.dataUpdatedAt}
              onRefresh={() => reportsQuery.refetch()}
              isRefreshing={reportsQuery.isFetching && !reportsQuery.isLoading}
              filter={
                <Button
                  variant="default"
                  onClick={() => { reportForm.reset(); setCreateReportOpen(true) }}
                >
                  <Plus className="mr-1 size-4" />
                  Nộp báo cáo
                </Button>
              }
              total={reports.length}
            >
              <Table className="relative">
                <TableHeader className="sticky top-0 z-20">
                  <TableRow>
                    <TableHead>Kỳ báo cáo</TableHead>
                    <TableHead className="w-28">Từ ngày</TableHead>
                    <TableHead className="w-28">Đến ngày</TableHead>
                    <TableHead className="text-right">Khách</TableHead>
                    <TableHead className="text-right">Doanh thu (VNĐ)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="w-28">Ngày nộp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-muted-foreground text-center">Chưa có báo cáo</TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report: GovernanceEnterpriseReport) => {
                      const st = report.status ?? 'draft'
                      return (
                        <TableRow key={report.id}>
                          <TableCell className="typo-table-cell font-medium capitalize">
                            {report.report_period ?? '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {report.period_from ? formatDate(report.period_from) : '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {report.period_to ? formatDate(report.period_to) : '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell text-right">
                            {report.total_visitors?.toLocaleString('vi-VN') ?? '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell text-right">
                            {report.total_revenue_vnd != null
                              ? report.total_revenue_vnd.toLocaleString('vi-VN')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <StatusDotBadge
                              label={REPORT_STATUS_LABEL[st] ?? st}
                              dotClass={REPORT_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                              badgeClass={REPORT_STATUS_BADGE[st] ?? 'bg-muted/40 text-muted-foreground border-border'}
                            />
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {report.created_at ? formatDate(report.created_at) : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ToolTableCustom>

            {/* Create report dialog */}
            <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
              <DialogContent className="max-w-lg">
                <DialogTitle>Nộp báo cáo kinh doanh</DialogTitle>
                <DialogDescription>Điền thông tin báo cáo kinh doanh kỳ này</DialogDescription>
                <form onSubmit={reportForm.handleSubmit(handleCreateReport)} className="mt-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rp-period">
                      Kỳ báo cáo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="rp-period"
                      {...reportForm.register('report_period')}
                      placeholder="vd: 2026-Q1, 2026-05"
                    />
                    {reportForm.formState.errors.report_period && (
                      <p className="text-destructive text-sm">{reportForm.formState.errors.report_period.message}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="rp-from">
                        Từ ngày <span className="text-destructive">*</span>
                      </Label>
                      <Input id="rp-from" type="date" {...reportForm.register('period_from')} />
                      {reportForm.formState.errors.period_from && (
                        <p className="text-destructive text-sm">{reportForm.formState.errors.period_from.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rp-to">
                        Đến ngày <span className="text-destructive">*</span>
                      </Label>
                      <Input id="rp-to" type="date" {...reportForm.register('period_to')} />
                      {reportForm.formState.errors.period_to && (
                        <p className="text-destructive text-sm">{reportForm.formState.errors.period_to.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="rp-visitors">Tổng lượt khách</Label>
                      <Input id="rp-visitors" type="number" min={0} {...reportForm.register('total_visitors')} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rp-bookings">Tổng đặt chỗ</Label>
                      <Input id="rp-bookings" type="number" min={0} {...reportForm.register('total_bookings')} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="rp-revenue">Doanh thu (VNĐ)</Label>
                      <Input id="rp-revenue" type="number" min={0} {...reportForm.register('total_revenue_vnd')} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rp-capacity">Tỷ lệ sức chứa TB (%)</Label>
                      <Input id="rp-capacity" type="number" min={0} max={100} step={0.1} {...reportForm.register('avg_capacity_pct')} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rp-notes">Ghi chú</Label>
                    <Textarea id="rp-notes" {...reportForm.register('notes')} placeholder="Ghi chú thêm..." rows={3} />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setCreateReportOpen(false)}>Hủy</Button>
                    <Button type="submit" disabled={createReportMutation.isPending || !businessId}>
                      {createReportMutation.isPending ? 'Đang nộp...' : 'Nộp báo cáo'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </>
            )}
          </TabsContent>

          {/* ── Tab: Feedbacks ── */}
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
                      <TableCell colSpan={4} className="text-muted-foreground text-center">Đang tải...</TableCell>
                    </TableRow>
                  ) : feedbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center">Không có phản ánh xung quanh</TableCell>
                    </TableRow>
                  ) : (
                    feedbacks.map((fb: GovernanceEnterpriseFeedback) => {
                      const st = fb.status ?? 'pending'
                      return (
                        <TableRow key={fb.id}>
                          <TableCell className="typo-table-cell font-medium max-w-64">
                            <span className="line-clamp-1">{fb.title ?? '-'}</span>
                          </TableCell>
                          <TableCell>
                            <StatusDotBadge
                              label={FEEDBACK_STATUS_LABEL[st] ?? st}
                              dotClass={FEEDBACK_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                              badgeClass={FEEDBACK_STATUS_BADGE[st] ?? 'bg-muted/40 text-muted-foreground border-border'}
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
    </PageLayout>
  )
}
