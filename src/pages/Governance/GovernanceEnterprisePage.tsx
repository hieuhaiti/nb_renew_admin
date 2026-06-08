import type { JSX, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useApiQuery, useApiMutation, governanceService, businessService } from '@/service'
import type {
  ApiResponse,
  Business,
  BusinessFormBody,
  GovernanceEnterpriseReport,
  GovernanceEnterpriseReportCreateBody,
  GovernanceEnterpriseDashboard,
  GovernanceEnterpriseFeedback,
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
import { SearchSelect } from '@/components/common/SearchSelect'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  // Gift,
  Globe,
  Eye,
  Link2,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  ReceiptText,
  Route,
  Star,
  Store,
  TicketPercent,
  Users,
  Wallet,
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
import PageLayout from '@/layout/pageLayout'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, formatDateTime } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'
import { BUSINESS_TYPE_LABEL } from '@/constant/businessConstant'
import { ROLE_IDS } from '@/constant/roleConstant'
import BusinessFormDialog from '@/pages/Businesses/BusinessFormDialog'
import { useAuthStore } from '@/stores/common/useAuthStore'

type EnterpriseBusiness = Business & {
  description_vi?: string | null
  description_en?: string | null
}

const LIMIT_OPTIONS = [10, 20, 50]

const numberFormatter = new Intl.NumberFormat('vi-VN')
const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const BUSINESS_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã phê duyệt',
  rejected: 'Từ chối',
  suspended: 'Tạm khóa',
}

const BUSINESS_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted text-muted-foreground border-border',
}

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
  draft: 'bg-muted text-muted-foreground border-border',
  submitted: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

const FEEDBACK_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  closed: 'Đã đóng',
  rejected: 'Từ chối',
}

const FEEDBACK_STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning',
  in_progress: 'bg-primary',
  resolved: 'bg-success',
  closed: 'bg-muted-foreground',
  rejected: 'bg-destructive',
}

const FEEDBACK_STATUS_BADGE: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-success/10 text-success border-success/20',
  closed: 'bg-muted text-muted-foreground border-border',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Khẩn cấp',
}

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  normal: 'bg-secondary/10 text-secondary border-secondary/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  critical: 'bg-destructive text-destructive-foreground border-destructive',
}

const CAPACITY_STATUS_LABEL: Record<string, string> = {
  normal: 'Bình thường',
  busy: 'Đông khách',
  near_full: 'Gần đầy',
  low: 'Thấp',
  moderate: 'Ổn định',
  high: 'Cao',
  overloaded: 'Quá tải',
}

function getCapacityTone(status?: string, capacityPct?: unknown): 'success' | 'warning' | 'danger' {
  const pct = toNumber(capacityPct) ?? 0
  if (status === 'overloaded' || pct >= 100) return 'danger'
  if (status === 'near_full' || status === 'busy' || status === 'high' || pct >= 85) {
    return 'warning'
  }
  return 'success'
}

function getCapacityBadgeClass(status?: string, capacityPct?: unknown): string {
  const tone = getCapacityTone(status, capacityPct)
  if (tone === 'danger') return 'bg-destructive/10 text-destructive border-destructive/20'
  if (tone === 'warning') return 'bg-warning/10 text-warning border-warning/20'
  return 'bg-success/10 text-success border-success/20'
}

function getCapacityBarClass(status?: string, capacityPct?: unknown): string {
  const tone = getCapacityTone(status, capacityPct)
  if (tone === 'danger') return 'bg-destructive'
  if (tone === 'warning') return 'bg-warning'
  return 'bg-success'
}

const optionalNumber = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().nonnegative().optional()
)

const optionalCapacityPct = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().min(0).max(100).optional()
)

const reportSchema = z
  .object({
    report_period: z.enum(['month', 'quarter', 'year'], {
      message: 'Vui lòng chọn kỳ báo cáo',
    }),
    period_from: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    period_to: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    total_revenue_vnd: optionalNumber,
    total_bookings: optionalNumber,
    total_visitors: optionalNumber,
    avg_capacity_pct: optionalCapacityPct,
    notes: z.string().max(1000, 'Ghi chú tối đa 1000 ký tự').optional().or(z.literal('')),
  })
  .refine((value) => new Date(value.period_from) <= new Date(value.period_to), {
    message: 'Ngày bắt đầu không được sau ngày kết thúc',
    path: ['period_to'],
  })

type ReportFormValues = z.infer<typeof reportSchema>

function toNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatNumber(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : numberFormatter.format(parsed)
}

function formatCurrency(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : currencyFormatter.format(parsed)
}

function formatPercent(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : `${parsed.toFixed(1)}%`
}

function formatCompactNumber(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  if (parsed >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ`
  if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)} tr`
  if (parsed >= 1_000) return `${(parsed / 1_000).toFixed(1)}k`
  return numberFormatter.format(parsed)
}

function formatCompactCurrency(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  const abs = Math.abs(parsed)
  if (abs >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ đồng`
  if (abs >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)} triệu đồng`
  if (abs >= 1_000) return `${(parsed / 1_000).toFixed(0)} ngàn đồng`
  return `${numberFormatter.format(parsed)} đồng`
}

function formatChartCurrency(value: unknown): string {
  const parsed = toNumber(value)
  if (parsed == null) return '-'
  const abs = Math.abs(parsed)
  if (abs >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${(parsed / 1_000_000).toFixed(0)} tr`
  if (abs >= 1_000) return `${(parsed / 1_000).toFixed(0)}k`
  return numberFormatter.format(parsed)
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => value != null && value !== '')
}

function formatDateValue(value: unknown, withTime = false): string {
  if (typeof value !== 'string' || !value) return '-'
  return withTime ? formatDateTime(value) : formatDate(value)
}

function formatTextValue(value: unknown): string {
  if (value == null || value === '') return '-'
  return String(value)
}

function hasDisplayValue(value?: string): boolean {
  return value != null && value.trim() !== '' && value.trim() !== '-'
}

type DetailGroupItem = {
  label: string
  value: string
  helper?: string
  rawValue?: unknown
  helperRawValue?: unknown
  icon?: ReactNode
}

function hasDetailValue(value: unknown): boolean {
  if (value == null || value === '') return false
  const parsed = toNumber(value)
  return parsed == null || parsed !== 0
}

function normalizeList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (!data || typeof data !== 'object') return []

  const record = data as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }

  for (const topKey of ['data', 'items']) {
    const nested = record[topKey]
    if (Array.isArray(nested)) return nested as T[]
    if (nested && typeof nested === 'object') {
      for (const key of keys) {
        const value = (nested as Record<string, unknown>)[key]
        if (Array.isArray(value)) return value as T[]
      }
    }
  }

  return []
}

function getStatusBadge(status?: string): JSX.Element {
  const value = status ?? 'pending'
  return (
    <Badge
      className={BUSINESS_STATUS_BADGE[value] ?? 'bg-muted text-muted-foreground border-border'}
    >
      {BUSINESS_STATUS_LABEL[value] ?? value}
    </Badge>
  )
}

function getBusinessTypeLabel(type?: string | null): string {
  if (!type) return 'Chưa phân loại'
  return BUSINESS_TYPE_LABEL[type] ?? type.replaceAll('_', ' ')
}

function getReportPeriodLabel(period?: string): string {
  if (period === 'month') return 'Tháng'
  if (period === 'quarter') return 'Quý'
  if (period === 'year') return 'Năm'
  return period ?? '-'
}

function getTotalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

function includesSearch(...values: Array<unknown>): (keyword: string) => boolean {
  const source = values
    .filter((value) => value != null)
    .join(' ')
    .toLowerCase()

  return (keyword: string) => !keyword || source.includes(keyword.toLowerCase())
}

type MetricTone = 'primary' | 'info' | 'success' | 'warning'
type DetailTone = MetricTone | 'violet'

const METRIC_TONE_CLASS: Record<MetricTone, { icon: string; bar: string }> = {
  primary: {
    icon: 'bg-primary/10 text-primary ring-primary/15',
    bar: 'bg-primary',
  },
  info: {
    icon: 'bg-info/10 text-info ring-info/15',
    bar: 'bg-info',
  },
  success: {
    icon: 'bg-success/10 text-success ring-success/15',
    bar: 'bg-success',
  },
  warning: {
    icon: 'bg-warning/10 text-warning ring-warning/15',
    bar: 'bg-warning',
  },
}

const DETAIL_TONE_CLASS: Record<
  DetailTone,
  { card: string; headerIcon: string; itemIcon: string; item: string; accent: string }
> = {
  primary: {
    card: 'border-primary/20 bg-primary/5',
    headerIcon: 'bg-primary/10 text-primary ring-primary/15',
    itemIcon: 'bg-primary/10 text-primary',
    item: 'border-primary/10 bg-primary/5',
    accent: 'bg-primary',
  },
  info: {
    card: 'border-info/20 bg-info/5',
    headerIcon: 'bg-info/10 text-info ring-info/15',
    itemIcon: 'bg-info/10 text-info',
    item: 'border-info/10 bg-info/5',
    accent: 'bg-info',
  },
  success: {
    card: 'border-success/20 bg-success/5',
    headerIcon: 'bg-success/10 text-success ring-success/15',
    itemIcon: 'bg-success/10 text-success',
    item: 'border-success/10 bg-success/5',
    accent: 'bg-success',
  },
  warning: {
    card: 'border-warning/20 bg-warning/5',
    headerIcon: 'bg-warning/10 text-warning ring-warning/15',
    itemIcon: 'bg-warning/10 text-warning',
    item: 'border-warning/10 bg-warning/5',
    accent: 'bg-warning',
  },
  violet: {
    card: 'border-violet-200 bg-violet-50/40 dark:border-violet-900/60 dark:bg-violet-950/20',
    headerIcon:
      'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900',
    itemIcon: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    item: 'border-violet-100 bg-violet-50/70 dark:border-violet-900/50 dark:bg-violet-950/20',
    accent: 'bg-violet-500',
  },
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
}: {
  icon: ReactNode
  label: string
  value: string
  helper?: string
  tone?: MetricTone
}) {
  const classes = METRIC_TONE_CLASS[tone]

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex items-start gap-4 p-5">
        <div className={`absolute inset-x-0 top-0 h-1 ${classes.bar}`} />
        <div className={`${classes.icon} rounded-xl p-3 ring-1`}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-meta text-muted-foreground">{label}</p>
          <p className="typo-section-title mt-1 truncate">{value}</p>
          {helper && <p className="typo-caption text-muted-foreground mt-1">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function DetailGroupCard({
  title,
  description,
  icon,
  items,
  tone = 'primary',
}: {
  title: string
  description?: string
  icon: ReactNode
  items: DetailGroupItem[]
  tone?: DetailTone
}) {
  const visibleItems = items.filter(
    (item) =>
      hasDisplayValue(item.value) &&
      (item.rawValue === undefined ? hasDetailValue(item.value) : hasDetailValue(item.rawValue))
  )
  const classes = DETAIL_TONE_CLASS[tone]

  if (visibleItems.length === 0) return null

  return (
    <Card className={`relative overflow-hidden shadow-sm ${classes.card}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${classes.accent}`} />
      <CardHeader className="space-y-1">
        <div className="flex items-start gap-3">
          <div className={`${classes.headerIcon} rounded-lg p-2 ring-1`}>{icon}</div>
          <div className="min-w-0">
            <CardTitle className="typo-section-title">{title}</CardTitle>
            {description && (
              <CardDescription className="typo-meta mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleItems.map((item) => (
            <div key={item.label} className={`${classes.item} rounded-md border p-3`}>
              <div className="flex items-start gap-2">
                {item.icon && (
                  <span className={`${classes.itemIcon} mt-0.5 rounded-md p-1.5`}>{item.icon}</span>
                )}
                <div className="min-w-0">
                  <p className="typo-caption text-muted-foreground">{item.label}</p>
                  <p className="typo-body-sm mt-1 font-semibold">{item.value}</p>
                  {hasDisplayValue(item.helper) &&
                    (item.helperRawValue === undefined || hasDetailValue(item.helperRawValue)) && (
                      <p className="typo-caption text-muted-foreground mt-1">{item.helper}</p>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatePanel({
  title,
  description,
  tone = 'muted',
  actions,
}: {
  title: string
  description?: string
  tone?: 'muted' | 'danger'
  actions?: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div
          className={
            tone === 'danger'
              ? 'bg-destructive/10 text-destructive rounded-full p-3'
              : 'bg-muted text-muted-foreground rounded-full p-3'
          }
        >
          <AlertTriangle className="size-5" />
        </div>
        <p className="typo-section-title">{title}</p>
        {description && <p className="typo-meta text-muted-foreground max-w-xl">{description}</p>}
        {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
      </CardContent>
    </Card>
  )
}

function BusinessHeader({
  businesses,
  selectedBusiness,
  selectedBusinessId,
  onBusinessChange,
  isLoading,
  roleName,
}: {
  businesses: EnterpriseBusiness[]
  selectedBusiness?: EnterpriseBusiness
  selectedBusinessId: string
  onBusinessChange: (value: string) => void
  isLoading: boolean
  roleName: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">{roleName}</Badge>
                  {selectedBusiness?.status && getStatusBadge(selectedBusiness.status)}
                </div>
                <div>
                  <h2 className="typo-section-title">
                    {selectedBusiness?.business_name ?? 'Đang tải cơ sở kinh doanh'}
                  </h2>
                  <p className="typo-meta text-muted-foreground max-w-3xl">
                    Theo dõi vận hành, doanh thu báo cáo, sức chứa và phản ánh lân cận cho các cơ sở
                    dịch vụ thuộc tài khoản của bạn.
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2 sm:w-80">
                <Label>Cơ sở đang xem</Label>
                <SearchSelect
                  options={businesses.map((business) => ({
                    value: business.id,
                    label: business.business_name,
                  }))}
                  value={selectedBusinessId}
                  onValueChange={onBusinessChange}
                  placeholder={isLoading ? 'Đang tải...' : 'Chọn cơ sở'}
                  searchPlaceholder="Tìm cơ sở..."
                  disabled={isLoading || businesses.length === 0}
                  className="w-full"
                />
              </div>
            </div>

            {selectedBusiness && (
              <div className="grid gap-3 md:grid-cols-3">
                <InfoTile
                  label="Loại hình"
                  value={getBusinessTypeLabel(selectedBusiness.business_type)}
                />
                <InfoTile label="Mã cơ sở" value={selectedBusiness.business_code ?? '-'} />
                <InfoTile label="Tỉnh/Thành" value={selectedBusiness.province_code ?? '-'} />
              </div>
            )}
          </div>

          <div className="border-border bg-muted/30 border-t p-6 lg:border-t-0 lg:border-l">
            <div className="space-y-4">
              <div>
                <p className="typo-section-title">Thông tin liên hệ</p>
                <p className="typo-meta text-muted-foreground">
                  Dữ liệu hồ sơ dùng cho vận hành và báo cáo doanh nghiệp.
                </p>
              </div>
              <div className="space-y-3">
                <InfoLine
                  icon={<MapPin className="size-4" />}
                  value={selectedBusiness?.address_vi}
                />
                <InfoLine icon={<Users className="size-4" />} value={selectedBusiness?.phone} />
                <InfoLine icon={<Building2 className="size-4" />} value={selectedBusiness?.email} />
                {selectedBusiness?.website && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <a href={selectedBusiness.website} target="_blank" rel="noreferrer">
                      <Eye className="mr-2 size-4" />
                      Xem website
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <p className="typo-caption text-muted-foreground">{label}</p>
      <p className="typo-body-sm mt-1 font-semibold">{value}</p>
    </div>
  )
}

function InfoLine({ icon, value }: { icon: ReactNode; value?: string | null }) {
  return (
    <div className="text-muted-foreground flex items-start gap-2">
      <span className="text-primary mt-0.5">{icon}</span>
      <span className="typo-body-sm min-w-0 break-words">{value || '-'}</span>
    </div>
  )
}

function RevenueTrend({
  items,
}: {
  items: NonNullable<GovernanceEnterpriseDashboard['revenue_trend']>
}) {
  const maxRevenue = Math.max(...items.map((item) => toNumber(item.revenue_vnd) ?? 0), 1)
  const chartData = items.map((item) => ({
    period: item.period ?? '-',
    revenue: toNumber(item.revenue_vnd) ?? 0,
    bookings: toNumber(item.bookings) ?? 0,
    visitors: toNumber(item.visitors) ?? 0,
  }))
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0)
  const latest = chartData.at(-1)
  const previous = chartData.at(-2)
  const revenueDeltaPct =
    latest && previous && previous.revenue > 0
      ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
      : undefined

  if (items.length === 0) {
    return (
      <StatePanel
        title="Chưa có xu hướng doanh thu"
        description="Khi doanh nghiệp có báo cáo đã được ghi nhận, biểu đồ xu hướng sẽ hiển thị tại đây."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Xu hướng doanh thu</CardTitle>
        <CardDescription>Theo dõi doanh thu, lượt đặt chỗ và lượt khách theo kỳ.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="border-border/70 bg-primary/5 rounded-lg border p-3">
            <p className="typo-caption text-muted-foreground">Tổng doanh thu</p>
            <p className="typo-body-sm text-primary mt-1 font-semibold">
              {formatCompactCurrency(totalRevenue)}
            </p>
          </div>
          <div className="border-border/70 bg-info/5 rounded-lg border p-3">
            <p className="typo-caption text-muted-foreground">Kỳ mới nhất</p>
            <p className="typo-body-sm text-info mt-1 font-semibold">
              {latest ? formatCompactCurrency(latest.revenue) : '-'}
            </p>
          </div>
          <div className="border-border/70 bg-success/5 rounded-lg border p-3">
            <p className="typo-caption text-muted-foreground">Tăng trưởng</p>
            <p className="typo-body-sm text-success mt-1 font-semibold">
              {revenueDeltaPct == null
                ? '-'
                : `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct.toFixed(1)}%`}
            </p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={320}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="enterpriseRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="revenue"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={42}
                tickFormatter={formatChartCurrency}
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
                fill="url(#enterpriseRevenueFill)"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <Bar
                yAxisId="volume"
                dataKey="visitors"
                name="Lượt khách"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.72}
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

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">Doanh thu</Badge>
          <Badge className="bg-info/10 text-info border-info/20">Lượt khách</Badge>
          <Badge className="bg-success/10 text-success border-success/20">Đặt chỗ</Badge>
        </div>

        {items.map((item) => {
          const revenue = toNumber(item.revenue_vnd) ?? 0
          const width = Math.max(6, Math.round((revenue / maxRevenue) * 100))

          return (
            <div key={item.period ?? revenue} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="typo-body-sm font-semibold">{item.period ?? '-'}</p>
                  <p className="typo-caption text-muted-foreground">
                    {formatNumber(item.visitors)} khách · {formatNumber(item.bookings)} đặt chỗ
                  </p>
                </div>
                <p className="typo-body-sm font-semibold">{formatCurrency(revenue)}</p>
              </div>
              <div className="bg-muted h-2 rounded-full">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${width}%` }} />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CapacityAlerts({
  alerts,
}: {
  alerts: NonNullable<GovernanceEnterpriseDashboard['capacity_alerts']>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Cảnh báo sức chứa liên quan</CardTitle>
        <CardDescription>Các điểm/sự kiện có dữ liệu sức chứa gần cơ sở đang chọn.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Không có cảnh báo sức chứa</p>
            <p className="typo-meta text-muted-foreground">
              Hiện chưa ghi nhận khu vực lân cận có dấu hiệu quá tải.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={`${alert.spot_id}-${alert.recorded_at}`}
              className="border-border rounded-lg border p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="typo-body-sm font-semibold">{alert.name_vi ?? 'Điểm liên quan'}</p>
                  <p className="typo-caption text-muted-foreground">
                    Cập nhật {formatDateTime(alert.recorded_at)}
                  </p>
                </div>
                <Badge className={getCapacityBadgeClass(alert.status, alert.capacity_pct)}>
                  {CAPACITY_STATUS_LABEL[alert.status ?? ''] ?? alert.status ?? 'Theo dõi'}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="bg-muted h-2 flex-1 rounded-full">
                  <div
                    className={`${getCapacityBarClass(alert.status, alert.capacity_pct)} h-2 rounded-full`}
                    style={{ width: `${Math.min(toNumber(alert.capacity_pct) ?? 0, 100)}%` }}
                  />
                </div>
                <span className="typo-body-sm font-semibold">
                  {formatPercent(alert.capacity_pct)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export default function GovernanceEnterprisePage(): JSX.Element {
  const user = useAuthStore((state) => state.user)
  const roleId = user?.role_id ?? user?.role?.id
  const userScopeKey = `${user?.id ?? 'anonymous'}:${roleId ?? 'none'}`
  const hideCapacityAlerts =
    roleId === ROLE_IDS.SERVICE_PROVIDER || roleId === ROLE_IDS.TRAVEL_COMPANY
  const roleName = user?.role?.name_vi ?? user?.role_name ?? user?.role?.name ?? 'Đơn vị du lịch'
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [dashboardPeriod, setDashboardPeriod] = useState('month')
  const [reportSearch, setReportSearch] = useState('')
  const [reportStatus, setReportStatus] = useState('all')
  const [reportSort, setReportSort] = useState('newest')
  const [reportPage, setReportPage] = useState(1)
  const [reportLimit, setReportLimit] = useState(10)
  const [feedbackSearch, setFeedbackSearch] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState('all')
  const [feedbackPriority, setFeedbackPriority] = useState('all')
  const [feedbackPage, setFeedbackPage] = useState(1)
  const [feedbackLimit, setFeedbackLimit] = useState(10)
  const [radiusKm, setRadiusKm] = useState('20')
  const [createReportOpen, setCreateReportOpen] = useState(false)
  const [createBusinessOpen, setCreateBusinessOpen] = useState(false)

  const businessesQuery = useApiQuery<ApiResponse<unknown>>(
    ['businesses-me', userScopeKey],
    () => businessService.getMe(),
    { staleTime: STALE_REF, enabled: !!user?.id },
    false,
    false
  )

  const businesses = normalizeList<EnterpriseBusiness>(businessesQuery.data?.data, [
    'businesses',
    'items',
    'data',
  ])

  const createBusinessMutation = useApiMutation<
    ApiResponse<Business | { business?: Business }>,
    BusinessFormBody
  >(
    (data) => businessService.create(data),
    {
      onSuccess: (response) => {
        const createdData = response.data
        const createdBusiness =
          createdData && 'business' in createdData
            ? (createdData.business ?? null)
            : ((createdData as Business | undefined) ?? null)

        setCreateBusinessOpen(false)
        businessesQuery.refetch()
        if (createdBusiness?.id) {
          setSelectedBusinessId(createdBusiness.id)
        }
      },
    },
    true
  )

  useEffect(() => {
    setSelectedBusinessId('')
    setReportPage(1)
    setFeedbackPage(1)
  }, [userScopeKey])

  useEffect(() => {
    if (businesses.length === 0) return
    if (!selectedBusinessId || !businesses.some((business) => business.id === selectedBusinessId)) {
      setSelectedBusinessId(businesses[0].id)
    }
  }, [businesses, selectedBusinessId])

  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId)
  const selectedBusinessName = selectedBusiness?.business_name ?? 'Cơ sở đang chọn'
  const selectedBusinessReportsLabel = selectedBusiness
    ? `Báo cáo của ${selectedBusiness.business_name}`
    : 'Báo cáo hoạt động'

  const dashboardQuery = useApiQuery<ApiResponse<GovernanceEnterpriseDashboard>>(
    ['governance-enterprise-dashboard', userScopeKey, selectedBusinessId, dashboardPeriod],
    () =>
      governanceService.getEnterpriseDashboard(selectedBusinessId, {
        period: dashboardPeriod,
        year: new Date().getFullYear(),
      }),
    { staleTime: STALE_DEFAULT, enabled: !!user?.id && !!selectedBusinessId },
    false,
    false
  )

  const reportsQuery = useApiQuery<ApiResponse<unknown>>(
    ['governance-enterprise-reports', userScopeKey],
    () => governanceService.getEnterpriseReports({ limit: 50 }),
    { staleTime: STALE_DEFAULT, enabled: !!user?.id && businesses.length > 0 },
    false,
    false
  )

  const feedbacksQuery = useApiQuery<ApiResponse<unknown>>(
    ['governance-enterprise-feedbacks', userScopeKey, selectedBusinessId, radiusKm],
    () =>
      governanceService.getEnterpriseFeedbacks(selectedBusinessId, {
        limit: 50,
        radius_km: Number(radiusKm),
      }),
    { staleTime: STALE_DEFAULT, enabled: !!user?.id && !!selectedBusinessId },
    false,
    false
  )

  const reportForm = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema) as Resolver<ReportFormValues>,
    defaultValues: {
      report_period: 'month',
      period_from: '',
      period_to: '',
      total_revenue_vnd: undefined,
      total_bookings: undefined,
      total_visitors: undefined,
      avg_capacity_pct: undefined,
      notes: '',
    },
  })

  const createReportMutation = useApiMutation<
    ApiResponse<unknown>,
    GovernanceEnterpriseReportCreateBody
  >(
    (data) => governanceService.createEnterpriseReport(data),
    {
      onSuccess: () => {
        reportsQuery.refetch()
        setCreateReportOpen(false)
        reportForm.reset()
      },
    },
    false
  )

  const dashboard = dashboardQuery.data?.data
  const summary = dashboard?.summary
  const reportedMetrics = dashboard?.reported_metrics
  const reportedRevenue = firstPresent(
    reportedMetrics?.total_revenue_vnd,
    summary?.reported_revenue_vnd,
    summary?.total_revenue_vnd,
    dashboard?.total_revenue_vnd
  )
  const reportedBookings = firstPresent(
    reportedMetrics?.total_bookings,
    summary?.reported_bookings,
    summary?.total_bookings,
    dashboard?.total_bookings
  )
  const reportedVisitors = firstPresent(
    reportedMetrics?.total_visitors,
    summary?.reported_visitors,
    summary?.total_visitors,
    dashboard?.total_visitors
  )
  const reportedAvgCapacityPct = firstPresent(
    reportedMetrics?.avg_capacity_pct,
    summary?.avg_capacity_pct,
    dashboard?.capacity_pct
  )
  const reportedReportCount = firstPresent(reportedMetrics?.report_count, summary?.report_count)
  const dashboardBusiness = (dashboard?.business ?? selectedBusiness ?? {}) as Record<
    string,
    unknown
  >
  const dashboardPeriodValue = dashboard?.period
  const dashboardPeriodObject =
    dashboardPeriodValue && typeof dashboardPeriodValue === 'object' ? dashboardPeriodValue : null
  const dashboardPeriodLabel =
    dashboardPeriodObject?.type || typeof dashboardPeriodValue === 'string'
      ? getReportPeriodLabel(
          dashboardPeriodObject?.type ??
            (typeof dashboardPeriodValue === 'string' ? dashboardPeriodValue : undefined)
        )
      : '-'
  const dashboardPeriodRange =
    dashboardPeriodObject?.from || dashboardPeriodObject?.to
      ? `${formatDateValue(dashboardPeriodObject.from)} - ${formatDateValue(dashboardPeriodObject.to)}`
      : '-'
  const revenueTrend = dashboard?.revenue_trend ?? []
  const capacityAlerts = dashboard?.capacity_alerts ?? []
  const summaryServiceItems = [
    {
      label: 'Dịch vụ',
      value: formatNumber(summary?.service_count),
      helper: `${formatNumber(summary?.active_service_count)} đang hoạt động`,
      rawValue: summary?.service_count,
      helperRawValue: summary?.active_service_count,
      icon: <Store className="size-4" />,
    },
    {
      label: 'Điểm du lịch liên kết',
      value: formatNumber(summary?.linked_spot_count),
      rawValue: summary?.linked_spot_count,
      icon: <Link2 className="size-4" />,
    },
    {
      label: 'Tour',
      value: formatNumber(summary?.tour_count),
      helper: `${formatNumber(summary?.active_tour_count)} đang hoạt động`,
      rawValue: summary?.tour_count,
      helperRawValue: summary?.active_tour_count,
      icon: <Route className="size-4" />,
    },
    {
      label: 'Giá trị tour niêm yết',
      value: formatCompactCurrency(summary?.listed_tour_value_vnd),
      helper: `${formatNumber(summary?.listed_tour_capacity)} sức chứa tour`,
      rawValue: summary?.listed_tour_value_vnd,
      helperRawValue: summary?.listed_tour_capacity,
      icon: <Wallet className="size-4" />,
    },
  ]
  const summaryCommerceItems = [
    {
      label: 'Sản phẩm OCOP',
      value: formatNumber(summary?.ocop_count),
      helper: `${formatNumber(summary?.active_ocop_count)} đang hoạt động`,
      rawValue: summary?.ocop_count,
      helperRawValue: summary?.active_ocop_count,
      icon: <PackageCheck className="size-4" />,
    },
    {
      label: 'Sao OCOP trung bình',
      value: formatNumber(summary?.avg_ocop_stars),
      rawValue: summary?.avg_ocop_stars,
      icon: <Star className="size-4" />,
    },
    {
      label: 'Giá trị OCOP niêm yết',
      value: formatCompactCurrency(summary?.listed_ocop_value_vnd),
      rawValue: summary?.listed_ocop_value_vnd,
      icon: <Wallet className="size-4" />,
    },
    {
      label: 'Voucher',
      value: formatNumber(summary?.voucher_count),
      helper: `${formatNumber(summary?.active_voucher_count)} hoạt động, ${formatNumber(summary?.voucher_used_count)} đã dùng`,
      rawValue: summary?.voucher_count,
      helperRawValue:
        (toNumber(summary?.active_voucher_count) ?? 0) > 0 ||
        (toNumber(summary?.voucher_used_count) ?? 0) > 0
          ? 1
          : 0,
      icon: <TicketPercent className="size-4" />,
    },
    {
      label: 'Đánh giá dashboard',
      value: formatNumber(summary?.rating_avg),
      helper: `${formatNumber(summary?.rating_count)} lượt đánh giá trong dữ liệu tổng hợp`,
      rawValue: summary?.rating_avg,
      helperRawValue: summary?.rating_count,
      icon: <Star className="size-4" />,
    },
  ]
  const summaryOperationsItems = [
    {
      label: 'Khách hiện tại',
      value: formatNumber(summary?.current_visitors),
      rawValue: summary?.current_visitors,
      icon: <Users className="size-4" />,
    },
    {
      label: 'Sức chứa hiện tại',
      value: formatPercent(summary?.avg_capacity_pct),
      rawValue: summary?.avg_capacity_pct,
      icon: <Gauge className="size-4" />,
    },
    {
      label: 'Cảnh báo sức chứa',
      value: formatNumber(summary?.capacity_alert_count),
      helper: `${formatNumber(capacityAlerts.length)} bản ghi cảnh báo trả về`,
      rawValue: summary?.capacity_alert_count,
      helperRawValue: capacityAlerts.length,
      icon: <AlertTriangle className="size-4" />,
    },
    {
      label: 'Báo cáo hoạt động',
      value: formatNumber(reportedReportCount),
      helper: hasDisplayValue(formatTextValue(reportedMetrics?.source))
        ? `Nguồn: ${formatTextValue(reportedMetrics?.source)}`
        : undefined,
      rawValue: reportedReportCount,
      icon: <FileText className="size-4" />,
    },
    {
      label: 'Doanh thu báo cáo',
      value: formatCompactCurrency(reportedRevenue),
      helper: formatCurrency(reportedRevenue),
      rawValue: reportedRevenue,
      helperRawValue: reportedRevenue,
      icon: <ReceiptText className="size-4" />,
    },
    {
      label: 'Booking / khách báo cáo',
      value: `${formatNumber(reportedBookings)} / ${formatNumber(reportedVisitors)}`,
      rawValue:
        (toNumber(reportedBookings) ?? 0) > 0 || (toNumber(reportedVisitors) ?? 0) > 0 ? 1 : 0,
      icon: <Users className="size-4" />,
    },
  ]
  const businessProfileItems = [
    {
      label: 'Mã cơ sở',
      value: formatTextValue(
        firstPresent(dashboardBusiness.business_code, selectedBusiness?.business_code)
      ),
      icon: <ClipboardList className="size-4" />,
    },
    {
      label: 'Loại hình',
      value: getBusinessTypeLabel(
        formatTextValue(
          firstPresent(dashboardBusiness.business_type, selectedBusiness?.business_type)
        )
      ),
      icon: <Building2 className="size-4" />,
    },
    {
      label: 'Mã số thuế',
      value: formatTextValue(dashboardBusiness.tax_id),
      icon: <ReceiptText className="size-4" />,
    },
    {
      label: 'Giấy phép',
      value: formatTextValue(dashboardBusiness.license_number),
      icon: <FileText className="size-4" />,
    },
    {
      label: 'Email',
      value: formatTextValue(firstPresent(dashboardBusiness.email, selectedBusiness?.email)),
      icon: <Mail className="size-4" />,
    },
    {
      label: 'Điện thoại',
      value: formatTextValue(firstPresent(dashboardBusiness.phone, selectedBusiness?.phone)),
      icon: <Phone className="size-4" />,
    },
    {
      label: 'Website',
      value: formatTextValue(firstPresent(dashboardBusiness.website, selectedBusiness?.website)),
      icon: <Globe className="size-4" />,
    },
    {
      label: 'Phê duyệt',
      value: formatDateValue(dashboardBusiness.approved_at, true),
      helper:
        BUSINESS_STATUS_LABEL[formatTextValue(dashboardBusiness.status)] ??
        formatTextValue(dashboardBusiness.status),
      icon: <PackageCheck className="size-4" />,
    },
    {
      label: 'Cập nhật gần nhất',
      value: formatDateValue(
        firstPresent(dashboardBusiness.updated_at, selectedBusiness?.updated_at),
        true
      ),
      icon: <CalendarDays className="size-4" />,
    },
    {
      label: 'Kỳ dữ liệu',
      value: dashboardPeriodLabel,
      helper: dashboardPeriodRange,
      icon: <CalendarDays className="size-4" />,
    },
  ]

  const reports = normalizeList<GovernanceEnterpriseReport>(reportsQuery.data?.data, [
    'reports',
    'items',
    'data',
  ])

  const feedbacks = normalizeList<GovernanceEnterpriseFeedback>(feedbacksQuery.data?.data, [
    'feedbacks',
    'items',
    'data',
  ])

  const filteredReports = reports
    .filter((report) => !selectedBusinessId || report.business_id === selectedBusinessId)
    .filter((report) => reportStatus === 'all' || report.status === reportStatus)
    .filter((report) =>
      includesSearch(
        report.business_name,
        report.report_period,
        report.status,
        report.notes,
        report.period_from,
        report.period_to
      )(reportSearch.trim())
    )
    .sort((a, b) => {
      if (reportSort === 'revenue_desc') {
        return (toNumber(b.total_revenue_vnd) ?? 0) - (toNumber(a.total_revenue_vnd) ?? 0)
      }
      if (reportSort === 'visitors_desc') {
        return (toNumber(b.total_visitors) ?? 0) - (toNumber(a.total_visitors) ?? 0)
      }
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    })

  const filteredFeedbacks = feedbacks
    .filter((feedback) => feedbackStatus === 'all' || feedback.status === feedbackStatus)
    .filter((feedback) => feedbackPriority === 'all' || feedback.priority === feedbackPriority)
    .filter((feedback) =>
      includesSearch(
        feedback.title,
        feedback.content,
        feedback.description,
        feedback.location_text,
        feedback.status,
        feedback.priority
      )(feedbackSearch.trim())
    )
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  const pagedReports = paginate(filteredReports, reportPage, reportLimit)
  const pagedFeedbacks = paginate(filteredFeedbacks, feedbackPage, feedbackLimit)
  const reportTotalPages = getTotalPages(filteredReports.length, reportLimit)
  const feedbackTotalPages = getTotalPages(filteredFeedbacks.length, feedbackLimit)

  useEffect(() => {
    if (reportPage > reportTotalPages) setReportPage(reportTotalPages)
  }, [reportPage, reportTotalPages])

  useEffect(() => {
    if (feedbackPage > feedbackTotalPages) setFeedbackPage(feedbackTotalPages)
  }, [feedbackPage, feedbackTotalPages])

  const handleCreateReport: SubmitHandler<ReportFormValues> = (data) => {
    if (!selectedBusinessId) return

    createReportMutation.mutate({
      business_id: selectedBusinessId,
      report_period: data.report_period,
      period_from: data.period_from,
      period_to: data.period_to,
      ...(data.total_revenue_vnd != null && { total_revenue_vnd: data.total_revenue_vnd }),
      ...(data.total_bookings != null && { total_bookings: data.total_bookings }),
      ...(data.total_visitors != null && { total_visitors: data.total_visitors }),
      ...(data.avg_capacity_pct != null && { avg_capacity_pct: data.avg_capacity_pct }),
      ...(data.notes?.trim() && { notes: data.notes.trim() }),
    })
  }

  return (
    <PageLayout
      title={roleName}
      description={`Không gian quản trị dành cho ${roleName.toLowerCase()}: theo dõi cơ sở, báo cáo hoạt động và phản ánh lân cận.`}
    >
      <div className="space-y-6">
        {businessesQuery.isError ? (
          <StatePanel
            tone="danger"
            title="Không thể tải hồ sơ doanh nghiệp"
            description="Vui lòng thử tải lại trang hoặc liên hệ quản trị hệ thống nếu lỗi tiếp tục xảy ra."
          />
        ) : businessesQuery.isLoading ? (
          <StatePanel
            title="Đang tải hồ sơ doanh nghiệp"
            description="Hệ thống đang kiểm tra các cơ sở thuộc tài khoản của bạn."
          />
        ) : businesses.length === 0 ? (
          <StatePanel
            title="Chưa có cơ sở kinh doanh"
            description="Tài khoản này chưa được liên kết với cơ sở dịch vụ du lịch nào nên chưa thể xem dashboard hoặc nộp báo cáo."
            actions={
              <Button onClick={() => setCreateBusinessOpen(true)}>
                <Plus className="mr-1 size-4" />
                Đăng ký doanh nghiệp
              </Button>
            }
          />
        ) : (
          <>
            <BusinessHeader
              businesses={businesses}
              selectedBusiness={selectedBusiness}
              selectedBusinessId={selectedBusinessId}
              onBusinessChange={(value) => {
                setSelectedBusinessId(value)
                setReportPage(1)
                setFeedbackPage(1)
              }}
              isLoading={businessesQuery.isLoading}
              roleName={roleName}
            />

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="reports">Báo cáo</TabsTrigger>
                <TabsTrigger value="feedbacks">Phản ánh lân cận</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="typo-section-title">Tổng quan vận hành</p>
                      <p className="typo-meta text-muted-foreground">
                        Dữ liệu tổng hợp theo kỳ báo cáo của cơ sở đang chọn.
                      </p>
                      {/* {reportedMetrics?.note && (
                        <p className="typo-caption text-muted-foreground mt-1 max-w-3xl">
                          {reportedMetrics.note}
                        </p>
                      )} */}
                    </div>
                    <div className="w-full space-y-2 sm:w-44">
                      <Label>Kỳ dữ liệu</Label>
                      <Select value={dashboardPeriod} onValueChange={setDashboardPeriod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Theo tháng</SelectItem>
                          <SelectItem value="quarter">Theo quý</SelectItem>
                          <SelectItem value="year">Theo năm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {dashboardQuery.isError && (
                  <StatePanel
                    tone="danger"
                    title="Không thể tải dữ liệu tổng quan"
                    description="Dashboard của cơ sở đang chọn chưa sẵn sàng hoặc bạn không có quyền xem dữ liệu này."
                  />
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    icon={<Wallet className="size-5" />}
                    label="Doanh thu báo cáo"
                    value={
                      dashboardQuery.isLoading
                        ? 'Đang tải...'
                        : formatCompactCurrency(reportedRevenue)
                    }
                    helper={formatCurrency(reportedRevenue)}
                  />
                  <MetricCard
                    icon={<Users className="size-5" />}
                    tone="info"
                    label="Lượt khách"
                    value={
                      dashboardQuery.isLoading ? 'Đang tải...' : formatNumber(reportedVisitors)
                    }
                    helper={`${formatNumber(reportedBookings)} lượt đặt chỗ`}
                  />
                  <MetricCard
                    icon={<Activity className="size-5" />}
                    tone="success"
                    label="Sức chứa trung bình"
                    value={
                      dashboardQuery.isLoading
                        ? 'Đang tải...'
                        : formatPercent(reportedAvgCapacityPct)
                    }
                    helper={`${formatNumber(reportedReportCount)} báo cáo đã ghi nhận`}
                  />
                  <MetricCard
                    icon={<Star className="size-5" />}
                    tone="warning"
                    label="Đánh giá cơ sở"
                    value={
                      selectedBusiness?.rating_avg && selectedBusiness.rating_avg !== '0.00'
                        ? Number(selectedBusiness.rating_avg).toFixed(1)
                        : '-'
                    }
                    helper={`${formatNumber(selectedBusiness?.rating_count)} lượt đánh giá`}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <DetailGroupCard
                    title="Dịch vụ và tour"
                    description="Số lượng dịch vụ, điểm liên kết và giá trị tour đang niêm yết."
                    icon={<Building2 className="size-5" />}
                    items={summaryServiceItems}
                    tone="primary"
                  />
                  <DetailGroupCard
                    title="OCOP, voucher và đánh giá"
                    description="Hiệu quả thương mại và tương tác của khách hàng."
                    icon={<PackageCheck className="size-5" />}
                    items={summaryCommerceItems}
                    tone="success"
                  />
                  <DetailGroupCard
                    title="Sức chứa và số liệu báo cáo"
                    description="Dữ liệu vận hành hiện tại và số liệu doanh nghiệp tự báo cáo."
                    icon={<Activity className="size-5" />}
                    items={summaryOperationsItems}
                    tone="warning"
                  />
                  <DetailGroupCard
                    title="Hồ sơ doanh nghiệp"
                    description="Thông tin định danh, liên hệ và kỳ dữ liệu từ dashboard."
                    icon={<ClipboardList className="size-5" />}
                    items={businessProfileItems}
                    tone="violet"
                  />
                </div>

                <div
                  className={
                    hideCapacityAlerts ? 'grid gap-4' : 'grid gap-4 xl:grid-cols-[1.25fr_0.75fr]'
                  }
                >
                  <RevenueTrend items={revenueTrend} />
                  {!hideCapacityAlerts && <CapacityAlerts alerts={capacityAlerts} />}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="typo-section-title">Các cơ sở thuộc tài khoản</CardTitle>
                    <CardDescription>
                      Danh sách cơ sở dịch vụ thuộc tài khoản của bạn. Chọn một cơ sở ở phần đầu
                      trang để xem dashboard riêng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {businesses.map((business) => (
                        <button
                          key={business.id}
                          type="button"
                          onClick={() => {
                            setSelectedBusinessId(business.id)
                            setReportPage(1)
                            setFeedbackPage(1)
                          }}
                          className={`hover:bg-muted/40 rounded-lg border p-4 text-left transition ${
                            business.id === selectedBusinessId
                              ? 'border-primary bg-primary/5'
                              : 'border-border bg-card'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="typo-body-sm truncate font-semibold">
                                {business.business_name}
                              </p>
                              <p className="typo-caption text-muted-foreground">
                                {getBusinessTypeLabel(business.business_type)}
                              </p>
                            </div>
                            {getStatusBadge(business.status)}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <InfoTile
                              label="Đánh giá"
                              value={
                                business.rating_avg && business.rating_avg !== '0.00'
                                  ? Number(business.rating_avg).toFixed(1)
                                  : '-'
                              }
                            />
                            <InfoTile
                              label="Lượt đánh giá"
                              value={formatNumber(business.rating_count)}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <ToolTableCustom
                  searchValue={reportSearch}
                  setSearchValue={(value) => {
                    setReportSearch(value)
                    setReportPage(1)
                  }}
                  dataUpdatedAt={reportsQuery.dataUpdatedAt}
                  onRefresh={() => reportsQuery.refetch()}
                  isRefreshing={reportsQuery.isFetching && !reportsQuery.isLoading}
                  filter={
                    <>
                      <Select
                        value={reportStatus}
                        onValueChange={(value) => {
                          setReportStatus(value)
                          setReportPage(1)
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="draft">Bản nháp</SelectItem>
                          <SelectItem value="submitted">Đã nộp</SelectItem>
                          <SelectItem value="approved">Đã duyệt</SelectItem>
                          <SelectItem value="rejected">Từ chối</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={reportSort}
                        onValueChange={(value) => {
                          setReportSort(value)
                          setReportPage(1)
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mới nhất</SelectItem>
                          <SelectItem value="revenue_desc">Doanh thu cao</SelectItem>
                          <SelectItem value="visitors_desc">Lượt khách cao</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={`${reportLimit}`}
                        onValueChange={(value) => {
                          setReportLimit(Number(value))
                          setReportPage(1)
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LIMIT_OPTIONS.map((limit) => (
                            <SelectItem key={limit} value={`${limit}`}>
                              {limit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => {
                          reportForm.reset()
                          setCreateReportOpen(true)
                        }}
                      >
                        <Plus className="mr-2 size-4" />
                        Nộp báo cáo
                      </Button>
                    </>
                  }
                  total={filteredReports.length}
                  pagination={{
                    currentPage: reportPage,
                    totalPages: reportTotalPages,
                    onPageChange: setReportPage,
                  }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="typo-section-title">{selectedBusinessReportsLabel}</p>
                      <p className="typo-meta text-muted-foreground">
                        Chỉ hiển thị báo cáo thuộc cơ sở đang chọn; số liệu do doanh nghiệp nộp và
                        được cơ quan quản lý rà soát.
                      </p>
                    </div>
                  </div>

                  <Table className="relative">
                    <TableHeader className="sticky top-0 z-20">
                      <TableRow>
                        <TableHead>Kỳ báo cáo</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead className="text-right">Lượt khách</TableHead>
                        <TableHead className="text-right">Đặt chỗ</TableHead>
                        <TableHead className="text-right">Doanh thu</TableHead>
                        <TableHead>Sức chứa TB</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày nộp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-muted-foreground text-center">
                            Đang tải báo cáo...
                          </TableCell>
                        </TableRow>
                      ) : reportsQuery.isError ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-destructive text-center">
                            Không thể tải danh sách báo cáo.
                          </TableCell>
                        </TableRow>
                      ) : pagedReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-muted-foreground text-center">
                            Chưa có báo cáo phù hợp bộ lọc.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedReports.map((report) => {
                          const status = report.status ?? 'draft'

                          return (
                            <TableRow key={report.id}>
                              <TableCell className="typo-table-cell font-semibold">
                                {getReportPeriodLabel(report.report_period)}
                              </TableCell>
                              <TableCell className="typo-table-cell">
                                {formatDate(report.period_from)} - {formatDate(report.period_to)}
                              </TableCell>
                              <TableCell className="typo-table-cell text-right">
                                {formatNumber(report.total_visitors)}
                              </TableCell>
                              <TableCell className="typo-table-cell text-right">
                                {formatNumber(report.total_bookings)}
                              </TableCell>
                              <TableCell className="typo-table-cell text-right font-semibold">
                                {formatCurrency(report.total_revenue_vnd)}
                              </TableCell>
                              <TableCell className="typo-table-cell">
                                {formatPercent(report.avg_capacity_pct)}
                              </TableCell>
                              <TableCell>
                                <StatusDotBadge
                                  label={REPORT_STATUS_LABEL[status] ?? status}
                                  dotClass={REPORT_STATUS_DOT[status] ?? 'bg-muted-foreground'}
                                  badgeClass={
                                    REPORT_STATUS_BADGE[status] ??
                                    'bg-muted text-muted-foreground border-border'
                                  }
                                />
                              </TableCell>
                              <TableCell className="typo-table-cell">
                                {formatDate(report.created_at)}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </ToolTableCustom>
              </TabsContent>

              <TabsContent value="feedbacks" className="space-y-4">
                <ToolTableCustom
                  searchValue={feedbackSearch}
                  setSearchValue={(value) => {
                    setFeedbackSearch(value)
                    setFeedbackPage(1)
                  }}
                  dataUpdatedAt={feedbacksQuery.dataUpdatedAt}
                  onRefresh={() => feedbacksQuery.refetch()}
                  isRefreshing={feedbacksQuery.isFetching && !feedbacksQuery.isLoading}
                  filter={
                    <>
                      <Select
                        value={radiusKm}
                        onValueChange={(value) => {
                          setRadiusKm(value)
                          setFeedbackPage(1)
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Bán kính 5km</SelectItem>
                          <SelectItem value="10">Bán kính 10km</SelectItem>
                          <SelectItem value="20">Bán kính 20km</SelectItem>
                          <SelectItem value="50">Bán kính 50km</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={feedbackStatus}
                        onValueChange={(value) => {
                          setFeedbackStatus(value)
                          setFeedbackPage(1)
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="in_progress">Đang xử lý</SelectItem>
                          <SelectItem value="resolved">Đã xử lý</SelectItem>
                          <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={feedbackPriority}
                        onValueChange={(value) => {
                          setFeedbackPriority(value)
                          setFeedbackPage(1)
                        }}
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả mức độ</SelectItem>
                          <SelectItem value="normal">Bình thường</SelectItem>
                          <SelectItem value="high">Cao</SelectItem>
                          <SelectItem value="critical">Khẩn cấp</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={`${feedbackLimit}`}
                        onValueChange={(value) => {
                          setFeedbackLimit(Number(value))
                          setFeedbackPage(1)
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LIMIT_OPTIONS.map((limit) => (
                            <SelectItem key={limit} value={`${limit}`}>
                              {limit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  }
                  total={filteredFeedbacks.length}
                  pagination={{
                    currentPage: feedbackPage,
                    totalPages: feedbackTotalPages,
                    onPageChange: setFeedbackPage,
                  }}
                >
                  <div className="mb-4">
                    <p className="typo-section-title">Phản ánh lân cận {selectedBusinessName}</p>
                    <p className="typo-meta text-muted-foreground">
                      Đơn vị vận hành có thể theo dõi phản ánh gần cơ sở để chủ động cải thiện dịch
                      vụ; việc xử lý chính thức thuộc cơ quan quản lý.
                    </p>
                  </div>

                  <Table className="relative">
                    <TableHeader className="sticky top-0 z-20">
                      <TableRow>
                        <TableHead>Phản ánh</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Mức độ</TableHead>
                        <TableHead>Xác minh</TableHead>
                        <TableHead>Ngày gửi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacksQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-muted-foreground text-center">
                            Đang tải phản ánh...
                          </TableCell>
                        </TableRow>
                      ) : feedbacksQuery.isError ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-destructive text-center">
                            Không thể tải danh sách phản ánh lân cận.
                          </TableCell>
                        </TableRow>
                      ) : pagedFeedbacks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-muted-foreground text-center">
                            Không có phản ánh phù hợp bộ lọc.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedFeedbacks.map((feedback) => {
                          const status = feedback.status ?? 'pending'
                          const priority = feedback.priority ?? 'normal'

                          return (
                            <TableRow key={feedback.id}>
                              <TableCell className="max-w-80">
                                <p className="typo-table-cell line-clamp-1 font-semibold">
                                  {feedback.title ?? '-'}
                                </p>
                                <p className="typo-caption text-muted-foreground line-clamp-1">
                                  {feedback.content ?? feedback.description ?? '-'}
                                </p>
                              </TableCell>
                              <TableCell className="typo-table-cell max-w-64">
                                <span className="line-clamp-1">
                                  {feedback.location_text ?? '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <StatusDotBadge
                                  label={FEEDBACK_STATUS_LABEL[status] ?? status}
                                  dotClass={FEEDBACK_STATUS_DOT[status] ?? 'bg-muted-foreground'}
                                  badgeClass={
                                    FEEDBACK_STATUS_BADGE[status] ??
                                    'bg-muted text-muted-foreground border-border'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    PRIORITY_BADGE[priority] ??
                                    'bg-muted text-muted-foreground border-border'
                                  }
                                >
                                  {PRIORITY_LABEL[priority] ?? priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    feedback.is_location_verified
                                      ? 'bg-success/10 text-success border-success/20'
                                      : 'bg-muted text-muted-foreground border-border'
                                  }
                                >
                                  {feedback.is_location_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                                </Badge>
                              </TableCell>
                              <TableCell className="typo-table-cell">
                                {formatDate(feedback.created_at)}
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
          </>
        )}
      </div>

      <BusinessFormDialog
        open={createBusinessOpen}
        onOpenChange={setCreateBusinessOpen}
        businessId={null}
        onSubmit={(data) => createBusinessMutation.mutate(data as BusinessFormBody)}
        isLoading={createBusinessMutation.isPending}
      />

      <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Nộp báo cáo hoạt động</DialogTitle>
          <DialogDescription>
            Báo cáo được gửi cho cơ sở đang chọn: {selectedBusinessName}. Vui lòng nhập số liệu đã
            đối soát trước khi nộp.
          </DialogDescription>

          <form onSubmit={reportForm.handleSubmit(handleCreateReport)} className="mt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="report-period">Kỳ báo cáo</Label>
                <Select
                  value={reportForm.watch('report_period')}
                  onValueChange={(value) =>
                    reportForm.setValue('report_period', value as ReportFormValues['report_period'])
                  }
                >
                  <SelectTrigger id="report-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Tháng</SelectItem>
                    <SelectItem value="quarter">Quý</SelectItem>
                    <SelectItem value="year">Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period-from">Từ ngày</Label>
                <Input id="period-from" type="date" {...reportForm.register('period_from')} />
                {reportForm.formState.errors.period_from && (
                  <p className="typo-caption text-destructive">
                    {reportForm.formState.errors.period_from.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="period-to">Đến ngày</Label>
                <Input id="period-to" type="date" {...reportForm.register('period_to')} />
                {reportForm.formState.errors.period_to && (
                  <p className="typo-caption text-destructive">
                    {reportForm.formState.errors.period_to.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="total-revenue">Doanh thu</Label>
                <Input
                  id="total-revenue"
                  type="number"
                  min={0}
                  placeholder="Nhập doanh thu VND"
                  {...reportForm.register('total_revenue_vnd')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-visitors">Lượt khách</Label>
                <Input
                  id="total-visitors"
                  type="number"
                  min={0}
                  placeholder="Nhập số lượt khách"
                  {...reportForm.register('total_visitors')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-bookings">Lượt đặt chỗ</Label>
                <Input
                  id="total-bookings"
                  type="number"
                  min={0}
                  placeholder="Nhập số lượt đặt chỗ"
                  {...reportForm.register('total_bookings')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg-capacity">Sức chứa trung bình (%)</Label>
                <Input
                  id="avg-capacity"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  placeholder="0 - 100"
                  {...reportForm.register('avg_capacity_pct')}
                />
                {reportForm.formState.errors.avg_capacity_pct && (
                  <p className="typo-caption text-destructive">
                    {reportForm.formState.errors.avg_capacity_pct.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-notes">Ghi chú</Label>
              <Textarea
                id="report-notes"
                rows={4}
                placeholder="Ghi chú ngắn về tình hình vận hành, cao điểm, bất thường hoặc đề xuất hỗ trợ..."
                {...reportForm.register('notes')}
              />
              {reportForm.formState.errors.notes && (
                <p className="typo-caption text-destructive">
                  {reportForm.formState.errors.notes.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateReportOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createReportMutation.isPending || !selectedBusinessId}
              >
                {createReportMutation.isPending ? 'Đang nộp...' : 'Nộp báo cáo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
