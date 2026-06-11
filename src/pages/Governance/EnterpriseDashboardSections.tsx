import type { ReactNode } from 'react'
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  ListTree,
  Star,
  TrendingUp,
} from 'lucide-react'
import type { GovernanceEnterpriseDashboard } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime } from '@/lib/date'

type FieldType = 'number' | 'currency' | 'percent' | 'text' | 'date' | 'datetime' | 'boolean'

type FieldConfig = {
  key: string
  label: string
  type?: FieldType
  compact?: boolean
}

type DashboardTone = 'service' | 'commerce' | 'operations' | 'profile'

const TONE_CLASS: Record<
  DashboardTone,
  {
    soft: string
    text: string
    border: string
    accent: string
    ring: string
    chip: string
  }
> = {
  service: {
    soft: 'bg-[var(--dashboard-service-soft)]',
    text: 'text-[var(--dashboard-service)]',
    border: 'border-[var(--dashboard-service)]/30',
    accent: 'bg-[var(--dashboard-service)]',
    ring: 'ring-[var(--dashboard-service)]/15',
    chip: 'bg-[var(--dashboard-service)]/10 text-[var(--dashboard-service)]',
  },
  commerce: {
    soft: 'bg-[var(--dashboard-commerce-soft)]',
    text: 'text-[var(--dashboard-commerce)]',
    border: 'border-[var(--dashboard-commerce)]/30',
    accent: 'bg-[var(--dashboard-commerce)]',
    ring: 'ring-[var(--dashboard-commerce)]/15',
    chip: 'bg-[var(--dashboard-commerce)]/10 text-[var(--dashboard-commerce)]',
  },
  operations: {
    soft: 'bg-[var(--dashboard-operations-soft)]',
    text: 'text-[var(--dashboard-operations)]',
    border: 'border-[var(--dashboard-operations)]/30',
    accent: 'bg-[var(--dashboard-operations)]',
    ring: 'ring-[var(--dashboard-operations)]/15',
    chip: 'bg-[var(--dashboard-operations)]/10 text-[var(--dashboard-operations)]',
  },
  profile: {
    soft: 'bg-[var(--dashboard-profile-soft)]',
    text: 'text-[var(--dashboard-profile)]',
    border: 'border-[var(--dashboard-profile)]/30',
    accent: 'bg-[var(--dashboard-profile)]',
    ring: 'ring-[var(--dashboard-profile)]/15',
    chip: 'bg-[var(--dashboard-profile)]/10 text-[var(--dashboard-profile)]',
  },
}

const VARIANT_LABEL: Record<string, string> = {
  spot_operator: 'Đơn vị vận hành điểm',
  travel_company: 'Công ty lữ hành',
  service_provider: 'Nhà cung cấp dịch vụ',
}

const VARIANT_TONE: Record<string, DashboardTone> = {
  spot_operator: 'operations',
  travel_company: 'service',
  service_provider: 'commerce',
}

const PERIOD_LABEL: Record<string, string> = {
  week: 'Tuần',
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm',
}

const SUMMARY_FIELDS_BY_VARIANT: Record<string, FieldConfig[]> = {
  spot_operator: [
    { key: 'managed_spot_count', label: 'Điểm quản lý', type: 'number' },
    { key: 'current_visitors', label: 'Khách hiện tại', type: 'number' },
    { key: 'avg_capacity_pct', label: 'Sức chứa TB', type: 'percent' },
    { key: 'peak_capacity_pct', label: 'Sức chứa cao điểm', type: 'percent' },
    { key: 'capacity_alert_count', label: 'Cảnh báo sức chứa', type: 'number' },
    { key: 'spot_rating_avg', label: 'Điểm đánh giá điểm', type: 'number' },
    { key: 'spot_rating_count', label: 'Lượt đánh giá điểm', type: 'number' },
  ],
  travel_company: [
    { key: 'tour_count', label: 'Tổng tour', type: 'number' },
    { key: 'active_tour_count', label: 'Tour hoạt động', type: 'number' },
    { key: 'featured_tour_count', label: 'Tour nổi bật', type: 'number' },
    { key: 'avg_tour_price_vnd', label: 'Giá tour TB', type: 'currency' },
    { key: 'total_listed_capacity', label: 'Sức chứa tour', type: 'number' },
    { key: 'avg_tour_duration_days', label: 'Số ngày tour TB', type: 'number' },
    { key: 'tour_rating_avg', label: 'Điểm đánh giá tour', type: 'number' },
    { key: 'tour_rating_count', label: 'Lượt đánh giá tour', type: 'number' },
    { key: 'reported_bookings', label: 'Booking báo cáo', type: 'number' },
    { key: 'reported_revenue_vnd', label: 'Doanh thu báo cáo', type: 'currency' },
  ],
  service_provider: [
    { key: 'service_count', label: 'Tổng dịch vụ', type: 'number' },
    { key: 'active_service_count', label: 'Dịch vụ hoạt động', type: 'number' },
    { key: 'voucher_count', label: 'Tổng voucher', type: 'number' },
    { key: 'active_voucher_count', label: 'Voucher hoạt động', type: 'number' },
    { key: 'voucher_used_count', label: 'Voucher đã dùng', type: 'number' },
    { key: 'voucher_redemption_rate', label: 'Tỷ lệ đổi voucher', type: 'percent' },
    { key: 'ocop_count', label: 'Tổng OCOP', type: 'number' },
    { key: 'active_ocop_count', label: 'OCOP hoạt động', type: 'number' },
    { key: 'avg_ocop_stars', label: 'Sao OCOP TB', type: 'number' },
    { key: 'business_rating_avg', label: 'Điểm đánh giá cơ sở', type: 'number' },
    { key: 'business_rating_count', label: 'Lượt đánh giá cơ sở', type: 'number' },
    { key: 'reported_revenue_vnd', label: 'Doanh thu báo cáo', type: 'currency' },
  ],
}

const REPORTED_FIELDS: FieldConfig[] = [
  { key: 'total_revenue_vnd', label: 'Doanh thu báo cáo', type: 'currency' },
  { key: 'total_bookings', label: 'Tổng booking', type: 'number' },
  { key: 'total_visitors', label: 'Tổng lượt khách', type: 'number' },
  { key: 'avg_capacity_pct', label: 'Sức chứa TB', type: 'percent' },
  { key: 'report_count', label: 'Số báo cáo', type: 'number' },
]

const BUSINESS_FIELDS: FieldConfig[] = [
  { key: 'business_name', label: 'Tên doanh nghiệp', type: 'text' },
  { key: 'business_type', label: 'Loại hình', type: 'text' },
  { key: 'tax_id', label: 'Mã số thuế', type: 'text' },
  { key: 'license_number', label: 'Giấy phép', type: 'text' },
  { key: 'province_name', label: 'Tỉnh/thành', type: 'text' },
  { key: 'ward_name', label: 'Phường/xã', type: 'text' },
  { key: 'owner_name', label: 'Chủ sở hữu', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Điện thoại', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'address_vi', label: 'Địa chỉ', type: 'text' },
  { key: 'status', label: 'Trạng thái', type: 'text' },
  { key: 'rating_avg', label: 'Điểm đánh giá', type: 'number' },
  { key: 'rating_count', label: 'Lượt đánh giá', type: 'number' },
  { key: 'approved_at', label: 'Ngày duyệt', type: 'datetime' },
  { key: 'created_at', label: 'Ngày tạo', type: 'datetime' },
  { key: 'updated_at', label: 'Ngày cập nhật', type: 'datetime' },
]

const HIGHLIGHT_FIELDS_BY_VARIANT: Record<string, FieldConfig[]> = {
  spot_operator: [
    { key: 'name_vi', label: 'Điểm', type: 'text' },
    { key: 'visitor_count', label: 'Khách hiện tại', type: 'number' },
    { key: 'max_capacity', label: 'Sức chứa tối đa', type: 'number' },
    { key: 'capacity_pct', label: 'Tỷ lệ', type: 'percent' },
    { key: 'status', label: 'Trạng thái', type: 'text' },
    { key: 'recorded_at', label: 'Cập nhật', type: 'datetime' },
  ],
  travel_company: [
    { key: 'name_vi', label: 'Tour', type: 'text' },
    { key: 'rating_avg', label: 'Điểm', type: 'number' },
    { key: 'rating_count', label: 'Lượt đánh giá', type: 'number' },
    { key: 'price_from_vnd', label: 'Giá từ', type: 'currency' },
    { key: 'status', label: 'Trạng thái', type: 'text' },
    { key: 'is_featured', label: 'Nổi bật', type: 'boolean' },
  ],
  service_provider: [
    { key: 'name_vi', label: 'Tên', type: 'text' },
    { key: 'category', label: 'Danh mục', type: 'text' },
    { key: 'count', label: 'Số lượng', type: 'number' },
    { key: 'status', label: 'Trạng thái', type: 'text' },
  ],
}

const HIDDEN_FIELD_KEYS = new Set([
  'id',
  'business_id',
  'spot_id',
  'tour_id',
  'service_id',
  'owner_id',
  'province_code',
  'source',
  'note',
  'notes',
])

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function isBlank(value: unknown): boolean {
  return value == null || value === ''
}

function isHiddenKey(key: string): boolean {
  const normalized = key.toLowerCase()
  return HIDDEN_FIELD_KEYS.has(normalized) || normalized.endsWith('_id')
}

function isPrimitiveDisplayValue(value: unknown): boolean {
  return (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function toNumber(value: unknown): number | undefined {
  if (isBlank(value)) return undefined
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
  const abs = Math.abs(parsed)
  if (abs >= 1_000_000_000) return `${(parsed / 1_000_000_000).toFixed(1)} tỷ`
  if (abs >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)} tr`
  if (abs >= 1_000) return `${(parsed / 1_000).toFixed(0)}k`
  return parsed.toLocaleString('vi-VN')
}

function formatPercent(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : `${parsed.toFixed(1)}%`
}

function formatValue(value: unknown, type: FieldType = 'text', compact = false): string {
  if (isBlank(value)) return '-'
  if (type === 'currency') return compact ? formatCompactCurrency(value) : formatCurrency(value)
  if (type === 'percent') return formatPercent(value)
  if (type === 'number') return formatNumber(value)
  if (type === 'boolean') return value ? 'Có' : 'Không'
  if (type === 'date') return typeof value === 'string' ? formatDate(value) : '-'
  if (type === 'datetime') return typeof value === 'string' ? formatDateTime(value) : '-'
  return String(value)
}

function humanizeKey(key: string): string {
  return key
    .replace(/_vnd$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function inferFieldType(key: string, value: unknown): FieldType {
  const normalized = key.toLowerCase()
  if (
    normalized.includes('revenue') ||
    normalized.includes('price') ||
    normalized.includes('value')
  ) {
    return 'currency'
  }
  if (normalized.includes('pct') || normalized.includes('percent') || normalized.includes('rate')) {
    return 'percent'
  }
  if (normalized.endsWith('_at')) return 'datetime'
  if (normalized.includes('date')) return 'date'
  if (typeof value === 'boolean') return 'boolean'
  if (toNumber(value) != null && value !== '') return 'number'
  return 'text'
}

function getFieldValue(record: Record<string, unknown>, field: FieldConfig): unknown {
  return record[field.key]
}

function formatField(record: Record<string, unknown>, field: FieldConfig): string {
  return formatValue(getFieldValue(record, field), field.type, field.compact)
}

function buildVisibleFields(
  record: Record<string, unknown>,
  fields: FieldConfig[],
  includeDynamic = true
): FieldConfig[] {
  const knownKeys = new Set(fields.map((field) => field.key))
  const configuredFields = fields.filter(
    (field) => !isHiddenKey(field.key) && !isBlank(record[field.key])
  )

  if (!includeDynamic) return configuredFields

  const dynamicFields = Object.entries(record)
    .filter(([key, value]) => !knownKeys.has(key) && !isHiddenKey(key) && !isBlank(value))
    .filter(([, value]) => isPrimitiveDisplayValue(value))
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key),
      type: inferFieldType(key, value),
      compact: key.toLowerCase().includes('revenue') || key.toLowerCase().includes('price'),
    }))

  return [...configuredFields, ...dynamicFields]
}

function normalizeTrend(dashboard: GovernanceEnterpriseDashboard): Record<string, unknown>[] {
  const trend = dashboard.trend ?? dashboard.revenue_trend ?? []
  return trend.map((item) => asRecord(item))
}

function normalizeHighlights(dashboard: GovernanceEnterpriseDashboard): Record<string, unknown>[] {
  return (dashboard.highlights ?? dashboard.capacity_alerts ?? []).map((item) => asRecord(item))
}

function getVariant(dashboard: GovernanceEnterpriseDashboard): string {
  return String(dashboard.variant ?? 'service_provider')
}

function getTone(dashboard: GovernanceEnterpriseDashboard): DashboardTone {
  return VARIANT_TONE[getVariant(dashboard)] ?? 'service'
}

function getPeriodLabel(dashboard: GovernanceEnterpriseDashboard): string {
  const period = dashboard.period
  if (!period) return '-'
  if (typeof period === 'string') return PERIOD_LABEL[period] ?? period
  const typeLabel = period.type ? (PERIOD_LABEL[period.type] ?? period.type) : undefined
  const range =
    period.from || period.to
      ? `${period.from ? formatDate(period.from) : '-'} - ${period.to ? formatDate(period.to) : '-'}`
      : undefined
  return [typeLabel, period.year, range].filter(Boolean).join(' · ')
}

function getBusinessName(business: Record<string, unknown>): string {
  return String(business.business_name ?? business.name ?? 'Doanh nghiệp')
}

function getStatusLabel(business: Record<string, unknown>): string {
  return String(business.status ?? '-')
}

function getReportedValue(
  dashboard: GovernanceEnterpriseDashboard,
  key: keyof NonNullable<GovernanceEnterpriseDashboard['reported_metrics']>,
  summaryKey?: string
): unknown {
  const summary = asRecord(dashboard.summary)
  const reportedMetrics = asRecord(dashboard.reported_metrics)
  return reportedMetrics[key] ?? (summaryKey ? summary[summaryKey] : undefined) ?? summary[key]
}

function getPrimaryMetricFields(variant: string): FieldConfig[] {
  if (variant === 'spot_operator') {
    return [
      { key: 'managed_spot_count', label: 'Điểm quản lý', type: 'number' },
      { key: 'current_visitors', label: 'Khách hiện tại', type: 'number' },
      { key: 'avg_capacity_pct', label: 'Sức chứa TB', type: 'percent' },
      { key: 'capacity_alert_count', label: 'Cảnh báo', type: 'number' },
    ]
  }
  if (variant === 'travel_company') {
    return [
      { key: 'tour_count', label: 'Tổng tour', type: 'number' },
      { key: 'active_tour_count', label: 'Tour hoạt động', type: 'number' },
      { key: 'reported_bookings', label: 'Booking', type: 'number' },
      { key: 'reported_revenue_vnd', label: 'Doanh thu', type: 'currency', compact: true },
    ]
  }
  return [
    { key: 'service_count', label: 'Tổng dịch vụ', type: 'number' },
    { key: 'active_service_count', label: 'Dịch vụ hoạt động', type: 'number' },
    { key: 'voucher_redemption_rate', label: 'Đổi voucher', type: 'percent' },
    { key: 'reported_revenue_vnd', label: 'Doanh thu', type: 'currency', compact: true },
  ]
}

function DashboardHero({
  dashboard,
  business,
  summary,
}: {
  dashboard: GovernanceEnterpriseDashboard
  business: Record<string, unknown>
  summary: Record<string, unknown>
}) {
  const variant = getVariant(dashboard)
  const tone = getTone(dashboard)
  const toneClass = TONE_CLASS[tone]
  const businessName = getBusinessName(business)
  const primaryFields = getPrimaryMetricFields(variant)
  const heroRecord = {
    ...summary,
    reported_bookings: getReportedValue(dashboard, 'total_bookings', 'reported_bookings'),
    reported_revenue_vnd: getReportedValue(dashboard, 'total_revenue_vnd', 'reported_revenue_vnd'),
  }

  return (
    <Card className={`relative overflow-hidden border-0 shadow-md ${toneClass.soft}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${toneClass.accent}`} />
      <CardContent className="p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(540px,0.9fr)] xl:items-start">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${toneClass.accent} text-white`}>
                {VARIANT_LABEL[variant] ?? variant}
              </Badge>
              <Badge variant="outline" className="bg-white/70">
                {getStatusLabel(business)}
              </Badge>
              <Badge variant="outline" className="bg-white/70">
                {getPeriodLabel(dashboard)}
              </Badge>
            </div>
            <h2 className="typo-page-title truncate">{businessName}</h2>
            <p className="typo-meta text-muted-foreground line-clamp-2">
              {[business.business_type, business.ward_name, business.province_name]
                .filter(Boolean)
                .join(' · ') || 'Dashboard theo vai trò doanh nghiệp'}
            </p>
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {primaryFields.map((field) => (
              <div
                key={field.key}
                className={`min-h-24 rounded-lg border bg-white/85 p-3 shadow-xs ${toneClass.border}`}
              >
                <p className="typo-caption text-muted-foreground line-clamp-2">{field.label}</p>
                <p className={`typo-section-title mt-2 truncate ${toneClass.text}`}>
                  {formatField(heroRecord, field)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Section({
  title,
  icon,
  tone = 'service',
  children,
}: {
  title: string
  icon: ReactNode
  tone?: DashboardTone
  children: ReactNode
}) {
  const toneClass = TONE_CLASS[tone]

  return (
    <Card className={`border-border/80 relative overflow-hidden shadow-sm ${toneClass.soft}`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${toneClass.accent}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg bg-white/80 p-2 ring-1 ${toneClass.text} ${toneClass.ring}`}>
            {icon}
          </div>
          <CardTitle className="typo-section-title">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function FieldGrid({
  record,
  fields,
  tone = 'service',
  includeDynamic = true,
}: {
  record: Record<string, unknown>
  fields: FieldConfig[]
  tone?: DashboardTone
  includeDynamic?: boolean
}) {
  const toneClass = TONE_CLASS[tone]
  const visibleFields = buildVisibleFields(record, fields, includeDynamic)

  if (visibleFields.length === 0) {
    return <p className="text-muted-foreground text-sm">Chưa có dữ liệu.</p>
  }

  return (
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visibleFields.map((field) => (
        <div
          key={field.key}
          className={`rounded-md border bg-white/85 p-3 shadow-xs ${toneClass.border}`}
        >
          <p className="typo-caption text-muted-foreground line-clamp-2">{field.label}</p>
          <p className={`typo-body-sm mt-1 font-semibold break-words ${toneClass.text}`}>
            {formatField(record, field)}
          </p>
        </div>
      ))}
    </div>
  )
}

function RangeCard({
  title,
  value,
  tone = 'service',
  type = 'currency',
}: {
  title: string
  value: unknown
  tone?: DashboardTone
  type?: FieldType
}) {
  const range = asRecord(value)
  if (isBlank(range.min) && isBlank(range.max)) return null
  const toneClass = TONE_CLASS[tone]
  return (
    <div className={`rounded-md border bg-white/85 p-3 shadow-xs ${toneClass.border}`}>
      <p className="typo-caption text-muted-foreground">{title}</p>
      <p className={`typo-body-sm mt-1 font-semibold ${toneClass.text}`}>
        {formatValue(range.min, type, true)} - {formatValue(range.max, type, true)}
      </p>
    </div>
  )
}

function BreakdownList({ items, tone = 'commerce' }: { items: unknown; tone?: DashboardTone }) {
  if (!Array.isArray(items) || items.length === 0) return null
  const toneClass = TONE_CLASS[tone]
  return (
    <div className={`rounded-md border bg-white/85 p-3 shadow-xs ${toneClass.border}`}>
      <p className="typo-caption text-muted-foreground">Cơ cấu danh mục dịch vụ</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {items.map((item, index) => {
          const record = asRecord(item)
          return (
            <div
              key={`${record.category ?? index}`}
              className="bg-muted/30 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm"
            >
              <span className="text-muted-foreground truncate">
                {String(record.category ?? '-')}
              </span>
              <span className={`shrink-0 font-semibold ${toneClass.text}`}>
                {formatNumber(record.count)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExperienceFeatures({
  value,
  tone = 'operations',
}: {
  value: unknown
  tone?: DashboardTone
}) {
  const record = asRecord(value)
  if (Object.keys(record).length === 0) return null
  const toneClass = TONE_CLASS[tone]
  return (
    <div className={`rounded-md border bg-white/85 p-3 shadow-xs ${toneClass.border}`}>
      <p className="typo-caption text-muted-foreground">Công nghệ trải nghiệm</p>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        {([
          ['VR360', record.vr360],
          ['AR', record.ar],
          ['Audio', record.audio],
        ] satisfies Array<[string, unknown]>).map(([label, count]) => (
          <div key={String(label)} className="bg-muted/30 rounded-md px-2 py-1.5 text-center">
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className={`font-semibold ${toneClass.text}`}>{formatNumber(count)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function DenseRecordList({
  items,
  fields,
  tone,
}: {
  items: Record<string, unknown>[]
  fields: FieldConfig[]
  tone: DashboardTone
}) {
  const toneClass = TONE_CLASS[tone]

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[680px] space-y-2">
        {items.map((item, index) => {
          const visibleFields = buildVisibleFields(item, fields, true)
          const [primary, ...rest] = visibleFields
          const key = String(item.name_vi ?? item.period ?? item.recorded_at ?? index)

          return (
            <div
              key={key}
              className={`grid grid-cols-[minmax(180px,1.2fr)_repeat(5,minmax(100px,1fr))] items-stretch gap-2 rounded-md border bg-white/85 p-2 shadow-xs ${toneClass.border}`}
            >
              <div className={`rounded-md px-3 py-2 ${toneClass.chip}`}>
                <p className="typo-caption opacity-80">{primary?.label ?? 'Mục'}</p>
                <p className="typo-body-sm truncate font-semibold">
                  {primary ? formatField(item, primary) : '-'}
                </p>
              </div>
              {rest.slice(0, 5).map((field) => (
                <div key={field.key} className="bg-muted/30 rounded-md px-3 py-2">
                  <p className="typo-caption text-muted-foreground truncate">{field.label}</p>
                  <p className="typo-body-sm mt-0.5 truncate font-medium">
                    {formatField(item, field)}
                  </p>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TrendSection({ dashboard }: { dashboard: GovernanceEnterpriseDashboard }) {
  const variant = getVariant(dashboard)
  const tone = getTone(dashboard)
  const trend = normalizeTrend(dashboard)
  const isVisitTrend = variant === 'spot_operator'
  const fields: FieldConfig[] = isVisitTrend
    ? [
        { key: 'period', label: 'Kỳ', type: 'text' },
        { key: 'visits', label: 'Lượt khách', type: 'number' },
      ]
    : [
        { key: 'period', label: 'Kỳ', type: 'text' },
        { key: 'revenue_vnd', label: 'Doanh thu', type: 'currency', compact: true },
        { key: 'bookings', label: 'Booking', type: 'number' },
        { key: 'visitors', label: 'Lượt khách', type: 'number' },
      ]

  return (
    <Section
      title={isVisitTrend ? 'Xu hướng lượt khách' : 'Xu hướng booking và doanh thu'}
      icon={<TrendingUp className="size-5" />}
      tone={tone}
    >
      {trend.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có dữ liệu xu hướng.</p>
      ) : (
        <DenseRecordList items={trend} fields={fields} tone={tone} />
      )}
    </Section>
  )
}

function HighlightsSection({ dashboard }: { dashboard: GovernanceEnterpriseDashboard }) {
  const variant = getVariant(dashboard)
  const tone = variant === 'travel_company' ? 'service' : getTone(dashboard)
  const highlights = normalizeHighlights(dashboard)
  const fields =
    HIGHLIGHT_FIELDS_BY_VARIANT[variant] ?? HIGHLIGHT_FIELDS_BY_VARIANT.service_provider

  return (
    <Section
      title={
        variant === 'travel_company' ? 'Tour nổi bật theo đánh giá' : 'Điểm nổi bật cần theo dõi'
      }
      icon={<Star className="size-5" />}
      tone={tone}
    >
      {highlights.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có dữ liệu nổi bật.</p>
      ) : (
        <DenseRecordList items={highlights} fields={fields} tone={tone} />
      )}
    </Section>
  )
}

export function EnterpriseDashboardSections({
  dashboard,
  showBusiness = true,
}: {
  dashboard: GovernanceEnterpriseDashboard
  showBusiness?: boolean
}) {
  const variant = getVariant(dashboard)
  const tone = getTone(dashboard)
  const summary = asRecord(dashboard.summary)
  const reportedMetrics = asRecord(dashboard.reported_metrics)
  const business = asRecord(dashboard.business)
  const periodRecord =
    typeof dashboard.period === 'string' ? { type: dashboard.period } : asRecord(dashboard.period)
  const summaryFields = SUMMARY_FIELDS_BY_VARIANT[variant] ?? [
    { key: 'reported_revenue_vnd', label: 'Doanh thu báo cáo', type: 'currency' },
    { key: 'reported_bookings', label: 'Booking báo cáo', type: 'number' },
    { key: 'reported_visitors', label: 'Lượt khách báo cáo', type: 'number' },
  ]

  return (
    <div className="space-y-4">
      <DashboardHero dashboard={dashboard} business={business} summary={summary} />

      <div className="grid gap-4 2xl:grid-cols-[1fr_1.15fr]">
        {showBusiness && (
          <Section
            title="Thông tin doanh nghiệp"
            icon={<Building2 className="size-5" />}
            tone="profile"
          >
            <FieldGrid record={business} fields={BUSINESS_FIELDS} tone="profile" />
          </Section>
        )}

        <Section
          title="Số liệu doanh nghiệp tự báo cáo"
          icon={<FileText className="size-5" />}
          tone="operations"
        >
          <FieldGrid
            record={reportedMetrics}
            fields={REPORTED_FIELDS}
            tone="operations"
            includeDynamic={false}
          />
        </Section>
      </div>

      <Section
        title="Chỉ số nghiệp vụ theo role"
        icon={<BarChart3 className="size-5" />}
        tone={tone}
      >
        <div className="space-y-3">
          <FieldGrid record={summary} fields={summaryFields} tone={tone} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <RangeCard title="Khoảng giá vé" value={summary.ticket_price_range} tone={tone} />
            <RangeCard title="Khoảng giá dịch vụ" value={summary.service_price_range} tone={tone} />
            <ExperienceFeatures value={summary.experience_features} tone={tone} />
            <BreakdownList items={summary.service_category_breakdown} tone={tone} />
          </div>
        </div>
      </Section>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendSection dashboard={dashboard} />
        <HighlightsSection dashboard={dashboard} />
      </div>

      <Section title="Kỳ dữ liệu" icon={<CalendarDays className="size-5" />} tone="profile">
        <FieldGrid
          record={periodRecord}
          fields={[
            { key: 'type', label: 'Loại kỳ', type: 'text' },
            { key: 'year', label: 'Năm', type: 'number' },
            { key: 'from', label: 'Từ ngày', type: 'date' },
            { key: 'to', label: 'Đến ngày', type: 'date' },
          ]}
          tone="profile"
          includeDynamic={false}
        />
      </Section>

      {Array.isArray(summary.service_category_breakdown) &&
        summary.service_category_breakdown.length > 0 && (
          <Section title="Cơ cấu dịch vụ" icon={<ListTree className="size-5" />} tone="commerce">
            <DenseRecordList
              items={summary.service_category_breakdown.map((item) => asRecord(item))}
              fields={[
                { key: 'category', label: 'Danh mục', type: 'text' },
                { key: 'count', label: 'Số lượng', type: 'number' },
              ]}
              tone="commerce"
            />
          </Section>
        )}
    </div>
  )
}
