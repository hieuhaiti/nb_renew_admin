import type { JSX, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Database,
  Gauge,
  MapPin,
  RefreshCw,
  Route,
  Save,
  Trash2,
  Users,
} from 'lucide-react'
import { useApiMutation, useApiQuery, capacityService, tourService } from '@/service'
import type {
  ApiResponse,
  CapacityStatus,
  RouteCapacityData,
  RouteCapacityStop,
  RouteCapacitySummary,
  TourListData,
} from '@/types/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { SearchSelect } from '@/components/common/SearchSelect'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
import { canAccessPage, PAGE_ACCESS } from '@/constant/permissionConstant'
import { useAuthStore } from '@/stores/common/useAuthStore'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const STATUS_LABEL: Record<CapacityStatus, string> = {
  normal: 'Bình thường',
  moderate: 'Vừa phải',
  busy: 'Đông',
  near_full: 'Sắp đầy',
  overloaded: 'Quá tải',
  closed: 'Đóng cửa',
  unknown: 'Chưa có dữ liệu',
}

const STATUS_DOT: Record<CapacityStatus, string> = {
  normal: 'bg-success',
  moderate: 'bg-sky-500',
  busy: 'bg-warning',
  near_full: 'bg-orange-500',
  overloaded: 'bg-destructive',
  closed: 'bg-muted-foreground',
  unknown: 'bg-muted-foreground',
}

const STATUS_BADGE: Record<CapacityStatus, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  moderate: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted/40 text-muted-foreground border-border',
  unknown: 'bg-muted text-muted-foreground border-border',
}

function getPayload(response?: ApiResponse<RouteCapacityData>): RouteCapacityData | undefined {
  return response?.data ?? response?.metadata
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

function formatPercent(value: unknown): string {
  const parsed = toNumber(value)
  return parsed == null ? '-' : `${parsed.toFixed(1)}%`
}

function formatDuration(minutes: unknown): string {
  const parsed = toNumber(minutes)
  if (parsed == null) return '-'
  if (parsed < 60) return `${parsed} phút`

  const hours = Math.floor(parsed / 60)
  const remaining = parsed % 60
  return remaining ? `${hours} giờ ${remaining} phút` : `${hours} giờ`
}

function getStatus(value?: string | null): CapacityStatus {
  if (
    value === 'normal' ||
    value === 'moderate' ||
    value === 'busy' ||
    value === 'near_full' ||
    value === 'overloaded' ||
    value === 'closed' ||
    value === 'unknown'
  ) {
    return value
  }

  return 'unknown'
}

function getStopName(stop: RouteCapacityStop): string {
  return stop.name_vi ?? stop.title_vi ?? 'Điểm chưa đặt tên'
}

function getStopSubtitle(stop: RouteCapacityStop): string {
  if (stop.spot_id) return 'Đã liên kết điểm du lịch'
  if (stop.business_id) return 'Đã liên kết doanh nghiệp'
  return 'Chưa gắn điểm dữ liệu'
}

function getProgressColor(status?: string | null): string {
  const normalized = getStatus(status)
  if (normalized === 'overloaded') return 'bg-destructive'
  if (normalized === 'near_full') return 'bg-orange-500'
  if (normalized === 'busy') return 'bg-warning'
  if (normalized === 'moderate') return 'bg-sky-500'
  if (normalized === 'closed' || normalized === 'unknown') return 'bg-muted-foreground'
  return 'bg-success'
}

function CapacityBar({
  value,
  status,
  className = 'h-2.5',
}: {
  value?: number | string | null
  status?: string | null
  className?: string
}) {
  const pct = toNumber(value)

  return (
    <div className={`bg-muted overflow-hidden rounded-full ${className}`}>
      <div
        className={`h-full rounded-full transition-all ${getProgressColor(status)}`}
        style={{ width: `${Math.min(Math.max(pct ?? 0, 0), 100)}%` }}
      />
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode
  label: string
  value: string
  helper?: string
}) {
  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="relative flex items-start gap-4 p-5">
        <div className="bg-primary absolute inset-x-0 top-0 h-1" />
        <div className="bg-primary/10 text-primary ring-primary/15 rounded-xl p-3 ring-1">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="typo-meta text-muted-foreground">{label}</p>
          <p className="typo-section-title mt-1 truncate">{value}</p>
          {helper && <p className="typo-caption text-muted-foreground mt-1">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const normalized = getStatus(status)

  return (
    <StatusDotBadge
      label={STATUS_LABEL[normalized]}
      dotClass={STATUS_DOT[normalized]}
      badgeClass={STATUS_BADGE[normalized]}
    />
  )
}

function RouteProgress({ summary }: { summary?: RouteCapacitySummary }) {
  const pct = toNumber(summary?.route_capacity_pct)
  const status = getStatus(summary?.status)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="typo-section-title">Tải tuyến hiện tại</CardTitle>
            <CardDescription>
              Tổng hợp sức chứa từ các điểm dừng có dữ liệu tải trong tour.
            </CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="typo-body-sm font-semibold">
              {pct == null ? 'Chưa đủ dữ liệu sức chứa' : `${pct.toFixed(1)}% sức chứa tuyến`}
            </span>
            <span className="typo-caption text-muted-foreground">
              {formatNumber(summary?.total_current_visitors)} /{' '}
              {formatNumber(summary?.total_max_capacity)} khách
            </span>
          </div>
          <div className="bg-muted h-3 overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(status)}`}
              style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {(summary?.stops_without_capacity_data || summary?.stops_without_max_capacity) && (
          <div className="border-border bg-muted/30 rounded-lg border p-3">
            <p className="typo-body-sm font-semibold">Dữ liệu chưa hoàn chỉnh</p>
            <p className="typo-meta text-muted-foreground">
              {formatNumber(summary.stops_without_capacity_data)} điểm chưa có bản ghi tải mới nhất,
              {` ${formatNumber(summary.stops_without_max_capacity)} điểm chưa cấu hình sức chứa tối đa.`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DataQualityBanner({ summary }: { summary?: RouteCapacitySummary }) {
  const missingCapacity = toNumber(summary?.stops_without_max_capacity) ?? 0
  const missingData = toNumber(summary?.stops_without_capacity_data) ?? 0
  const tracked = toNumber(summary?.capacity_tracked_stops) ?? 0
  const total = toNumber(summary?.total_stops) ?? 0

  if (!missingCapacity && !missingData && tracked >= total) return null

  return (
    <div className="border-warning/30 bg-warning/10 rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" />
          <div>
            <p className="typo-body-sm font-semibold">Cần bổ sung cấu hình sức chứa tối đa</p>
            <p className="typo-meta text-muted-foreground mt-1">
              Tuyến có {formatNumber(tracked)} / {formatNumber(total)} điểm đủ điều kiện tính tải.
              Các điểm thiếu sức chứa tối đa vẫn được hiển thị để rà soát.
            </p>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 text-center">
          <div className="bg-background/70 rounded-md border px-3 py-2">
            <p className="typo-section-title">{formatNumber(missingCapacity)} điểm</p>
            <p className="typo-caption text-muted-foreground">thiếu sức chứa tối đa</p>
          </div>
          <div className="bg-background/70 rounded-md border px-3 py-2">
            <p className="typo-section-title">{formatNumber(missingData)} điểm</p>
            <p className="typo-caption text-muted-foreground">thiếu bản ghi</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function BottleneckPanel({ summary }: { summary?: RouteCapacitySummary }) {
  const bottleneck = summary?.bottleneck_stop

  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Điểm nghẽn</CardTitle>
        <CardDescription>Điểm dừng có tải cao nhất trong tuyến.</CardDescription>
      </CardHeader>
      <CardContent>
        {!bottleneck ? (
          <div className="border-border bg-muted/30 rounded-lg border p-4">
            <p className="typo-body-sm font-semibold">Chưa phát hiện điểm nghẽn</p>
            <p className="typo-meta text-muted-foreground">
              Tuyến chưa có đủ dữ liệu hoặc các điểm dừng đang ở mức ổn định.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="typo-body-sm truncate font-semibold">{getStopName(bottleneck)}</p>
                <p className="typo-caption text-muted-foreground">{getStopSubtitle(bottleneck)}</p>
              </div>
              <StatusBadge status={bottleneck.capacity_status} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border-border rounded-lg border p-3">
                <p className="typo-caption text-muted-foreground">Tải hiện tại</p>
                <p className="typo-body-sm mt-1 font-semibold">
                  {formatPercent(bottleneck.capacity_pct)}
                </p>
              </div>
              <div className="border-border rounded-lg border p-3">
                <p className="typo-caption text-muted-foreground">Khách ghi nhận</p>
                <p className="typo-body-sm mt-1 font-semibold">
                  {formatNumber(bottleneck.visitor_count ?? bottleneck.observed_visitors)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StopCapacityCard({ stop }: { stop: RouteCapacityStop }) {
  const pct = toNumber(stop.capacity_pct)
  const coordinates = stop.geojson?.coordinates

  return (
    <div className="border-border bg-card rounded-lg border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              {formatNumber(stop.stop_order)}
            </span>
            <p className="typo-body-sm line-clamp-1 font-semibold">{getStopName(stop)}</p>
          </div>
          <p className="typo-caption text-muted-foreground mt-1 line-clamp-1">
            {getStopSubtitle(stop)}
          </p>
          {stop.description_vi && (
            <p className="typo-caption text-muted-foreground mt-1 line-clamp-2">
              {stop.description_vi}
            </p>
          )}
        </div>
        <StatusBadge status={stop.capacity_status} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="typo-caption text-muted-foreground">Mức tải</span>
          <span className="typo-body-sm font-semibold">{formatPercent(pct)}</span>
        </div>
        <CapacityBar value={pct} status={stop.capacity_status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="bg-muted/30 rounded-md p-2">
          <p className="typo-caption text-muted-foreground">Khách</p>
          <p className="typo-body-sm font-semibold">
            {formatNumber(stop.visitor_count ?? stop.observed_visitors)}
          </p>
        </div>
        <div className="bg-muted/30 rounded-md p-2">
          <p className="typo-caption text-muted-foreground">Tối đa</p>
          <p className="typo-body-sm font-semibold">{formatNumber(stop.max_capacity)}</p>
        </div>
        <div className="bg-muted/30 rounded-md p-2">
          <p className="typo-caption text-muted-foreground">Thời lượng</p>
          <p className="typo-body-sm inline-flex items-center gap-1 font-semibold">
            <Clock3 className="text-muted-foreground size-3.5" />
            {formatDuration(stop.planned_duration_min)}
          </p>
        </div>
        <div className="bg-muted/30 rounded-md p-2">
          <p className="typo-caption text-muted-foreground">Ghi nhận</p>
          <p className="typo-body-sm line-clamp-1 font-semibold">
            {stop.recorded_at ? formatDateTime(stop.recorded_at) : '-'}
          </p>
        </div>
      </div>

      {coordinates && (
        <p className="typo-caption text-muted-foreground mt-3 inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {coordinates.map((coord) => coord.toFixed(5)).join(', ')}
        </p>
      )}
    </div>
  )
}

function StopTimeline({ days }: { days: Array<[number, RouteCapacityStop[]]> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="typo-section-title">Lộ trình theo ngày</CardTitle>
        <CardDescription>Xem nhanh tải từng điểm dừng theo đúng thứ tự trong tour.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {days.map(([day, dayStops]) => (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary rounded-full p-2">
                <CalendarDays className="size-4" />
              </div>
              <div>
                <p className="typo-body-sm font-semibold">Ngày {formatNumber(day)}</p>
                <p className="typo-caption text-muted-foreground">
                  {formatNumber(dayStops.length)} điểm dừng
                </p>
              </div>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {dayStops.map((stop, index) => (
                <StopCapacityCard key={stop.stop_id ?? `${day}-${index}`} stop={stop} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function RouteCapacityPage(): JSX.Element {
  const permissions = useAuthStore((s) => s.permissions)
  const canUpdateCapacity = canAccessPage(permissions, PAGE_ACCESS.tourCapacityUpdate)
  const [selectedTourId, setSelectedTourId] = useState('')
  const [maxGuestsInput, setMaxGuestsInput] = useState('')
  const [resetSettingsOpen, setResetSettingsOpen] = useState(false)

  const toursQuery = useApiQuery<ApiResponse<TourListData>>(
    ['route-capacity-tours'],
    () => tourService.getAdmin({ limit: 100, status: 'published', sortOrder: 'DESC' }),
    { staleTime: STALE_HOT },
    false,
    false
  )

  const routeQuery = useApiQuery<ApiResponse<RouteCapacityData>>(
    ['route-capacity-current', selectedTourId],
    () => capacityService.getTourCurrent(selectedTourId),
    {
      enabled: UUID_RE.test(selectedTourId),
      staleTime: 30_000,
      refetchInterval: 60_000,
    },
    false,
    false
  )

  const tours = toursQuery.data?.data?.tours ?? []
  const data = getPayload(routeQuery.data)
  const summary = data?.summary
  const stops = data?.stops ?? []
  const selectedTour = data?.tour
  const selectedTourFromList = tours.find((tour) => tour.id === selectedTourId)
  const currentMaxGuests = selectedTour?.max_guests ?? selectedTourFromList?.max_guests ?? null
  const parsedMaxGuests = toNumber(maxGuestsInput)
  const canSaveTourSettings =
    UUID_RE.test(selectedTourId) &&
    parsedMaxGuests != null &&
    Number.isInteger(parsedMaxGuests) &&
    parsedMaxGuests > 0

  const updateTourSettingsMutation = useApiMutation(
    (payload: { tourId: string; maxGuests: number }) =>
      capacityService.updateTourSettings(payload.tourId, { max_guests: payload.maxGuests }),
    {
      onSuccess: () => {
        routeQuery.refetch()
        toursQuery.refetch()
      },
    },
    true
  )

  const deleteTourSettingsMutation = useApiMutation(
    (tourId: string) => capacityService.deleteTourSettings(tourId),
    {
      onSuccess: () => {
        setResetSettingsOpen(false)
        setMaxGuestsInput('')
        routeQuery.refetch()
        toursQuery.refetch()
      },
    },
    true
  )

  useEffect(() => {
    setMaxGuestsInput(currentMaxGuests == null ? '' : String(currentMaxGuests))
  }, [currentMaxGuests, selectedTourId])

  function handleSaveTourSettings() {
    if (!canUpdateCapacity || !canSaveTourSettings || parsedMaxGuests == null) return
    updateTourSettingsMutation.mutate({
      tourId: selectedTourId,
      maxGuests: Math.trunc(parsedMaxGuests),
    })
  }

  function handleDeleteTourSettings() {
    if (!canUpdateCapacity || !UUID_RE.test(selectedTourId)) return
    deleteTourSettingsMutation.mutate(selectedTourId)
  }

  const sortedStops = useMemo(
    () =>
      [...stops].sort((a, b) => {
        const dayA = toNumber(a.day_number) ?? 0
        const dayB = toNumber(b.day_number) ?? 0
        if (dayA !== dayB) return dayA - dayB
        return (toNumber(a.stop_order) ?? 0) - (toNumber(b.stop_order) ?? 0)
      }),
    [stops]
  )

  const stopsByDay = useMemo(() => {
    const groups = new Map<number, RouteCapacityStop[]>()
    for (const stop of sortedStops) {
      const day = toNumber(stop.day_number) ?? 0
      groups.set(day, [...(groups.get(day) ?? []), stop])
    }

    return Array.from(groups.entries()).sort(([dayA], [dayB]) => dayA - dayB)
  }, [sortedStops])

  return (
    <PageLayout
      title="Tải tuyến du lịch"
      description="Tra cứu tải hiện tại của tour theo các điểm dừng có dữ liệu sức chứa"
    >
      <div className="space-y-4">
        <Card className="border-primary/15 bg-card overflow-hidden shadow-sm">
          <CardContent className="relative p-0">
            <div className="bg-primary absolute inset-y-0 left-0 w-1" />
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="bg-primary/10 text-primary ring-primary/15 hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg ring-1 sm:flex">
                  <Route className="size-5" />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="typo-section-title">Chọn tuyến cần giám sát</p>
                    <Badge className="bg-info/10 text-info border-info/20">
                      {toursQuery.isLoading
                        ? 'Đang tải tour'
                        : `${formatNumber(tours.length)} tour`}
                    </Badge>
                  </div>
                  <p className="typo-meta text-muted-foreground max-w-2xl">
                    Chọn một tour đã xuất bản để xem sức chứa tổng hợp, điểm nghẽn và tải từng điểm
                    dừng theo thời gian gần nhất.
                  </p>
                </div>
              </div>

              <div className="bg-muted/40 border-border flex w-full flex-col gap-3 rounded-lg border p-3 lg:w-auto lg:min-w-[440px]">
                <div className="flex items-center justify-between gap-3">
                  <Label>Tour đã xuất bản</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toursQuery.refetch()}
                    disabled={toursQuery.isFetching}
                    className="h-8 px-2"
                  >
                    <RefreshCw
                      className={`size-4 ${toursQuery.isFetching ? 'animate-spin' : ''}`}
                    />
                    Tải lại
                  </Button>
                </div>
                <SearchSelect
                  options={tours.map((tour) => ({
                    value: tour.id,
                    label: tour.name,
                  }))}
                  value={selectedTourId}
                  onValueChange={setSelectedTourId}
                  placeholder={toursQuery.isLoading ? 'Đang tải tour...' : 'Chọn tour'}
                  searchPlaceholder="Tìm tour đã xuất bản..."
                  disabled={toursQuery.isLoading}
                  className="bg-background w-full"
                />
                {selectedTourId && (
                  <p className="typo-caption text-muted-foreground line-clamp-1">
                    Đang giám sát:{' '}
                    {tours.find((tour) => tour.id === selectedTourId)?.name ?? 'Tour đã chọn'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedTourId && canUpdateCapacity && (
          <Card className="border-border/80 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    Cấu hình tour
                  </Badge>
                </div>
                <div>
                  <p className="typo-section-title">Cấu hình sức chứa tối đa</p>
                  <p className="typo-meta text-muted-foreground mt-1 max-w-2xl">
                    Thiết lập giới hạn số khách tối đa cho tour đang chọn. Khi reset, giá trị sẽ trở
                    về mặc định.
                  </p>
                </div>
                <p className="typo-caption text-muted-foreground line-clamp-1">
                  Tour: {selectedTour?.name_vi ?? selectedTourFromList?.name ?? 'Tour đã chọn'}
                </p>
              </div>

              <div className="grid w-full gap-3 lg:w-auto lg:min-w-[520px] lg:grid-cols-[1fr_auto_auto] lg:items-end">
                <div className="space-y-1">
                  <Label htmlFor="tour-max-guests">Số khách tối đa</Label>
                  <Input
                    id="tour-max-guests"
                    type="number"
                    min={1}
                    step={1}
                    value={maxGuestsInput}
                    onChange={(event) => setMaxGuestsInput(event.target.value)}
                    placeholder="Ví dụ: 80"
                  />
                  <p className="typo-caption text-muted-foreground">
                    Hiện tại: {formatNumber(currentMaxGuests)} khách
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSaveTourSettings}
                  disabled={!canSaveTourSettings || updateTourSettingsMutation.isPending}
                >
                  <Save className="size-4" />
                  {updateTourSettingsMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetSettingsOpen(true)}
                  disabled={
                    !UUID_RE.test(selectedTourId) ||
                    currentMaxGuests == null ||
                    deleteTourSettingsMutation.isPending
                  }
                >
                  <Trash2 className="size-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedTourId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="bg-muted text-muted-foreground rounded-full p-3">
                <Route className="size-5" />
              </div>
              <p className="typo-section-title">Chưa chọn tuyến</p>
              <p className="typo-meta text-muted-foreground max-w-xl">
                Chọn một tour đã xuất bản để xem tải tổng hợp, điểm nghẽn và từng điểm dừng.
              </p>
            </CardContent>
          </Card>
        ) : routeQuery.isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="bg-destructive/10 text-destructive rounded-full p-3">
                <AlertTriangle className="size-5" />
              </div>
              <p className="typo-section-title">Không thể tải dữ liệu tuyến</p>
              <p className="typo-meta text-muted-foreground max-w-xl">
                Tour có thể chưa xuất bản, không tồn tại, hoặc dữ liệu tuyến chưa sẵn sàng. Vui lòng
                thử tải lại sau.
              </p>
              <Button onClick={() => routeQuery.refetch()} disabled={routeQuery.isFetching}>
                <RefreshCw className={`size-4 ${routeQuery.isFetching ? 'animate-spin' : ''}`} />
                Tải lại
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {selectedTour?.status ?? 'published'}
                    </Badge>
                    <StatusBadge status={summary?.status} />
                  </div>
                  <h2 className="typo-section-title mt-2 truncate">
                    {selectedTour?.name_vi ?? selectedTour?.name ?? 'Tour đã chọn'}
                  </h2>
                  <p className="typo-meta text-muted-foreground">
                    {selectedTour?.duration_days ? `${selectedTour.duration_days} ngày` : '-'} · Sức
                    chứa tour {formatNumber(selectedTour?.max_guests)} khách
                  </p>
                  <div className="text-muted-foreground typo-caption mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {selectedTour?.province_code && (
                      <span>Tỉnh/TP: {selectedTour.province_code}</span>
                    )}
                  </div>
                </div>
                <Button onClick={() => routeQuery.refetch()} disabled={routeQuery.isFetching}>
                  <RefreshCw className={`size-4 ${routeQuery.isFetching ? 'animate-spin' : ''}`} />
                  {routeQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard
                icon={<Route className="size-5" />}
                label="Tổng điểm dừng"
                value={formatNumber(summary?.total_stops)}
                helper={`${formatNumber(summary?.spot_stop_count)} điểm du lịch`}
              />
              <MetricCard
                icon={<Database className="size-5" />}
                label="Điểm có dữ liệu tải"
                value={formatNumber(summary?.capacity_tracked_stops)}
                helper="Đủ điều kiện tính tải tuyến"
              />
              <MetricCard
                icon={<Users className="size-5" />}
                label="Khách hiện tại"
                value={formatNumber(summary?.total_current_visitors)}
                helper={`Quan sát ${formatNumber(summary?.total_observed_visitors)} khách`}
              />
              <MetricCard
                icon={<Gauge className="size-5" />}
                label="Tải cao nhất"
                value={formatPercent(summary?.bottleneck_capacity_pct)}
                helper={summary?.bottleneck_stop ? getStopName(summary.bottleneck_stop) : '-'}
              />
            </div>

            <DataQualityBanner summary={summary} />

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
              <RouteProgress summary={summary} />
              <BottleneckPanel summary={summary} />
            </div>

            {stopsByDay.length > 0 && <StopTimeline days={stopsByDay} />}

            <Card>
              <CardHeader>
                <CardTitle className="typo-section-title">Điểm dừng trong tuyến</CardTitle>
                <CardDescription>
                  Các điểm chưa liên kết điểm du lịch hoặc thiếu cấu hình sức chứa vẫn được hiển thị
                  để rà soát dữ liệu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="sticky top-0 z-20">
                    <TableRow>
                      <TableHead>Điểm dừng</TableHead>
                      <TableHead>Ngày / thứ tự</TableHead>
                      <TableHead className="text-right">Khách</TableHead>
                      <TableHead className="text-right">Sức chứa tối đa</TableHead>
                      <TableHead>Tải</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi nhận lúc</TableHead>
                      <TableHead>Tọa độ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground text-center">
                          Đang tải dữ liệu tuyến...
                        </TableCell>
                      </TableRow>
                    ) : sortedStops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-muted-foreground text-center">
                          Chưa có điểm dừng hoặc dữ liệu tuyến chưa sẵn sàng.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedStops.map((stop, index) => (
                        <TableRow key={stop.stop_id ?? `${stop.spot_id}-${index}`}>
                          <TableCell className="max-w-80">
                            <p className="typo-table-cell line-clamp-1 font-semibold">
                              {getStopName(stop)}
                            </p>
                            <p className="typo-caption text-muted-foreground line-clamp-1">
                              {stop.spot_id ? 'Đã liên kết điểm du lịch' : 'Không gắn điểm du lịch'}
                            </p>
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            Ngày {formatNumber(stop.day_number)} · #{formatNumber(stop.stop_order)}
                          </TableCell>
                          <TableCell className="typo-table-cell text-right">
                            {formatNumber(stop.visitor_count ?? stop.observed_visitors)}
                          </TableCell>
                          <TableCell className="typo-table-cell text-right">
                            {formatNumber(stop.max_capacity)}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            <div className="min-w-28 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium">
                                  {formatPercent(stop.capacity_pct)}
                                </span>
                              </div>
                              <CapacityBar
                                value={stop.capacity_pct}
                                status={stop.capacity_status}
                                className="h-1.5"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={stop.capacity_status} />
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {stop.recorded_at ? formatDateTime(stop.recorded_at) : '-'}
                          </TableCell>
                          <TableCell className="typo-table-cell">
                            {stop.geojson?.coordinates ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="text-muted-foreground size-3.5" />
                                {stop.geojson.coordinates
                                  .map((coord) => coord.toFixed(5))
                                  .join(', ')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {canUpdateCapacity && (
        <AlertDialog open={resetSettingsOpen} onOpenChange={setResetSettingsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset sức chứa tour?</AlertDialogTitle>
              <AlertDialogDescription>
                Thao tác này sẽ đưa sức chứa tối đa của tour về mặc định. Bạn vẫn có thể cấu hình
                lại sau bằng nút Lưu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteTourSettingsMutation.isPending}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTourSettings}
                disabled={deleteTourSettingsMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteTourSettingsMutation.isPending ? 'Đang reset...' : 'Reset cấu hình'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageLayout>
  )
}
