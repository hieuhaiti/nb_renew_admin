import type { JSX, ReactNode } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, governanceService } from '@/service'
import type {
  ApiResponse,
  GovernanceDeptBusinessReg,
  GovernanceDeptSpotReg,
  GovernanceDeptFeedback,
  GovernanceDeptReport,
  GovernanceDeptReportCreateBody,
  GovernanceDeptReportSendBody,
  GovernanceCapacityAlert,
  GovernanceConservationSummary,
} from '@/types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AlertTriangle,
  Building2,
  Check,
  FileText,
  MapPin,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  Send,
  TreePine,
  X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageLayout from '@/layout/pageLayout'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT } from '@/constant/queryConstant'

// ─── Status maps ──────────────────────────────────────────────────────────────

const REG_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  active: 'Hoạt động',
  rejected: 'Từ chối',
  suspended: 'Tạm khóa',
}
const REG_STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning',
  approved: 'bg-success',
  active: 'bg-success',
  rejected: 'bg-destructive',
  suspended: 'bg-muted-foreground',
}
const REG_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  active: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted/40 text-muted-foreground border-border',
}

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

// ─── Zod schemas ──────────────────────────────────────────────────────────────

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

function getCapacityPct(item: GovernanceCapacityAlert): number {
  return Math.min(toNumber(item.capacity_pct), 120)
}

function getCapacityBarClass(status?: string): string {
  if (status === 'overloaded') return 'bg-destructive'
  if (status === 'near_full' || status === 'busy') return 'bg-warning'
  return 'bg-success'
}

function countByStatus<T extends { status?: string }>(items: T[], status: string): number {
  return items.filter((item) => item.status === status).length
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

function RegistrationStatusChart({
  businesses,
  spots,
}: {
  businesses: GovernanceDeptBusinessReg[]
  spots: GovernanceDeptSpotReg[]
}) {
  const chartData = [
    {
      status: 'Chờ duyệt',
      businesses: countByStatus(businesses, 'pending'),
      spots: countByStatus(spots, 'pending'),
    },
    {
      status: 'Đã duyệt',
      businesses: countByStatus(businesses, 'approved') + countByStatus(businesses, 'active'),
      spots: countByStatus(spots, 'approved') + countByStatus(spots, 'active'),
    },
    {
      status: 'Từ chối',
      businesses: countByStatus(businesses, 'rejected'),
      spots: countByStatus(spots, 'rejected'),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Luồng phê duyệt</CardTitle>
        <CardDescription>So sánh trạng thái đăng ký doanh nghiệp và điểm đến.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-md)',
                  fontSize: 12,
                }}
                formatter={(value) => formatNumber(value)}
              />
              <Bar
                dataKey="businesses"
                name="Doanh nghiệp"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="spots"
                name="Điểm đến"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function FeedbackStatusChart({ feedbacks }: { feedbacks: GovernanceDeptFeedback[] }) {
  const chartData = [
    { status: 'Chờ xử lý', value: countByStatus(feedbacks, 'pending') },
    { status: 'Đang xử lý', value: countByStatus(feedbacks, 'in_progress') },
    { status: 'Đã xử lý', value: countByStatus(feedbacks, 'resolved') },
    { status: 'Đã đóng', value: countByStatus(feedbacks, 'closed') },
  ].filter((item) => item.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Tình trạng phản ánh</CardTitle>
        <CardDescription>Nhìn nhanh khối lượng xử lý phản ánh người dân.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Chưa có phản ánh trong kỳ</p>
            <p className="typo-meta text-muted-foreground">
              Bảng phản ánh sẽ cập nhật khi có dữ liệu mới.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-md)',
                    fontSize: 12,
                  }}
                  formatter={(value) => formatNumber(value)}
                />
                <Bar
                  dataKey="value"
                  name="Phản ánh"
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

function CapacityPressurePanel({ items }: { items: GovernanceCapacityAlert[] }) {
  const topItems = [...items]
    .sort((a, b) => toNumber(b.capacity_pct) - toNumber(a.capacity_pct))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Áp lực sức chứa</CardTitle>
        <CardDescription>Các điểm cần ưu tiên điều phối trong địa phương.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topItems.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Không có cảnh báo sức chứa</p>
            <p className="typo-meta text-muted-foreground">
              Chưa ghi nhận điểm gần đầy hoặc quá tải.
            </p>
          </div>
        ) : (
          topItems.map((item, index) => {
            const status = item.status ?? 'normal'

            return (
              <div key={item.spot_id ?? index} className="border-border rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="typo-body-sm truncate font-semibold">{item.name_vi ?? '-'}</p>
                    <p className="typo-caption text-muted-foreground">
                      {item.province_name ?? '-'} · {formatNumber(item.visitor_count)} khách
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
                      style={{ width: `${Math.min(getCapacityPct(item), 100)}%` }}
                    />
                  </div>
                  <span className="typo-body-sm min-w-14 text-right font-semibold">
                    {toNumber(item.capacity_pct).toFixed(1)}%
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

function ConservationChart({
  items,
}: {
  items: NonNullable<GovernanceConservationSummary['items']>
}) {
  const chartData = items.map((item) => ({
    name: item.conservation_name ?? '-',
    area: toNumber(item.total_change_area_ha),
    changes: toNumber(item.detected_changes),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Biến động bảo tồn</CardTitle>
        <CardDescription>Diện tích biến động và số thay đổi được phát hiện.</CardDescription>
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

const reportSchema = z.object({
  title: z.string().min(2, 'Tối thiểu 2 ký tự').max(300),
  report_type: z.string().min(1, 'Bắt buộc'),
  period_from: z.string().min(1, 'Bắt buộc'),
  period_to: z.string().min(1, 'Bắt buộc'),
  file_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  file_format: z.string().optional(),
})
type ReportFormValues = z.infer<typeof reportSchema>

const sendReportSchema = z.object({
  title_vi: z.string().min(2).max(200),
  body_vi: z.string().min(2).max(1000),
})
type SendReportFormValues = z.infer<typeof sendReportSchema>

// ─── Rejection dialog ─────────────────────────────────────────────────────────

function RejectBusinessDialog({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (note: string) => void
  isPending: boolean
}) {
  const [note, setNote] = useState('')
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Từ chối đăng ký doanh nghiệp</AlertDialogTitle>
          <AlertDialogDescription>Vui lòng nhập lý do từ chối (tuỳ chọn).</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Lý do từ chối..."
          rows={3}
          className="mt-2"
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(note)}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Đang xử lý...' : 'Từ chối'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GovernanceDepartmentPage(): JSX.Element {
  // ── Business registrations ────────────────────────────────────────────────
  const [bizStatusFilter, setBizStatusFilter] = useState('all')
  const bizRegQuery = useApiQuery<ApiResponse<any>>(
    ['governance-dept-biz-reg', bizStatusFilter],
    () =>
      governanceService.getDepartmentBusinessRegistrations({
        ...(bizStatusFilter !== 'all' && { status: bizStatusFilter }),
        limit: 50,
      }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const bizRegs: GovernanceDeptBusinessReg[] = normalizeList(bizRegQuery.data?.data, [
    'businesses',
    'items',
    'data',
    'registrations',
  ])

  const [bizToReject, setBizToReject] = useState<GovernanceDeptBusinessReg | null>(null)
  const approveBizMutation = useApiMutation(
    (payload: { id: string; status: string; rejection_note?: string }) =>
      governanceService.approveDepartmentBusiness(payload.id, {
        status: payload.status,
        ...(payload.rejection_note && { rejection_note: payload.rejection_note }),
      }),
    { onSuccess: () => bizRegQuery.refetch() },
    true
  )

  // ── Spot registrations ────────────────────────────────────────────────────
  const [spotStatusFilter, setSpotStatusFilter] = useState('all')
  const spotRegQuery = useApiQuery<ApiResponse<any>>(
    ['governance-dept-spot-reg', spotStatusFilter],
    () =>
      governanceService.getDepartmentSpotRegistrations({
        ...(spotStatusFilter !== 'all' && { status: spotStatusFilter }),
        limit: 50,
      }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const spotRegs: GovernanceDeptSpotReg[] = normalizeList(spotRegQuery.data?.data, [
    'spots',
    'items',
    'data',
    'registrations',
  ])

  const [spotToApprove, setSpotToApprove] = useState<GovernanceDeptSpotReg | null>(null)
  const approveSpotMutation = useApiMutation(
    (payload: { id: string; status: string }) =>
      governanceService.approveDepartmentSpot(payload.id, { status: payload.status }),
    {
      onSuccess: () => {
        spotRegQuery.refetch()
        setSpotToApprove(null)
      },
    },
    true
  )

  // ── Feedbacks ─────────────────────────────────────────────────────────────
  const feedbackQuery = useApiQuery<ApiResponse<any>>(
    ['governance-dept-feedbacks'],
    () => governanceService.getDepartmentFeedbacks({ limit: 50 }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const feedbacks: GovernanceDeptFeedback[] = normalizeList(feedbackQuery.data?.data, [
    'feedbacks',
    'items',
    'data',
  ])

  // ── Reports ────────────────────────────────────────────────────────────────
  const reportsQuery = useApiQuery<ApiResponse<any>>(
    ['governance-dept-reports'],
    () => governanceService.getDepartmentReports({ limit: 50 }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const reports: GovernanceDeptReport[] = normalizeList(reportsQuery.data?.data, [
    'reports',
    'items',
    'data',
  ])

  const [createReportOpen, setCreateReportOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [reportToSend, setReportToSend] = useState<GovernanceDeptReport | null>(null)

  const createReportMutation = useApiMutation(
    (data: GovernanceDeptReportCreateBody) => governanceService.createDepartmentReport(data),
    {
      onSuccess: () => {
        reportsQuery.refetch()
        setCreateReportOpen(false)
        reportForm.reset()
      },
    },
    true
  )
  const sendReportMutation = useApiMutation(
    (payload: { reportId: string; data: GovernanceDeptReportSendBody }) =>
      governanceService.sendDepartmentReport(payload.reportId, payload.data),
    {
      onSuccess: () => {
        setSendDialogOpen(false)
        setReportToSend(null)
        sendForm.reset()
      },
    },
    true
  )

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as any,
    defaultValues: {
      title: '',
      report_type: '',
      period_from: '',
      period_to: '',
      file_url: '',
      file_format: '',
    },
  })
  const sendForm = useForm<SendReportFormValues>({
    resolver: zodResolver(sendReportSchema) as any,
    defaultValues: { title_vi: '', body_vi: '' },
  })

  const handleCreateReport: SubmitHandler<ReportFormValues> = (data) => {
    createReportMutation.mutate({
      title: data.title,
      report_type: data.report_type,
      period_from: data.period_from,
      period_to: data.period_to,
      ...(data.file_url?.trim() && { file_url: data.file_url }),
      ...(data.file_format?.trim() && { file_format: data.file_format }),
    })
  }
  const handleSendReport: SubmitHandler<SendReportFormValues> = (data) => {
    if (!reportToSend) return
    sendReportMutation.mutate({ reportId: reportToSend.id, data })
  }

  // ── Capacity alerts ────────────────────────────────────────────────────────
  const capacityQuery = useApiQuery<ApiResponse<any>>(
    ['governance-dept-capacity'],
    () => governanceService.getDepartmentCapacityAlerts({ limit: 50 }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const capacityItems: GovernanceCapacityAlert[] = normalizeList(capacityQuery.data?.data, [
    'alerts',
    'items',
    'data',
  ])

  // ── Conservation ──────────────────────────────────────────────────────────
  const conservQuery = useApiQuery<ApiResponse<GovernanceConservationSummary>>(
    ['governance-dept-conservation'],
    () => governanceService.getDepartmentConservationSummary({ days: 30 }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const conserv = (conservQuery.data?.data ?? {}) as GovernanceConservationSummary
  const conservItems = conserv.items ?? []
  const totalConservationChanges = conservItems.reduce(
    (sum, item) => sum + toNumber(item.detected_changes),
    0
  )
  const totalConservationArea = conservItems.reduce(
    (sum, item) => sum + toNumber(item.total_change_area_ha),
    0
  )
  const pendingBizCount = countByStatus(bizRegs, 'pending')
  const pendingSpotCount = countByStatus(spotRegs, 'pending')
  const activeFeedbackCount =
    countByStatus(feedbacks, 'pending') + countByStatus(feedbacks, 'in_progress')
  const highPriorityFeedbackCount = feedbacks.filter(
    (feedback) => feedback.priority === 'high' || feedback.priority === 'critical'
  ).length
  const overloadedCount = countByStatus(capacityItems, 'overloaded')
  const nearFullCount = countByStatus(capacityItems, 'near_full')

  return (
    <PageLayout
      title="Sở VHTTDL – Quản trị nâng cao"
      description="Duyệt đăng ký, phản ánh, báo cáo và giám sát địa phương"
    >
      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="w-fit flex-wrap">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="biz-reg">Đăng ký DN</TabsTrigger>
          <TabsTrigger value="spot-reg">Đăng ký điểm đến</TabsTrigger>
          <TabsTrigger value="feedbacks">Phản ánh</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
          <TabsTrigger value="capacity">Sức chứa</TabsTrigger>
          <TabsTrigger value="conservation">Bảo tồn</TabsTrigger>
        </TabsList>

        {/* ── Tab: Business Registrations ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Building2 className="size-5" />}
              label="Đăng ký DN chờ duyệt"
              value={formatNumber(pendingBizCount)}
              helper={`${formatNumber(bizRegs.length)} hồ sơ doanh nghiệp`}
              tone={pendingBizCount > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Điểm đến chờ duyệt"
              value={formatNumber(pendingSpotCount)}
              helper={`${formatNumber(spotRegs.length)} hồ sơ điểm đến`}
              tone={pendingSpotCount > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={<MessageSquareWarning className="size-5" />}
              label="Phản ánh đang xử lý"
              value={formatNumber(activeFeedbackCount)}
              helper={`${formatNumber(highPriorityFeedbackCount)} phản ánh ưu tiên cao`}
              tone={highPriorityFeedbackCount > 0 ? 'danger' : 'info'}
            />
            <StatCard
              icon={<FileText className="size-5" />}
              label="Báo cáo đã tạo"
              value={formatNumber(reports.length)}
              helper="Báo cáo gửi Bộ và nội bộ"
              tone="primary"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Quá tải"
              value={formatNumber(overloadedCount)}
              helper="Điểm vượt 100% sức chứa"
              tone={overloadedCount > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Gần đầy"
              value={formatNumber(nearFullCount)}
              helper="Điểm cần phân luồng"
              tone={nearFullCount > 0 ? 'warning' : 'success'}
            />
            <StatCard
              icon={<TreePine className="size-5" />}
              label="Biến động bảo tồn"
              value={`${totalConservationArea.toFixed(2)} ha`}
              helper={`${formatNumber(totalConservationChanges)} biến động phát hiện`}
              tone={totalConservationArea > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RegistrationStatusChart businesses={bizRegs} spots={spotRegs} />
            <FeedbackStatusChart feedbacks={feedbacks} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <CapacityPressurePanel items={capacityItems} />
            <ConservationChart items={conservItems} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="typo-section-title">Ưu tiên vận hành</CardTitle>
              <CardDescription>
                Các tín hiệu nên xử lý trước dựa trên dữ liệu đang có của cấp Sở.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge className="bg-warning/10 text-warning border-warning/20">
                {formatNumber(pendingBizCount + pendingSpotCount)} hồ sơ chờ duyệt
              </Badge>
              <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                {formatNumber(overloadedCount)} điểm quá tải
              </Badge>
              <Badge className="bg-info/10 text-info border-info/20">
                {formatNumber(activeFeedbackCount)} phản ánh cần theo dõi
              </Badge>
              <Badge className="bg-success/10 text-success border-success/20">
                {formatNumber(conservItems.length)} khu bảo tồn có dữ liệu
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="biz-reg" className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select value={bizStatusFilter} onValueChange={setBizStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={bizRegQuery.dataUpdatedAt}
            onRefresh={() => bizRegQuery.refetch()}
            isRefreshing={bizRegQuery.isFetching && !bizRegQuery.isLoading}
            total={bizRegs.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Tên doanh nghiệp</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32">Ngày đăng ký</TableHead>
                  <TableHead className="w-28 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bizRegQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : bizRegs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  bizRegs.map((biz: GovernanceDeptBusinessReg) => {
                    const st = biz.status ?? 'pending'
                    return (
                      <TableRow key={biz.id}>
                        <TableCell className="typo-table-cell font-medium">
                          {biz.name ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell">{biz.owner_name ?? '-'}</TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground">
                          {biz.email ?? '-'}
                        </TableCell>
                        <TableCell>
                          <StatusDotBadge
                            label={REG_STATUS_LABEL[st] ?? st}
                            dotClass={REG_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                            badgeClass={
                              REG_STATUS_BADGE[st] ??
                              'bg-muted/40 text-muted-foreground border-border'
                            }
                          />
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          {biz.created_at ? formatDate(biz.created_at) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {st === 'pending' && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Duyệt"
                                onClick={() =>
                                  approveBizMutation.mutate({ id: biz.id, status: 'approved' })
                                }
                                disabled={approveBizMutation.isPending}
                              >
                                <Check className="text-success size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Từ chối"
                                onClick={() => setBizToReject(biz)}
                              >
                                <X className="text-destructive size-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>

          <RejectBusinessDialog
            open={!!bizToReject}
            onClose={() => setBizToReject(null)}
            onConfirm={(note) => {
              if (bizToReject) {
                approveBizMutation.mutate(
                  {
                    id: bizToReject.id,
                    status: 'rejected',
                    rejection_note: note,
                  },
                  { onSuccess: () => setBizToReject(null) }
                )
              }
            }}
            isPending={approveBizMutation.isPending}
          />
        </TabsContent>

        {/* ── Tab: Spot Registrations ── */}
        <TabsContent value="spot-reg" className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>Trạng thái</Label>
              <Select value={spotStatusFilter} onValueChange={setSpotStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={spotRegQuery.dataUpdatedAt}
            onRefresh={() => spotRegQuery.refetch()}
            isRefreshing={spotRegQuery.isFetching && !spotRegQuery.isLoading}
            total={spotRegs.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Tên điểm đến</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32">Ngày đăng ký</TableHead>
                  <TableHead className="w-24 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spotRegQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : spotRegs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  spotRegs.map((spot: GovernanceDeptSpotReg) => {
                    const st = spot.status ?? 'pending'
                    return (
                      <TableRow key={spot.id}>
                        <TableCell className="typo-table-cell font-medium">
                          {spot.name ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground">
                          {spot.category ?? '-'}
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground max-w-48">
                          <span className="line-clamp-1">{spot.address ?? '-'}</span>
                        </TableCell>
                        <TableCell>
                          <StatusDotBadge
                            label={REG_STATUS_LABEL[st] ?? st}
                            dotClass={REG_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                            badgeClass={
                              REG_STATUS_BADGE[st] ??
                              'bg-muted/40 text-muted-foreground border-border'
                            }
                          />
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          {spot.created_at ? formatDate(spot.created_at) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {st === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Duyệt"
                              onClick={() => setSpotToApprove(spot)}
                            >
                              <Check className="text-success size-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>

          <AlertDialog
            open={!!spotToApprove}
            onOpenChange={(v) => {
              if (!v) setSpotToApprove(null)
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận duyệt điểm đến</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn duyệt điểm đến &quot;{spotToApprove?.name}&quot;?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    spotToApprove &&
                    approveSpotMutation.mutate({ id: spotToApprove.id, status: 'active' })
                  }
                  disabled={approveSpotMutation.isPending}
                >
                  {approveSpotMutation.isPending ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ── Tab: Feedbacks ── */}
        <TabsContent value="feedbacks" className="space-y-4">
          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={feedbackQuery.dataUpdatedAt}
            onRefresh={() => feedbackQuery.refetch()}
            isRefreshing={feedbackQuery.isFetching && !feedbackQuery.isLoading}
            total={feedbacks.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
                  <TableHead className="w-32">Ngày gửi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      Không có phản ánh
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((fb: GovernanceDeptFeedback) => {
                    const st = fb.status ?? 'pending'
                    return (
                      <TableRow key={fb.id}>
                        <TableCell className="typo-table-cell max-w-64 font-medium">
                          <span className="line-clamp-1">{fb.title ?? '-'}</span>
                        </TableCell>
                        <TableCell>
                          <StatusDotBadge
                            label={REG_STATUS_LABEL[st] ?? st}
                            dotClass={REG_STATUS_DOT[st] ?? 'bg-muted-foreground'}
                            badgeClass={
                              REG_STATUS_BADGE[st] ??
                              'bg-muted/40 text-muted-foreground border-border'
                            }
                          />
                        </TableCell>
                        <TableCell className="typo-table-cell text-muted-foreground capitalize">
                          {fb.priority ?? '-'}
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

        {/* ── Tab: Reports ── */}
        <TabsContent value="reports" className="space-y-4">
          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={reportsQuery.dataUpdatedAt}
            onRefresh={() => reportsQuery.refetch()}
            isRefreshing={reportsQuery.isFetching && !reportsQuery.isLoading}
            filter={
              <Button
                variant="default"
                onClick={() => {
                  reportForm.reset()
                  setCreateReportOpen(true)
                }}
              >
                <Plus className="mr-1 size-4" />
                Tạo báo cáo
              </Button>
            }
            total={reports.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại báo cáo</TableHead>
                  <TableHead className="w-28">Từ ngày</TableHead>
                  <TableHead className="w-28">Đến ngày</TableHead>
                  <TableHead className="w-28">Ngày tạo</TableHead>
                  <TableHead className="w-24 text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Chưa có báo cáo
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report: GovernanceDeptReport) => (
                    <TableRow key={report.id}>
                      <TableCell className="typo-table-cell max-w-64 font-medium">
                        <span className="line-clamp-1">{report.title}</span>
                      </TableCell>
                      <TableCell className="typo-table-cell text-muted-foreground capitalize">
                        {report.report_type ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell">
                        {report.period_from ? formatDate(report.period_from) : '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell">
                        {report.period_to ? formatDate(report.period_to) : '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell">
                        {report.created_at ? formatDate(report.created_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Gửi báo cáo"
                          onClick={() => {
                            setReportToSend(report)
                            setSendDialogOpen(true)
                          }}
                        >
                          <Send className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>

          {/* Create report dialog */}
          <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
            <DialogContent className="max-w-lg">
              <DialogTitle>Tạo báo cáo mới</DialogTitle>
              <DialogDescription>Điền thông tin báo cáo gửi Bộ VHTTDL</DialogDescription>
              <form
                onSubmit={reportForm.handleSubmit(handleCreateReport)}
                className="mt-2 space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="report-title">
                    Tiêu đề <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="report-title"
                    {...reportForm.register('title')}
                    placeholder="Tiêu đề báo cáo"
                  />
                  {reportForm.formState.errors.title && (
                    <p className="text-destructive text-sm">
                      {reportForm.formState.errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-type">
                    Loại báo cáo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="report-type"
                    {...reportForm.register('report_type')}
                    placeholder="vd: monthly, quarterly"
                  />
                  {reportForm.formState.errors.report_type && (
                    <p className="text-destructive text-sm">
                      {reportForm.formState.errors.report_type.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="period-from">
                      Từ ngày <span className="text-destructive">*</span>
                    </Label>
                    <Input id="period-from" type="date" {...reportForm.register('period_from')} />
                    {reportForm.formState.errors.period_from && (
                      <p className="text-destructive text-sm">
                        {reportForm.formState.errors.period_from.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period-to">
                      Đến ngày <span className="text-destructive">*</span>
                    </Label>
                    <Input id="period-to" type="date" {...reportForm.register('period_to')} />
                    {reportForm.formState.errors.period_to && (
                      <p className="text-destructive text-sm">
                        {reportForm.formState.errors.period_to.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-url">URL tệp đính kèm</Label>
                  <Input
                    id="file-url"
                    {...reportForm.register('file_url')}
                    placeholder="https://..."
                  />
                  {reportForm.formState.errors.file_url && (
                    <p className="text-destructive text-sm">
                      {reportForm.formState.errors.file_url.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateReportOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createReportMutation.isPending}>
                    {createReportMutation.isPending ? 'Đang tạo...' : 'Tạo báo cáo'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Send report dialog */}
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogTitle>Gửi báo cáo</DialogTitle>
              <DialogDescription>
                Gửi thông báo báo cáo &quot;{reportToSend?.title}&quot; đến các vai trò liên quan
              </DialogDescription>
              <form onSubmit={sendForm.handleSubmit(handleSendReport)} className="mt-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="send-title">
                    Tiêu đề thông báo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="send-title"
                    {...sendForm.register('title_vi')}
                    placeholder="Tiêu đề thông báo"
                  />
                  {sendForm.formState.errors.title_vi && (
                    <p className="text-destructive text-sm">
                      {sendForm.formState.errors.title_vi.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="send-body">
                    Nội dung <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="send-body"
                    {...sendForm.register('body_vi')}
                    placeholder="Nội dung thông báo..."
                    rows={4}
                  />
                  {sendForm.formState.errors.body_vi && (
                    <p className="text-destructive text-sm">
                      {sendForm.formState.errors.body_vi.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setSendDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={sendReportMutation.isPending}>
                    {sendReportMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Tab: Capacity ── */}
        <TabsContent value="capacity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Tổng cảnh báo"
              value={formatNumber(capacityItems.length)}
              helper="Điểm gần đầy hoặc quá tải"
              tone={capacityItems.length > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Quá tải"
              value={formatNumber(overloadedCount)}
              helper="Vượt sức chứa tối đa"
              tone={overloadedCount > 0 ? 'danger' : 'success'}
            />
            <StatCard
              icon={<MapPin className="size-5" />}
              label="Tỷ lệ cao nhất"
              value={
                capacityItems.length > 0
                  ? `${Math.max(...capacityItems.map((item) => toNumber(item.capacity_pct))).toFixed(1)}%`
                  : '-'
              }
              helper="Ưu tiên điều phối"
              tone="warning"
            />
          </div>

          <CapacityPressurePanel items={capacityItems} />
          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={capacityQuery.dataUpdatedAt}
            onRefresh={() => capacityQuery.refetch()}
            isRefreshing={capacityQuery.isFetching && !capacityQuery.isLoading}
            total={capacityItems.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Điểm tham quan</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hiện tại</TableHead>
                  <TableHead className="text-right">Tối đa</TableHead>
                  <TableHead className="text-right">Tỷ lệ (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacityQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : capacityItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Không có cảnh báo
                    </TableCell>
                  </TableRow>
                ) : (
                  capacityItems.map((item: GovernanceCapacityAlert, idx: number) => {
                    const st = item.status ?? 'normal'
                    return (
                      <TableRow key={item.spot_id ?? idx}>
                        <TableCell className="typo-table-cell font-medium">
                          {item.name_vi ?? '-'}
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
                          {formatNumber(item.visitor_count)}
                        </TableCell>
                        <TableCell className="typo-table-cell text-right">
                          {formatNumber(item.max_capacity)}
                        </TableCell>
                        <TableCell className="typo-table-cell">
                          <div className="flex items-center gap-3">
                            <div className="bg-muted h-2 flex-1 rounded-full">
                              <div
                                className={`${getCapacityBarClass(st)} h-2 rounded-full`}
                                style={{ width: `${Math.min(getCapacityPct(item), 100)}%` }}
                              />
                            </div>
                            <span className="min-w-14 text-right font-semibold">
                              {toNumber(item.capacity_pct).toFixed(1)}%
                            </span>
                          </div>
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
          {conservQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu bảo tồn.</p>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-muted text-success rounded-full p-3">
                  <TreePine className="size-5" />
                </div>
                <div>
                  <p className="typo-label text-muted-foreground">Tổng địa điểm</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(conserv.total ?? conservItems.length)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-muted text-warning rounded-full p-3">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <p className="typo-label text-muted-foreground">Nguy cơ</p>
                  <p className="text-2xl font-bold">{formatNumber(totalConservationChanges)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-muted text-destructive rounded-full p-3">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <p className="typo-label text-muted-foreground">Cảnh báo hiện tại</p>
                  <p className="text-2xl font-bold">{`${totalConservationArea.toFixed(2)} ha`}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="bg-muted rounded-full p-3 text-blue-600">
                  <TreePine className="size-5" />
                </div>
                <div>
                  <p className="typo-label text-muted-foreground">Đã xử lý</p>
                  <p className="text-2xl font-bold">{formatNumber(conservItems.length)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <ConservationChart items={conservItems} />

          {conservQuery.isLoading && (
            <p className="text-muted-foreground text-sm">Đang tải dữ liệu bảo tồn...</p>
          )}
          <Button
            variant="secondary"
            onClick={() => conservQuery.refetch()}
            disabled={conservQuery.isFetching}
            className="gap-1.5 px-3"
          >
            <RefreshCw className={`h-6 w-6 ${conservQuery.isFetching ? 'animate-spin' : ''}`} />
            {conservQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
          </Button>
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
