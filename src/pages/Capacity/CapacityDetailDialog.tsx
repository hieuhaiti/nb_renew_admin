import type { JSX } from 'react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useApiQuery, capacityService } from '@/service'
import type {
  ApiResponse,
  CapacityState,
  CapacityStatus,
  CapacityHistoryData,
  CapacityStats,
  CapacityAlternative,
} from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { ClipboardList, Settings, Loader2 } from 'lucide-react'

const CAPACITY_STATUS_LABEL: Record<CapacityStatus, string> = {
  normal: 'Bình thường',
  moderate: 'Vừa phải',
  busy: 'Đông khách',
  near_full: 'Gần đầy',
  overloaded: 'Quá tải',
  closed: 'Đóng cửa',
}
const CAPACITY_STATUS_CLASS: Record<CapacityStatus, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  moderate: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted/40 text-muted-foreground border-border',
}
const CAPACITY_STATUS_DOT: Record<CapacityStatus, string> = {
  normal: 'bg-success',
  moderate: 'bg-sky-500',
  busy: 'bg-warning',
  near_full: 'bg-orange-500',
  overloaded: 'bg-destructive',
  closed: 'bg-muted-foreground',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm font-medium">{children}</span>
    </div>
  )
}

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="text-muted-foreground size-5 animate-spin" />
    </div>
  )
}

function TabEmpty({ text }: { text: string }) {
  return <p className="text-muted-foreground py-10 text-center text-sm">{text}</p>
}

function statusBadge(status: string | null) {
  if (!status) return '-'
  const s = status as CapacityStatus
  return (
    <StatusDotBadge
      label={CAPACITY_STATUS_LABEL[s] ?? status}
      badgeClass={CAPACITY_STATUS_CLASS[s] ?? 'bg-muted/40 text-muted-foreground border-border'}
      dotClass={CAPACITY_STATUS_DOT[s] ?? 'bg-muted-foreground'}
    />
  )
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CapacityState | null
  spotName: string
  onLog: () => void
  onSettings: () => void
}

export default function CapacityDetailDialog({
  open,
  onOpenChange,
  item,
  spotName,
  onLog,
  onSettings,
}: Props): JSX.Element {
  const spotId = item?.spot_id ?? null
  const pct = item?.capacity_pct != null ? parseFloat(item.capacity_pct) : null

  const [activeTab, setActiveTab] = useState('overview')

  const historyQuery = useApiQuery(
    ['capacity-history', spotId],
    () => capacityService.getHistory(spotId!, { limit: 20 }),
    { enabled: !!spotId && open && activeTab === 'history', staleTime: 0 },
    false,
    false
  )

  const statsQuery = useApiQuery(
    ['capacity-stats', spotId],
    () => capacityService.getStats(spotId!),
    { enabled: !!spotId && open && activeTab === 'stats', staleTime: 0 },
    false,
    false
  )

  const alternativesQuery = useApiQuery(
    ['capacity-alternatives', spotId],
    () => capacityService.getAlternatives(spotId!),
    { enabled: !!spotId && open && activeTab === 'alternatives', staleTime: 30_000 },
    false,
    false
  )

  const history = (historyQuery.data as ApiResponse<CapacityHistoryData>)?.data?.history ?? []
  const stats = (statsQuery.data as ApiResponse<CapacityStats>)?.data ?? null
  const alternatives = (alternativesQuery.data as ApiResponse<CapacityAlternative[]>)?.data
  const altList = Array.isArray(alternatives) ? alternatives : []

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setActiveTab('overview')
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogTitle>Chi tiết sức chứa</DialogTitle>
        <DialogDescription>{spotName}</DialogDescription>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Lịch sử
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">
              Thống kê
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="flex-1">
              Gợi ý
            </TabsTrigger>
          </TabsList>

          {/* ── Tổng quan ── */}
          <TabsContent value="overview">
            {item ? (
              <div className="divide-y">
                <Row label="Điểm tham quan">
                  <span>{spotName}</span>
                  <p className="text-muted-foreground text-xs font-normal">{item.spot_id}</p>
                </Row>
                <Row label="Khách hiện tại">{item.visitor_count ?? '-'}</Row>
                <Row label="Sức chứa tối đa">{item.max_capacity ?? '-'}</Row>
                <Row label="Tỷ lệ lấp đầy">
                  {pct != null ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor:
                              pct >= 100
                                ? 'var(--destructive)'
                                : pct >= 80
                                  ? 'var(--warning)'
                                  : 'var(--success)',
                          }}
                        />
                      </div>
                      <span className="tabular-nums">{item.capacity_pct}%</span>
                    </div>
                  ) : (
                    '-'
                  )}
                </Row>
                <Row label="Trạng thái">{statusBadge(item.status)}</Row>
                <Row label="Ngưỡng cảnh báo">
                  {item.alert_threshold_pct != null ? `${item.alert_threshold_pct}%` : '-'}
                </Row>
                <Row label="Cập nhật lúc">{formatDateTime(item.recorded_at)}</Row>
              </div>
            ) : (
              <TabEmpty text="Không có dữ liệu" />
            )}
          </TabsContent>

          {/* ── Lịch sử ── */}
          <TabsContent value="history">
            {historyQuery.isLoading ? (
              <TabLoading />
            ) : history.length === 0 ? (
              <TabEmpty text="Chưa có lịch sử ghi nhận" />
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground sticky top-0 bg-background text-xs">
                    <tr>
                      <th className="pb-1 text-left font-medium">Thời gian</th>
                      <th className="pb-1 text-right font-medium">Khách</th>
                      <th className="pb-1 text-right font-medium">Tỷ lệ</th>
                      <th className="pb-1 text-left font-medium">Trạng thái</th>
                      <th className="pb-1 text-left font-medium">Nguồn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((h) => (
                      <tr key={h.id}>
                        <td className="text-muted-foreground py-1.5 text-xs">
                          {formatDateTime(h.recorded_at)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {h.visitor_count ?? '-'}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">
                          {h.capacity_pct != null ? `${h.capacity_pct}%` : '-'}
                        </td>
                        <td className="py-1.5">{statusBadge(h.status)}</td>
                        <td className="text-muted-foreground py-1.5 text-xs">
                          {h.data_source ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* ── Thống kê ── */}
          <TabsContent value="stats">
            {statsQuery.isLoading ? (
              <TabLoading />
            ) : !stats ? (
              <TabEmpty text="Chưa có dữ liệu thống kê" />
            ) : (
              <div className="divide-y">
                <Row label="Tổng bản ghi">{stats.total_records}</Row>
                <Row label="Số khách tối đa">{stats.max_visitor_count}</Row>
                <Row label="Tỷ lệ TB">
                  {parseFloat(stats.avg_capacity_pct).toFixed(1)}%
                </Row>
                <Row label="Giờ cao điểm">{stats.peak_hour ?? '-'}</Row>
              </div>
            )}
          </TabsContent>

          {/* ── Gợi ý thay thế ── */}
          <TabsContent value="alternatives">
            {alternativesQuery.isLoading ? (
              <TabLoading />
            ) : altList.length === 0 ? (
              <TabEmpty text="Không có điểm thay thế phù hợp" />
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {altList.map((alt) => (
                  <div
                    key={alt.spot_id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{alt.name_vi}</p>
                      {alt.distance_km != null && (
                        <p className="text-muted-foreground text-xs">
                          {alt.distance_km.toFixed(1)} km
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {alt.capacity_pct != null && (
                        <span className="text-sm tabular-nums">{alt.capacity_pct}%</span>
                      )}
                      {statusBadge(alt.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onLog}>
            <ClipboardList className="mr-1 size-4" />
            Ghi nhận
          </Button>
          <Button variant="outline" size="sm" onClick={onSettings}>
            <Settings className="mr-1 size-4" />
            Cài đặt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
