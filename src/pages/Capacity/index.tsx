import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useApiQuery, useApiMutation, capacityService, spotService } from '@/service'
import { useCapacityStore } from '@/stores/common/useCapacityStore'
import type {
  ApiResponse,
  CapacityState,
  CapacityStatus,
  CapacityLogBody,
  CapacitySettingsBody,
  Spot,
  SpotListData,
} from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
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
import { Wifi, WifiOff, Loader2, Settings, ClipboardList } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { STALE_HOT, STALE_REF } from '@/constant/queryConstant'

const CAPACITY_STATUS_LABEL: Record<CapacityStatus, string> = {
  normal: 'Bình thường',
  busy: 'Đông khách',
  near_full: 'Gần đầy',
  overloaded: 'Quá tải',
  closed: 'Đóng cửa',
}
const CAPACITY_STATUS_CLASS: Record<CapacityStatus, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted/40 text-muted-foreground border-border',
}
const CAPACITY_STATUS_DOT: Record<CapacityStatus, string> = {
  normal: 'bg-success',
  busy: 'bg-warning',
  near_full: 'bg-orange-500',
  overloaded: 'bg-destructive',
  closed: 'bg-muted-foreground',
}

const logSchema = z.object({
  visitor_count: z.coerce.number().int().min(0, 'Số khách phải ≥ 0'),
  max_capacity: z.coerce.number().int().min(1).optional().nullable(),
  data_source: z.string().max(100).optional().or(z.literal('')),
})
type LogFormValues = z.infer<typeof logSchema>

const settingsSchema = z.object({
  max_capacity: z.coerce.number().int().min(1, 'Sức chứa tối đa phải ≥ 1'),
  alert_threshold_pct: z.coerce.number().min(1).max(100, 'Ngưỡng cảnh báo phải 1–100'),
})
type SettingsFormValues = z.infer<typeof settingsSchema>

export default function CapacityPage(): JSX.Element {
  const { capacityBySpotId, wsStatus, loadSnapshot, connectWS, disconnectWS } = useCapacityStore()

  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null)

  // Load REST snapshot
  const snapshotQuery = useApiQuery(
    ['capacity-current'],
    () => capacityService.getCurrent(),
    { staleTime: STALE_HOT },
    false,
    false
  )

  // Load spot list for name lookup
  const spotsQuery = useApiQuery(
    ['spots-for-capacity'],
    () => spotService.getAll({ limit: 200, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_REF },
    false,
    false
  )

  const spotNameMap: Record<string, string> = {}
  const spotsData = (spotsQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []
  for (const s of spotsData) {
    spotNameMap[s.id] = s.name_vi ?? s.slug ?? s.id
  }

  // Merge snapshot into store on load
  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  // Connect WebSocket for realtime updates
  useEffect(() => {
    connectWS()
    return () => {
      disconnectWS()
    }
  }, [connectWS, disconnectWS])

  // Build display list: prefer realtime store data, fall back to REST snapshot
  const snapshotItems: CapacityState[] = (snapshotQuery.data as ApiResponse<CapacityState[]>)?.data ?? []

  const displayItems: CapacityState[] = snapshotItems.map((item) => {
    const live = capacityBySpotId[item.spot_id]
    return live ?? item
  })

  // Log form
  const logForm = useForm<LogFormValues>({
    resolver: zodResolver(logSchema),
    defaultValues: { visitor_count: 0, max_capacity: null, data_source: '' },
  })

  const logMutation = useApiMutation(
    (payload: { spotId: string; data: CapacityLogBody }) =>
      capacityService.log(payload.spotId, payload.data),
    {
      onSuccess: () => {
        snapshotQuery.refetch()
        loadSnapshot()
        setLogDialogOpen(false)
      },
    },
    true
  )

  function openLog(spotId: string, current: CapacityState) {
    setActiveSpotId(spotId)
    logForm.reset({
      visitor_count: current.visitor_count,
      max_capacity: current.max_capacity ?? null,
      data_source: '',
    })
    setLogDialogOpen(true)
  }

  const onLogSubmit: SubmitHandler<LogFormValues> = (values) => {
    if (!activeSpotId) return
    logMutation.mutate({
      spotId: activeSpotId,
      data: {
        visitor_count: values.visitor_count,
        ...(values.max_capacity != null && { max_capacity: values.max_capacity }),
        ...(values.data_source && { data_source: values.data_source }),
      },
    })
  }

  // Settings form
  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { max_capacity: 100, alert_threshold_pct: 80 },
  })

  const settingsMutation = useApiMutation(
    (payload: { spotId: string; data: CapacitySettingsBody }) =>
      capacityService.updateSettings(payload.spotId, payload.data),
    {
      onSuccess: () => {
        snapshotQuery.refetch()
        loadSnapshot()
        setSettingsDialogOpen(false)
      },
    },
    true
  )

  function openSettings(spotId: string, current: CapacityState) {
    setActiveSpotId(spotId)
    settingsForm.reset({
      max_capacity: current.max_capacity ?? 100,
      alert_threshold_pct: current.alert_threshold_pct ?? 80,
    })
    setSettingsDialogOpen(true)
  }

  const onSettingsSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    if (!activeSpotId) return
    settingsMutation.mutate({
      spotId: activeSpotId,
      data: { max_capacity: values.max_capacity, alert_threshold_pct: values.alert_threshold_pct },
    })
  }

  const activeSpotName = activeSpotId ? (spotNameMap[activeSpotId] ?? activeSpotId) : ''

  const wsStatusLabel: Record<typeof wsStatus, string> = {
    connected: 'Đang kết nối realtime',
    connecting: 'Đang kết nối...',
    reconnecting: 'Đang kết nối lại...',
    disconnected: 'Ngắt kết nối',
  }

  const isLoading = snapshotQuery.isLoading

  return (
    <PageLayout
      title="Sức chứa điểm đến"
      description="Theo dõi và cập nhật sức chứa điểm tham quan theo thời gian thực"
    >
      {/* WS Status indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {wsStatus === 'connected' ? (
            <Wifi className="text-success size-4" />
          ) : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? (
            <Loader2 className="text-warning size-4 animate-spin" />
          ) : (
            <WifiOff className="text-muted-foreground size-4" />
          )}
          <span className="typo-meta text-muted-foreground">{wsStatusLabel[wsStatus]}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { snapshotQuery.refetch(); loadSnapshot() }}
          disabled={snapshotQuery.isFetching}
        >
          {snapshotQuery.isFetching ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Điểm tham quan</TableHead>
              <TableHead className="w-28 text-right">Khách hiện tại</TableHead>
              <TableHead className="w-28 text-right">Sức chứa tối đa</TableHead>
              <TableHead className="w-28 text-right">Tỷ lệ (%)</TableHead>
              <TableHead className="w-36">Trạng thái</TableHead>
              <TableHead className="w-36">Cập nhật lúc</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : snapshotQuery.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-destructive">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center py-8">
                  Không có dữ liệu sức chứa
                </TableCell>
              </TableRow>
            ) : (
              displayItems.map((item) => {
                const pct = parseFloat(item.capacity_pct)
                return (
                  <TableRow key={item.spot_id}>
                    <TableCell>
                      <p className="font-medium">{spotNameMap[item.spot_id] ?? item.spot_id}</p>
                      <p className="text-muted-foreground text-xs">{item.spot_id}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.visitor_count}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.max_capacity ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor:
                                pct >= 100 ? 'var(--destructive)' :
                                pct >= 80 ? 'var(--warning)' :
                                'var(--success)',
                            }}
                          />
                        </div>
                        <span className="text-sm tabular-nums">{item.capacity_pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusDotBadge
                        label={CAPACITY_STATUS_LABEL[item.status]}
                        badgeClass={CAPACITY_STATUS_CLASS[item.status]}
                        dotClass={CAPACITY_STATUS_DOT[item.status]}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(item.recorded_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLog(item.spot_id, item)}
                          title="Ghi nhận lượt khách"
                        >
                          <ClipboardList className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSettings(item.spot_id, item)}
                          title="Cài đặt sức chứa"
                        >
                          <Settings className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Log visitor count dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Ghi nhận lượt khách</DialogTitle>
          <DialogDescription>{activeSpotName}</DialogDescription>
          <form onSubmit={logForm.handleSubmit(onLogSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="log_visitor_count">Số khách hiện tại <span className="text-destructive">*</span></Label>
              <Input
                id="log_visitor_count"
                type="number"
                min={0}
                {...logForm.register('visitor_count')}
              />
              {logForm.formState.errors.visitor_count && (
                <p className="text-destructive text-xs">{logForm.formState.errors.visitor_count.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="log_max_capacity">Sức chứa tối đa (để trống giữ nguyên)</Label>
              <Input
                id="log_max_capacity"
                type="number"
                min={1}
                {...logForm.register('max_capacity')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="log_data_source">Nguồn dữ liệu</Label>
              <Input
                id="log_data_source"
                {...logForm.register('data_source')}
                placeholder="Cổng vào, camera, thủ công..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setLogDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={logMutation.isPending}>
                {logMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Cài đặt sức chứa</DialogTitle>
          <DialogDescription>{activeSpotName}</DialogDescription>
          <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="set_max_capacity">Sức chứa tối đa <span className="text-destructive">*</span></Label>
              <Input
                id="set_max_capacity"
                type="number"
                min={1}
                {...settingsForm.register('max_capacity')}
              />
              {settingsForm.formState.errors.max_capacity && (
                <p className="text-destructive text-xs">{settingsForm.formState.errors.max_capacity.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="set_alert_threshold">Ngưỡng cảnh báo (%) <span className="text-destructive">*</span></Label>
              <Input
                id="set_alert_threshold"
                type="number"
                min={1}
                max={100}
                {...settingsForm.register('alert_threshold_pct')}
              />
              {settingsForm.formState.errors.alert_threshold_pct && (
                <p className="text-destructive text-xs">{settingsForm.formState.errors.alert_threshold_pct.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSettingsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={settingsMutation.isPending}>
                {settingsMutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
