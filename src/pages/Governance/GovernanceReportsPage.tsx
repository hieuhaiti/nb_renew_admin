import type { FormEvent, JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  Plus,
  Send,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useApiMutation, useApiQuery, governanceService, businessService } from '@/service'
import type {
  ApiResponse,
  Business,
  GovernanceDeptReport,
  GovernanceDeptReportCreateBody,
  GovernanceDeptReportSendBody,
  GovernanceEnterpriseReport,
  GovernanceEnterpriseReportCreateBody,
} from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { SearchSelect } from '@/components/common/SearchSelect'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import PageLayout from '@/layout/pageLayout'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import { formatDate, formatDateTime } from '@/lib/date'
import { BUSINESS_REPRESENTATIVE_ROLE_IDS, ROLE_IDS } from '@/constant/roleConstant'
import { useAuthStore } from '@/stores/common/useAuthStore'

const LIMIT_OPTIONS = [10, 20, 50]

const REPORT_PERIOD_LABEL: Record<string, string> = {
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm',
  custom: 'Tùy chỉnh',
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  draft: 'Bản nháp',
  submitted: 'Đã nộp',
  reviewed: 'Đã rà soát',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

const REPORT_STATUS_DOT: Record<string, string> = {
  draft: 'bg-muted-foreground',
  submitted: 'bg-warning',
  reviewed: 'bg-info',
  approved: 'bg-success',
  rejected: 'bg-destructive',
}

const REPORT_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  submitted: 'bg-warning/10 text-warning border-warning/20',
  reviewed: 'bg-info/10 text-info border-info/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

const emptyDepartmentForm: GovernanceDeptReportCreateBody = {
  title: '',
  report_type: '',
  period_from: '',
  period_to: '',
  file_url: '',
  file_format: 'pdf',
  sent_to_roles: [],
}

const emptyEnterpriseForm: GovernanceEnterpriseReportCreateBody = {
  business_id: '',
  report_period: 'month',
  period_from: '',
  period_to: '',
  total_revenue_vnd: undefined,
  total_bookings: undefined,
  total_visitors: undefined,
  avg_capacity_pct: undefined,
  notes: '',
  status: 'submitted',
}

const emptySendForm: GovernanceDeptReportSendBody = {
  target_roles: [ROLE_IDS.MINISTRY],
  title_vi: '',
  body_vi: '',
}

function normalizeList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (!data || typeof data !== 'object') return []

  const record = data as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }

  for (const topKey of ['metadata', 'data', 'items']) {
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

function formatPercent(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : `${parsed.toFixed(1)}%`
}

function getBusinessName(business?: Business | null): string {
  return business?.business_name ?? business?.business_code ?? business?.id ?? '-'
}

function getTotalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}

function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

function matchesKeyword(keyword: string, ...values: unknown[]): boolean {
  if (!keyword) return true
  const source = values
    .filter((value) => value != null)
    .join(' ')
    .toLowerCase()

  return source.includes(keyword.toLowerCase())
}

function includesRoleId(roleIds: readonly number[], roleId: number | undefined): boolean {
  return !!roleId && roleIds.includes(roleId)
}

function getReportStatusBadge(status?: string): JSX.Element {
  const value = status ?? 'submitted'

  return (
    <StatusDotBadge
      label={REPORT_STATUS_LABEL[value] ?? value}
      dotClass={REPORT_STATUS_DOT[value] ?? 'bg-muted-foreground'}
      badgeClass={REPORT_STATUS_BADGE[value] ?? 'bg-muted text-muted-foreground border-border'}
    />
  )
}

function getCapacityBarClass(value: unknown): string {
  const pct = toNumber(value) ?? 0
  if (pct >= 90) return 'bg-destructive'
  if (pct >= 75) return 'bg-warning'
  if (pct >= 55) return 'bg-info'
  return 'bg-success'
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  tone = 'primary',
}: {
  icon: JSX.Element
  label: string
  value: string
  helper: string
  tone?: 'primary' | 'success' | 'warning' | 'info'
}) {
  const toneClass = {
    primary: {
      line: 'bg-primary',
      icon: 'bg-primary/10 text-primary ring-primary/15',
    },
    success: {
      line: 'bg-success',
      icon: 'bg-success/10 text-success ring-success/15',
    },
    warning: {
      line: 'bg-warning',
      icon: 'bg-warning/10 text-warning ring-warning/15',
    },
    info: {
      line: 'bg-info',
      icon: 'bg-info/10 text-info ring-info/15',
    },
  }[tone]

  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex items-start gap-4 p-5">
        <div className={`${toneClass.line} absolute inset-x-0 top-0 h-1`} />
        <div className={`${toneClass.icon} rounded-xl p-3 ring-1`}>{icon}</div>
        <div className="min-w-0">
          <p className="typo-meta text-muted-foreground">{label}</p>
          <p className="typo-section-title mt-1 truncate">{value}</p>
          <p className="typo-caption text-muted-foreground mt-1">{helper}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricPill({ icon, label, value }: { icon: JSX.Element; label: string; value: string }) {
  return (
    <div className="border-border bg-card/80 flex items-center gap-3 rounded-lg border px-3 py-2">
      <div className="bg-muted text-muted-foreground rounded-md p-2">{icon}</div>
      <div className="min-w-0">
        <p className="typo-caption text-muted-foreground">{label}</p>
        <p className="typo-body-sm truncate font-semibold">{value}</p>
      </div>
    </div>
  )
}

export default function GovernanceReportsPage(): JSX.Element {
  const user = useAuthStore((s) => s.user)
  const roleId = user?.role_id
  const roleCode = user?.role_code ?? user?.role?.code
  const isSystemAdmin = roleCode === 'system_admin' || roleId === ROLE_IDS.SYSTEM_ADMIN
  const isDepartmentManager = roleCode === 'department_manager' || roleId === ROLE_IDS.DEPARTMENT
  const isEnterpriseRepresentative =
    roleCode === 'spot_operator' ||
    roleCode === 'travel_company' ||
    roleCode === 'service_provider' ||
    includesRoleId(BUSINESS_REPRESENTATIVE_ROLE_IDS, roleId)
  const canViewDepartmentReports =
    isSystemAdmin || roleId === ROLE_IDS.MINISTRY || isDepartmentManager
  const canCreateDepartmentReports = isSystemAdmin || isDepartmentManager
  const canViewEnterpriseReports =
    isSystemAdmin || isDepartmentManager || isEnterpriseRepresentative
  const canCreateEnterpriseReports = isSystemAdmin || isEnterpriseRepresentative

  const defaultTab = canViewDepartmentReports ? 'department' : 'enterprise'
  const [activeTab, setActiveTab] = useState(defaultTab)

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const [departmentSearch, setDepartmentSearch] = useState('')
  const [departmentType, setDepartmentType] = useState('all')
  const [departmentPage, setDepartmentPage] = useState(1)
  const [departmentLimit, setDepartmentLimit] = useState(10)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [departmentForm, setDepartmentForm] =
    useState<GovernanceDeptReportCreateBody>(emptyDepartmentForm)

  const [enterpriseSearch, setEnterpriseSearch] = useState('')
  const [enterpriseBusinessFilter, setEnterpriseBusinessFilter] = useState('all')
  const [enterpriseStatus, setEnterpriseStatus] = useState('all')
  const [enterprisePeriod, setEnterprisePeriod] = useState('all')
  const [enterprisePage, setEnterprisePage] = useState(1)
  const [enterpriseLimit, setEnterpriseLimit] = useState(10)
  const [enterpriseDialogOpen, setEnterpriseDialogOpen] = useState(false)
  const [enterpriseForm, setEnterpriseForm] =
    useState<GovernanceEnterpriseReportCreateBody>(emptyEnterpriseForm)

  const [reportToSend, setReportToSend] = useState<GovernanceDeptReport | null>(null)
  const [sendForm, setSendForm] = useState<GovernanceDeptReportSendBody>(emptySendForm)

  const departmentReportsQuery = useApiQuery<ApiResponse<unknown>>(
    ['governance-reports-department'],
    () => governanceService.getDepartmentReports({ limit: 100 }),
    { staleTime: STALE_DEFAULT, enabled: canViewDepartmentReports },
    false,
    false
  )

  const enterpriseReportsQuery = useApiQuery<ApiResponse<unknown>>(
    ['governance-reports-enterprise'],
    () => governanceService.getEnterpriseReports({ limit: 100 }),
    { staleTime: STALE_DEFAULT, enabled: canViewEnterpriseReports },
    false,
    false
  )

  const myBusinessesQuery = useApiQuery<ApiResponse<unknown>>(
    ['governance-reports-businesses-me'],
    () => businessService.getMe({ status: 'approved' }),
    { staleTime: STALE_DEFAULT, enabled: canCreateEnterpriseReports && enterpriseDialogOpen },
    false,
    false
  )

  const createDepartmentMutation = useApiMutation(
    (data: GovernanceDeptReportCreateBody) => governanceService.createDepartmentReport(data),
    {
      onSuccess: () => {
        setDepartmentDialogOpen(false)
        setDepartmentForm(emptyDepartmentForm)
        departmentReportsQuery.refetch()
      },
    }
  )

  const createEnterpriseMutation = useApiMutation(
    (data: GovernanceEnterpriseReportCreateBody) => governanceService.createEnterpriseReport(data),
    {
      onSuccess: () => {
        setEnterpriseDialogOpen(false)
        setEnterpriseForm(emptyEnterpriseForm)
        enterpriseReportsQuery.refetch()
      },
    }
  )

  const sendDepartmentMutation = useApiMutation(
    (payload: { reportId: string; data: GovernanceDeptReportSendBody }) =>
      governanceService.sendDepartmentReport(payload.reportId, payload.data),
    {
      onSuccess: () => {
        setReportToSend(null)
        setSendForm(emptySendForm)
        departmentReportsQuery.refetch()
      },
    }
  )

  const departmentReports = normalizeList<GovernanceDeptReport>(departmentReportsQuery.data?.data, [
    'reports',
    'items',
    'data',
  ])

  const enterpriseReports = normalizeList<GovernanceEnterpriseReport>(
    enterpriseReportsQuery.data?.data,
    ['reports', 'items', 'data']
  )
  const myBusinesses = normalizeList<Business>(myBusinessesQuery.data?.data, [
    'businesses',
    'items',
    'data',
  ])

  const enterpriseBusinessOptions = useMemo(() => {
    const options = new Map<string, string>()
    for (const report of enterpriseReports) {
      if (report.business_id) {
        options.set(report.business_id, report.business_name ?? report.business_id)
      }
    }

    return [
      { value: 'all', label: 'Tất cả doanh nghiệp' },
      ...Array.from(options.entries()).map(([value, label]) => ({ value, label })),
    ]
  }, [enterpriseReports])

  const myBusinessOptions = useMemo(
    () =>
      myBusinesses.map((business) => ({
        value: business.id,
        label: getBusinessName(business),
      })),
    [myBusinesses]
  )
  const createBusinessOptions = useMemo(
    () =>
      myBusinessOptions.length > 0
        ? myBusinessOptions
        : enterpriseBusinessOptions.filter((option) => option.value !== 'all'),
    [enterpriseBusinessOptions, myBusinessOptions]
  )

  const filteredDepartmentReports = useMemo(
    () =>
      departmentReports.filter((report) => {
        const matchedType = departmentType === 'all' || report.report_type === departmentType

        return (
          matchedType &&
          matchesKeyword(
            departmentSearch,
            report.title,
            report.report_type,
            report.file_format,
            report.period_from,
            report.period_to
          )
        )
      }),
    [departmentReports, departmentSearch, departmentType]
  )

  const filteredEnterpriseReports = useMemo(
    () =>
      enterpriseReports.filter((report) => {
        const matchedStatus = enterpriseStatus === 'all' || report.status === enterpriseStatus
        const matchedPeriod =
          enterprisePeriod === 'all' || report.report_period === enterprisePeriod
        const matchedBusiness =
          enterpriseBusinessFilter === 'all' || report.business_id === enterpriseBusinessFilter

        return (
          matchedStatus &&
          matchedPeriod &&
          matchedBusiness &&
          matchesKeyword(
            enterpriseSearch,
            report.business_name,
            report.business_id,
            report.report_period,
            report.status,
            report.notes
          )
        )
      }),
    [
      enterpriseBusinessFilter,
      enterprisePeriod,
      enterpriseReports,
      enterpriseSearch,
      enterpriseStatus,
    ]
  )

  const departmentTotalPages = getTotalPages(filteredDepartmentReports.length, departmentLimit)
  const enterpriseTotalPages = getTotalPages(filteredEnterpriseReports.length, enterpriseLimit)
  const pagedDepartmentReports = paginate(
    filteredDepartmentReports,
    departmentPage,
    departmentLimit
  )
  const pagedEnterpriseReports = paginate(
    filteredEnterpriseReports,
    enterprisePage,
    enterpriseLimit
  )
  const departmentReportTypes = [
    ...new Set(
      departmentReports
        .map((report) => report.report_type)
        .filter((type): type is string => Boolean(type))
    ),
  ]
  const approvedEnterpriseReports = enterpriseReports.filter(
    (report) => report.status === 'approved'
  ).length
  const avgEnterpriseCapacity =
    enterpriseReports.length > 0
      ? enterpriseReports.reduce(
          (sum, report) => sum + (toNumber(report.avg_capacity_pct) ?? 0),
          0
        ) / enterpriseReports.length
      : undefined
  const latestEnterpriseReport = [...enterpriseReports].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
  )[0]
  const latestDepartmentReport = [...departmentReports].sort(
    (a, b) =>
      new Date(b.created_at ?? b.generated_at ?? 0).getTime() -
      new Date(a.created_at ?? a.generated_at ?? 0).getTime()
  )[0]
  const reportMetrics = isEnterpriseRepresentative
    ? [
        {
          icon: <CalendarDays className="size-4" />,
          label: 'Báo cáo DN mới nhất',
          value: formatDateTime(latestEnterpriseReport?.created_at),
        },
        {
          icon: <TrendingUp className="size-4" />,
          label: 'Báo cáo đã nộp',
          value: `${formatNumber(enterpriseReports.length)} báo cáo`,
        },
        {
          icon: <Activity className="size-4" />,
          label: 'Sức chứa TB',
          value: formatPercent(avgEnterpriseCapacity),
        },
      ]
    : [
        {
          icon: <CalendarDays className="size-4" />,
          label: 'Báo cáo Sở mới nhất',
          value: formatDateTime(
            latestDepartmentReport?.created_at ?? latestDepartmentReport?.generated_at
          ),
        },
        {
          icon: <TrendingUp className="size-4" />,
          label: isSystemAdmin ? 'Tổng báo cáo DN' : 'DN đã duyệt',
          value: `${formatNumber(
            isSystemAdmin ? enterpriseReports.length : approvedEnterpriseReports
          )} báo cáo`,
        },
        {
          icon: <Activity className="size-4" />,
          label: 'Sức chứa TB',
          value: formatPercent(avgEnterpriseCapacity),
        },
      ]

  useEffect(() => {
    if (departmentPage > departmentTotalPages) setDepartmentPage(departmentTotalPages)
  }, [departmentPage, departmentTotalPages])

  useEffect(() => {
    if (enterprisePage > enterpriseTotalPages) setEnterprisePage(enterpriseTotalPages)
  }, [enterprisePage, enterpriseTotalPages])

  useEffect(() => {
    if (!enterpriseDialogOpen || myBusinesses.length === 0) return
    if (
      !enterpriseForm.business_id ||
      !myBusinesses.some((business) => business.id === enterpriseForm.business_id)
    ) {
      updateEnterpriseForm('business_id', myBusinesses[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterpriseDialogOpen, myBusinesses, enterpriseForm.business_id])

  useEffect(() => {
    if (!enterpriseDialogOpen || enterpriseForm.business_id || createBusinessOptions.length === 0) {
      return
    }
    updateEnterpriseForm('business_id', createBusinessOptions[0].value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enterpriseDialogOpen, enterpriseForm.business_id, createBusinessOptions])

  function updateDepartmentForm<K extends keyof GovernanceDeptReportCreateBody>(
    key: K,
    value: GovernanceDeptReportCreateBody[K]
  ) {
    setDepartmentForm((current) => ({ ...current, [key]: value }))
  }

  function updateEnterpriseForm<K extends keyof GovernanceEnterpriseReportCreateBody>(
    key: K,
    value: GovernanceEnterpriseReportCreateBody[K]
  ) {
    setEnterpriseForm((current) => ({ ...current, [key]: value }))
  }

  function handleCreateDepartmentReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createDepartmentMutation.mutate({
      title: departmentForm.title.trim(),
      report_type: departmentForm.report_type.trim(),
      period_from: departmentForm.period_from,
      period_to: departmentForm.period_to,
      ...(departmentForm.file_url?.trim() && { file_url: departmentForm.file_url.trim() }),
      ...(departmentForm.file_format?.trim() && { file_format: departmentForm.file_format }),
      ...(departmentForm.file_size_kb && { file_size_kb: Number(departmentForm.file_size_kb) }),
      ...(departmentForm.sent_to_roles?.length && { sent_to_roles: departmentForm.sent_to_roles }),
    })
  }

  function handleCreateEnterpriseReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createEnterpriseMutation.mutate({
      business_id: enterpriseForm.business_id.trim(),
      report_period: enterpriseForm.report_period,
      period_from: enterpriseForm.period_from,
      period_to: enterpriseForm.period_to,
      ...(toNumber(enterpriseForm.total_revenue_vnd) != null && {
        total_revenue_vnd: toNumber(enterpriseForm.total_revenue_vnd),
      }),
      ...(toNumber(enterpriseForm.total_bookings) != null && {
        total_bookings: toNumber(enterpriseForm.total_bookings),
      }),
      ...(toNumber(enterpriseForm.total_visitors) != null && {
        total_visitors: toNumber(enterpriseForm.total_visitors),
      }),
      ...(toNumber(enterpriseForm.avg_capacity_pct) != null && {
        avg_capacity_pct: toNumber(enterpriseForm.avg_capacity_pct),
      }),
      ...(enterpriseForm.notes?.trim() && { notes: enterpriseForm.notes.trim() }),
      status: enterpriseForm.status || 'submitted',
    })
  }

  function handleSendDepartmentReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reportToSend) return

    sendDepartmentMutation.mutate({
      reportId: reportToSend.id,
      data: {
        target_roles: sendForm.target_roles,
        ...(sendForm.title_vi?.trim() && { title_vi: sendForm.title_vi.trim() }),
        ...(sendForm.body_vi?.trim() && { body_vi: sendForm.body_vi.trim() }),
      },
    })
  }

  return (
    <PageLayout
      title="Báo cáo quản trị"
      description="Quản lý báo cáo cấp Sở và báo cáo hoạt động doanh nghiệp"
    >
      <div className="space-y-5">
        <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Governance Reports
                </Badge>
                {canViewDepartmentReports && (
                  <Badge className="bg-info/10 text-info border-info/20">Cấp Sở</Badge>
                )}
                {canViewEnterpriseReports && (
                  <Badge className="bg-success/10 text-success border-success/20">
                    Doanh nghiệp
                  </Badge>
                )}
              </div>
              <h2 className="typo-section-title mt-2">Bảng điều phối báo cáo</h2>
              <p className="typo-meta text-muted-foreground mt-1 max-w-3xl">
                Theo dõi báo cáo cấp Sở và báo cáo hoạt động doanh nghiệp, ưu tiên các chỉ số cần xử
                lý trước.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[560px]">
              {reportMetrics.map((metric) => (
                <MetricPill
                  key={metric.label}
                  icon={metric.icon}
                  label={metric.label}
                  value={metric.value}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          className={
            !isEnterpriseRepresentative
              ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'
              : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
          }
        >
          {!isEnterpriseRepresentative && (
            <SummaryCard
              icon={<FileText className="size-5" />}
              label="Báo cáo Sở"
              value={formatNumber(departmentReports.length)}
              helper="Hồ sơ tổng hợp gửi cấp Bộ"
              tone="primary"
            />
          )}
          <SummaryCard
            icon={<Building2 className="size-5" />}
            label="Báo cáo doanh nghiệp"
            value={formatNumber(enterpriseReports.length)}
            helper="Số liệu doanh thu, khách và tải"
            tone="success"
          />
          <SummaryCard
            icon={<Wallet className="size-5" />}
            label="Doanh thu báo cáo"
            value={formatCurrency(
              enterpriseReports.reduce(
                (sum, report) => sum + (toNumber(report.total_revenue_vnd) ?? 0),
                0
              )
            )}
            helper="Tổng doanh thu trong danh sách tải về"
            tone="warning"
          />
          <SummaryCard
            icon={<BarChart3 className="size-5" />}
            label="Báo cáo mới nhất"
            value={formatDate(latestEnterpriseReport?.created_at)}
            helper={latestEnterpriseReport?.business_name ?? 'Chưa có dữ liệu doanh nghiệp'}
            tone="info"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
          <TabsList className="w-fit">
            {canViewDepartmentReports && <TabsTrigger value="department">Báo cáo Sở</TabsTrigger>}
            {canViewEnterpriseReports && (
              <TabsTrigger value="enterprise">Báo cáo doanh nghiệp</TabsTrigger>
            )}
          </TabsList>

          {canViewDepartmentReports && (
            <TabsContent value="department" className="space-y-4">
              <ToolTableCustom
                searchValue={departmentSearch}
                setSearchValue={(value) => {
                  setDepartmentSearch(value)
                  setDepartmentPage(1)
                }}
                dataUpdatedAt={departmentReportsQuery.dataUpdatedAt}
                onRefresh={() => departmentReportsQuery.refetch()}
                isRefreshing={
                  departmentReportsQuery.isFetching && !departmentReportsQuery.isLoading
                }
                total={filteredDepartmentReports.length}
                pagination={{
                  currentPage: departmentPage,
                  totalPages: departmentTotalPages,
                  onPageChange: setDepartmentPage,
                }}
                filter={
                  <>
                    <Select
                      value={departmentType}
                      onValueChange={(value) => {
                        setDepartmentType(value)
                        setDepartmentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả loại báo cáo</SelectItem>
                        {departmentReportTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={`${departmentLimit}`}
                      onValueChange={(value) => {
                        setDepartmentLimit(Number(value))
                        setDepartmentPage(1)
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

                    {canCreateDepartmentReports && (
                      <Button onClick={() => setDepartmentDialogOpen(true)}>
                        <Plus className="size-4" />
                        Tạo báo cáo
                      </Button>
                    )}
                  </>
                }
              >
                <div className="mb-4">
                  <p className="typo-section-title">Danh sách báo cáo cấp Sở</p>
                  <p className="typo-meta text-muted-foreground">
                    Tổng hợp các báo cáo cấp Sở đã tạo và trạng thái gửi lên cấp Bộ.
                  </p>
                </div>

                <Table className="relative">
                  <TableHeader className="sticky top-0 z-20">
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Kỳ báo cáo</TableHead>
                      <TableHead>Tệp</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-28 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentReportsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground text-center">
                          Đang tải báo cáo...
                        </TableCell>
                      </TableRow>
                    ) : departmentReportsQuery.isError ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-destructive text-center">
                          Không thể tải danh sách báo cáo cấp Sở.
                        </TableCell>
                      </TableRow>
                    ) : pagedDepartmentReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground text-center">
                          Chưa có báo cáo phù hợp bộ lọc.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedDepartmentReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="max-w-96">
                            <p className="typo-table-cell line-clamp-1 font-semibold">
                              {report.title}
                            </p>
                            {report.sent_to_roles?.length ? (
                              <p className="typo-caption text-muted-foreground">
                                Đã gửi tới {report.sent_to_roles.length} vai trò
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {report.report_type ?? '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {formatDate(report.period_from)} - {formatDate(report.period_to)}
                          </TableCell>
                          <TableCell>
                            {report.file_url ? (
                              <Button asChild variant="outline" size="sm">
                                <a href={report.file_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="size-4" />
                                  {report.file_format ?? 'Tệp'}
                                </a>
                              </Button>
                            ) : (
                              <Badge className="bg-muted text-muted-foreground border-border">
                                Chưa có tệp
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {formatDateTime(report.created_at ?? report.generated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            {canCreateDepartmentReports && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setReportToSend(report)
                                  setSendForm({
                                    ...emptySendForm,
                                    title_vi: report.title,
                                  })
                                }}
                              >
                                <Send className="size-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ToolTableCustom>
            </TabsContent>
          )}

          {canViewEnterpriseReports && (
            <TabsContent value="enterprise" className="space-y-4">
              <ToolTableCustom
                searchValue={enterpriseSearch}
                setSearchValue={(value) => {
                  setEnterpriseSearch(value)
                  setEnterprisePage(1)
                }}
                dataUpdatedAt={enterpriseReportsQuery.dataUpdatedAt}
                onRefresh={() => enterpriseReportsQuery.refetch()}
                isRefreshing={
                  enterpriseReportsQuery.isFetching && !enterpriseReportsQuery.isLoading
                }
                total={filteredEnterpriseReports.length}
                pagination={{
                  currentPage: enterprisePage,
                  totalPages: enterpriseTotalPages,
                  onPageChange: setEnterprisePage,
                }}
                filter={
                  <>
                    <SearchSelect
                      options={enterpriseBusinessOptions}
                      value={enterpriseBusinessFilter}
                      onValueChange={(value) => {
                        setEnterpriseBusinessFilter(value)
                        setEnterprisePage(1)
                      }}
                      placeholder="Chọn doanh nghiệp"
                      searchPlaceholder="Tìm doanh nghiệp..."
                      className="w-full sm:w-64"
                      disabled={enterpriseReportsQuery.isLoading}
                    />

                    <Select
                      value={enterprisePeriod}
                      onValueChange={(value) => {
                        setEnterprisePeriod(value)
                        setEnterprisePage(1)
                      }}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả kỳ</SelectItem>
                        <SelectItem value="month">Tháng</SelectItem>
                        <SelectItem value="quarter">Quý</SelectItem>
                        <SelectItem value="year">Năm</SelectItem>
                        <SelectItem value="custom">Tùy chỉnh</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={enterpriseStatus}
                      onValueChange={(value) => {
                        setEnterpriseStatus(value)
                        setEnterprisePage(1)
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="submitted">Đã nộp</SelectItem>
                        <SelectItem value="reviewed">Đã rà soát</SelectItem>
                        <SelectItem value="approved">Đã duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={`${enterpriseLimit}`}
                      onValueChange={(value) => {
                        setEnterpriseLimit(Number(value))
                        setEnterprisePage(1)
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

                    {canCreateEnterpriseReports && (
                      <Button onClick={() => setEnterpriseDialogOpen(true)}>
                        <Plus className="size-4" />
                        Nộp báo cáo
                      </Button>
                    )}
                  </>
                }
              >
                <div className="mb-4">
                  <p className="typo-section-title">Báo cáo hoạt động doanh nghiệp</p>
                  <p className="typo-meta text-muted-foreground">
                    Lọc nhanh theo doanh nghiệp, kỳ và trạng thái báo cáo.
                  </p>
                </div>

                <Table className="relative">
                  <TableHeader className="sticky top-0 z-20">
                    <TableRow>
                      <TableHead>Doanh nghiệp</TableHead>
                      <TableHead>Kỳ</TableHead>
                      <TableHead>Khoảng thời gian</TableHead>
                      <TableHead className="text-right">Khách</TableHead>
                      <TableHead className="text-right">Đặt chỗ</TableHead>
                      <TableHead className="text-right">Doanh thu</TableHead>
                      <TableHead>Sức chứa</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày nộp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enterpriseReportsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-muted-foreground text-center">
                          Đang tải báo cáo...
                        </TableCell>
                      </TableRow>
                    ) : enterpriseReportsQuery.isError ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-destructive text-center">
                          Không thể tải danh sách báo cáo doanh nghiệp.
                        </TableCell>
                      </TableRow>
                    ) : pagedEnterpriseReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-muted-foreground text-center">
                          Chưa có báo cáo phù hợp bộ lọc.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedEnterpriseReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="max-w-72">
                            <p className="typo-table-cell line-clamp-1 font-semibold">
                              {report.business_name ?? report.business_id ?? '-'}
                            </p>
                            {report.business_id && (
                              <p className="typo-caption text-muted-foreground line-clamp-1">
                                ID: {report.business_id}
                              </p>
                            )}
                            {report.notes && (
                              <p className="typo-caption text-muted-foreground line-clamp-1">
                                {report.notes}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {REPORT_PERIOD_LABEL[report.report_period ?? ''] ??
                              report.report_period ??
                              '-'}
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
                            <div className="min-w-28 space-y-1">
                              <div className="flex justify-between gap-2">
                                <span className="font-medium">
                                  {formatPercent(report.avg_capacity_pct)}
                                </span>
                              </div>
                              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                <div
                                  className={`h-full rounded-full ${getCapacityBarClass(
                                    report.avg_capacity_pct
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      Math.max(toNumber(report.avg_capacity_pct) ?? 0, 0),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                          <TableCell className="typo-table-cell">
                            {formatDateTime(report.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ToolTableCustom>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={departmentDialogOpen} onOpenChange={setDepartmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Tạo báo cáo cấp Sở</DialogTitle>
          <DialogDescription>
            Nhập thông tin báo cáo tổng hợp và tệp đã ký duyệt nếu có.
          </DialogDescription>

          <form onSubmit={handleCreateDepartmentReport} className="mt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="department-title">Tiêu đề</Label>
                <Input
                  id="department-title"
                  value={departmentForm.title}
                  onChange={(event) => updateDepartmentForm('title', event.target.value)}
                  required
                  minLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-type">Loại báo cáo</Label>
                <Input
                  id="department-type"
                  value={departmentForm.report_type}
                  onChange={(event) => updateDepartmentForm('report_type', event.target.value)}
                  placeholder="Monthly_Tourism_Summary"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-format">Định dạng tệp</Label>
                <Select
                  value={departmentForm.file_format || 'pdf'}
                  onValueChange={(value) => updateDepartmentForm('file_format', value)}
                >
                  <SelectTrigger id="department-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-from">Từ ngày</Label>
                <Input
                  id="department-from"
                  type="date"
                  value={departmentForm.period_from}
                  onChange={(event) => updateDepartmentForm('period_from', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department-to">Đến ngày</Label>
                <Input
                  id="department-to"
                  type="date"
                  value={departmentForm.period_to}
                  onChange={(event) => updateDepartmentForm('period_to', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="department-file">URL tệp báo cáo</Label>
                <Input
                  id="department-file"
                  value={departmentForm.file_url ?? ''}
                  onChange={(event) => updateDepartmentForm('file_url', event.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDepartmentDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createDepartmentMutation.isPending}>
                {createDepartmentMutation.isPending ? 'Đang tạo...' : 'Tạo báo cáo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={enterpriseDialogOpen} onOpenChange={setEnterpriseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Nộp báo cáo hoạt động doanh nghiệp</DialogTitle>
          <DialogDescription>
            Chọn doanh nghiệp phụ trách và nhập số liệu hoạt động theo kỳ báo cáo.
          </DialogDescription>

          <form onSubmit={handleCreateEnterpriseReport} className="mt-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Doanh nghiệp</Label>
                <SearchSelect
                  options={createBusinessOptions}
                  value={enterpriseForm.business_id}
                  onValueChange={(value) => updateEnterpriseForm('business_id', value)}
                  placeholder={
                    myBusinessesQuery.isLoading ? 'Đang tải doanh nghiệp...' : 'Chọn doanh nghiệp'
                  }
                  searchPlaceholder="Tìm doanh nghiệp..."
                  className="w-full"
                  disabled={myBusinessesQuery.isLoading || createBusinessOptions.length === 0}
                  isLoading={myBusinessesQuery.isLoading}
                  emptyMessage={
                    myBusinessesQuery.isError
                      ? 'Không thể tải danh sách doanh nghiệp'
                      : 'Tài khoản chưa có doanh nghiệp'
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-period">Kỳ báo cáo</Label>
                <Select
                  value={enterpriseForm.report_period}
                  onValueChange={(value) => updateEnterpriseForm('report_period', value)}
                >
                  <SelectTrigger id="enterprise-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Tháng</SelectItem>
                    <SelectItem value="quarter">Quý</SelectItem>
                    <SelectItem value="year">Năm</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-from">Từ ngày</Label>
                <Input
                  id="enterprise-from"
                  type="date"
                  value={enterpriseForm.period_from}
                  onChange={(event) => updateEnterpriseForm('period_from', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-to">Đến ngày</Label>
                <Input
                  id="enterprise-to"
                  type="date"
                  value={enterpriseForm.period_to}
                  onChange={(event) => updateEnterpriseForm('period_to', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-capacity">Sức chứa TB (%)</Label>
                <Input
                  id="enterprise-capacity"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={enterpriseForm.avg_capacity_pct ?? ''}
                  onChange={(event) =>
                    updateEnterpriseForm(
                      'avg_capacity_pct',
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-revenue">Doanh thu</Label>
                <Input
                  id="enterprise-revenue"
                  type="number"
                  min={0}
                  value={enterpriseForm.total_revenue_vnd ?? ''}
                  onChange={(event) =>
                    updateEnterpriseForm(
                      'total_revenue_vnd',
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-bookings">Lượt đặt chỗ</Label>
                <Input
                  id="enterprise-bookings"
                  type="number"
                  min={0}
                  value={enterpriseForm.total_bookings ?? ''}
                  onChange={(event) =>
                    updateEnterpriseForm(
                      'total_bookings',
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise-visitors">Lượt khách</Label>
                <Input
                  id="enterprise-visitors"
                  type="number"
                  min={0}
                  value={enterpriseForm.total_visitors ?? ''}
                  onChange={(event) =>
                    updateEnterpriseForm(
                      'total_visitors',
                      event.target.value === '' ? undefined : Number(event.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="enterprise-notes">Ghi chú</Label>
                <Textarea
                  id="enterprise-notes"
                  value={enterpriseForm.notes ?? ''}
                  onChange={(event) => updateEnterpriseForm('notes', event.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnterpriseDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createEnterpriseMutation.isPending || !enterpriseForm.business_id}
              >
                {createEnterpriseMutation.isPending ? 'Đang nộp...' : 'Nộp báo cáo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reportToSend} onOpenChange={(open) => !open && setReportToSend(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Gửi báo cáo lên cấp Bộ</DialogTitle>
          <DialogDescription>
            Gửi thông báo kèm liên kết báo cáo tới các vai trò nhận báo cáo.
          </DialogDescription>

          <form onSubmit={handleSendDepartmentReport} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="send-target">Vai trò nhận</Label>
              <Select
                value={`${sendForm.target_roles?.[0] ?? ROLE_IDS.MINISTRY}`}
                onValueChange={(value) =>
                  setSendForm((current) => ({ ...current, target_roles: [Number(value)] }))
                }
              >
                <SelectTrigger id="send-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={`${ROLE_IDS.MINISTRY}`}>Bộ VHTTDL</SelectItem>
                  <SelectItem value={`${ROLE_IDS.SYSTEM_ADMIN}`}>Quản trị hệ thống</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-title">Tiêu đề thông báo</Label>
              <Input
                id="send-title"
                value={sendForm.title_vi ?? ''}
                onChange={(event) =>
                  setSendForm((current) => ({ ...current, title_vi: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-body">Nội dung thông báo</Label>
              <Textarea
                id="send-body"
                value={sendForm.body_vi ?? ''}
                onChange={(event) =>
                  setSendForm((current) => ({ ...current, body_vi: event.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReportToSend(null)}>
                Hủy
              </Button>
              <Button type="submit" disabled={sendDepartmentMutation.isPending}>
                <Users className="size-4" />
                {sendDepartmentMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
