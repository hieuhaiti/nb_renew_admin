import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useApiQuery, capacityService, roleService } from '@/service'
import { useCapacityStore } from '@/stores/common/useCapacityStore'
import type {
  ApiResponse,
  CapacityState,
  CapacityStatus,
  CapacityAdminData,
  CapacityConfig,
  CapacityConfigsData,
  Role,
} from '@/types/api'
import { Button } from '@/components/ui/button'
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
  Wifi,
  WifiOff,
  Loader2,
  Settings,
  ClipboardList,
  Plus,
  Bell,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
import { canAccessPage, PAGE_ACCESS } from '@/constant/permissionConstant'
import CapacityDetailDialog from './CapacityDetailDialog'
import CapacityLogFormDialog from './CapacityLogFormDialog'
import CapacitySettingsFormDialog from './CapacitySettingsFormDialog'
import CapacityConfigFormDialog from './CapacityConfigFormDialog'
import { PaginationCustom } from '@/components/features/PaginationCustom'
import { useAuthStore } from '@/stores/common/useAuthStore'

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

function ThresholdBar({ busy, near, over }: { busy: number; near: number; over: number }) {
  const cap = over > 0 ? over : 100
  return (
    <div className="space-y-1">
      <div className="bg-muted relative h-3 w-40 overflow-hidden rounded-full">
        {/* normal zone */}
        <div
          className="bg-success/70 absolute inset-y-0 left-0"
          style={{ width: `${(busy / cap) * 100}%` }}
        />
        {/* busy zone */}
        <div
          className="bg-warning/70 absolute inset-y-0"
          style={{
            left: `${(busy / cap) * 100}%`,
            width: `${((near - busy) / cap) * 100}%`,
          }}
        />
        {/* near-full zone */}
        <div
          className="absolute inset-y-0 bg-orange-500/70"
          style={{
            left: `${(near / cap) * 100}%`,
            width: `${((over - near) / cap) * 100}%`,
          }}
        />
      </div>
      <p className="text-muted-foreground text-xs tabular-nums">
        Đông: {busy}% · Gần đầy: {near}% · Quá tải: {over}%
      </p>
    </div>
  )
}

export default function CapacityPage(): JSX.Element {
  const { capacityBySpotId, wsStatus, initFromSnapshot, connectWS, disconnectWS } =
    useCapacityStore()
  const permissions = useAuthStore((s) => s.permissions)
  const canManageAlertConfigs = canAccessPage(permissions, PAGE_ACCESS.capacityConfigs)

  const [detailOpen, setDetailOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<CapacityState | null>(null)
  const [editConfig, setEditConfig] = useState<CapacityConfig | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 400)

  const queryParams = {
    page: currentPage,
    limit: 10,
    sortOrder: 'DESC' as const,
    ...(debouncedSearch && { search: debouncedSearch }),
  }

  const snapshotQuery = useApiQuery(
    ['capacity-admin', queryParams],
    () => capacityService.getAdmin(queryParams),
    { staleTime: STALE_HOT },
    false,
    false
  )

  const configsQuery = useApiQuery(
    ['capacity-configs'],
    () => capacityService.getConfigs(),
    { staleTime: STALE_HOT, enabled: canManageAlertConfigs },
    false,
    false
  )

  const rolesQuery = useApiQuery(
    ['roles'],
    () => roleService.getAll(),
    { staleTime: STALE_HOT, enabled: canManageAlertConfigs },
    false,
    false
  )
  const roles: Role[] =
    (rolesQuery.data as unknown as ApiResponse<{ roles: Role[] }>)?.data?.roles ?? []

  useEffect(() => {
    const rawCapacity = (snapshotQuery.data as ApiResponse<CapacityAdminData>)?.data?.capacity
    const items: CapacityState[] = Array.isArray(rawCapacity) ? rawCapacity : []
    initFromSnapshot(items)
  }, [snapshotQuery.data, initFromSnapshot])

  useEffect(() => {
    connectWS()
    return () => {
      disconnectWS()
    }
  }, [connectWS, disconnectWS])

  const rawCapacity = (snapshotQuery.data as ApiResponse<CapacityAdminData>)?.data?.capacity
  const snapshotItems: CapacityState[] = Array.isArray(rawCapacity) ? rawCapacity : []
  const pagination = (snapshotQuery.data as ApiResponse<CapacityAdminData>)?.data?.pagination

  const displayItems: CapacityState[] = snapshotItems.map((item) => {
    const live = capacityBySpotId[item.spot_id]
    return live ? { ...item, ...live } : item
  })

  const configs: CapacityConfig[] =
    (configsQuery.data as unknown as ApiResponse<CapacityConfigsData>)?.data?.configs ?? []

  function getSpotName(item: CapacityState) {
    return item.name_vi ?? item.spot_id
  }

  function handleRefresh() {
    snapshotQuery.refetch()
  }

  function openDetail(item: CapacityState) {
    setActiveItem(item)
    setDetailOpen(true)
  }

  function openLog(item: CapacityState) {
    setActiveItem(item)
    setDetailOpen(false)
    setLogOpen(true)
  }

  function openSettings(item: CapacityState) {
    setActiveItem(item)
    setDetailOpen(false)
    setSettingsOpen(true)
  }

  function openAddConfig() {
    if (!canManageAlertConfigs) return
    setEditConfig(null)
    setConfigOpen(true)
  }

  function openEditConfig(cfg: CapacityConfig) {
    if (!canManageAlertConfigs) return
    setEditConfig(cfg)
    setConfigOpen(true)
  }

  const wsStatusLabel: Record<typeof wsStatus, string> = {
    connected: 'Đang kết nối realtime',
    connecting: 'Đang kết nối...',
    reconnecting: 'Đang kết nối lại...',
    disconnected: 'Ngắt kết nối',
  }

  return (
    <PageLayout
      title="Sức chứa điểm đến"
      description="Theo dõi và cập nhật sức chứa điểm tham quan theo thời gian thực"
    >
      {/* ── Toolbar: search + WS status + refresh ── */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative w-64">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Tìm kiếm điểm tham quan..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setCurrentPage(1)
              }}
              className="pr-9 pl-9"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchInput(''); setCurrentPage(1) }}
                className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* WS status */}
          <div className="flex items-center gap-1.5">
            {wsStatus === 'connected' ? (
              <Wifi className="text-success size-4" />
            ) : wsStatus === 'connecting' || wsStatus === 'reconnecting' ? (
              <Loader2 className="text-warning size-4 animate-spin" />
            ) : (
              <WifiOff className="text-muted-foreground size-4" />
            )}
            <span className="typo-meta text-muted-foreground">{wsStatusLabel[wsStatus]}</span>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleRefresh}
          disabled={snapshotQuery.isFetching}
          className="gap-1.5 px-3"
        >
          <RefreshCw className={`h-6 w-6 ${snapshotQuery.isFetching ? 'animate-spin' : ''}`} />
          {snapshotQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
        </Button>
      </div>

      {/* ── Main capacity table ── */}
      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Điểm tham quan</TableHead>
              <TableHead className="text-right">Khách hiện tại</TableHead>
              <TableHead className="text-right">Sức chứa tối đa</TableHead>
              <TableHead className="text-right">Tỷ lệ (%)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật lúc</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshotQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : snapshotQuery.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive py-8 text-center">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Không có dữ liệu sức chứa
                </TableCell>
              </TableRow>
            ) : (
              displayItems.map((item) => {
                const pct = item.capacity_pct != null ? parseFloat(item.capacity_pct) : null
                return (
                  <TableRow
                    key={item.spot_id}
                    className="cursor-pointer"
                    onClick={() => openDetail(item)}
                  >
                    <TableCell>
                      <p className="font-medium">{getSpotName(item)}</p>
                      <p className="text-muted-foreground text-xs">{item.spot_id}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.visitor_count ?? '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right">
                      {item.max_capacity ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {pct != null ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor:
                                  pct >= 100
                                    ? 'hsl(var(--destructive))'
                                    : pct >= 85
                                      ? '#f97316'
                                      : pct >= 70
                                        ? 'hsl(var(--warning))'
                                        : 'hsl(var(--success))',
                              }}
                            />
                          </div>
                          <span className="text-sm tabular-nums">{item.capacity_pct}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.status ? (
                        <StatusDotBadge
                          label={CAPACITY_STATUS_LABEL[item.status]}
                          badgeClass={CAPACITY_STATUS_CLASS[item.status]}
                          dotClass={CAPACITY_STATUS_DOT[item.status]}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(item.recorded_at)}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLog(item)}
                          title="Ghi nhận lượt khách"
                        >
                          <ClipboardList className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSettings(item)}
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
      {pagination && pagination.totalPages > 1 && (
        <PaginationCustom
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          className="mt-4"
        />
      )}

      {canManageAlertConfigs && (
        <div className="mt-8">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="text-muted-foreground size-4" />
                <h2 className="text-base font-semibold">Cấu hình cảnh báo nâng cao</h2>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Ngưỡng % tải trọng chi tiết cho từng điểm — hệ thống push thông báo đến vai trò quản
                lý khi lượng khách vượt mức.
              </p>
            </div>
            <Button size="sm" onClick={openAddConfig} className="shrink-0">
              <Plus className="mr-1 size-4" />
              Thêm cấu hình
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Điểm tham quan</TableHead>
                  <TableHead>Ngưỡng sức chứa</TableHead>
                  <TableHead>Vai trò nhận báo</TableHead>
                  <TableHead>Cập nhật lúc</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : configs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      Chưa có cấu hình cảnh báo nào
                    </TableCell>
                  </TableRow>
                ) : (
                  configs.map((cfg) => (
                    <TableRow key={cfg.id}>
                      <TableCell>
                        <p className="font-medium">
                          {snapshotItems.find((s) => s.spot_id === cfg.spot_id)?.name_vi ??
                            cfg.spot_id}
                        </p>
                        <p className="text-muted-foreground text-xs">{cfg.spot_id}</p>
                      </TableCell>
                      <TableCell>
                        <ThresholdBar
                          busy={cfg.threshold_busy}
                          near={cfg.threshold_near}
                          over={cfg.threshold_over}
                        />
                      </TableCell>
                      <TableCell>
                        {cfg.notify_roles?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cfg.notify_roles.map((id) => {
                              const role = roles.find((r) => String(r.id) === id)
                              return (
                                <span
                                  key={id}
                                  className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
                                >
                                  {role?.name_vi ?? role?.name ?? id}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDateTime(cfg.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditConfig(cfg)}
                          title="Chỉnh sửa"
                        >
                          <Settings className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <CapacityDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={activeItem}
        spotName={activeItem ? getSpotName(activeItem) : ''}
        onLog={() => openLog(activeItem!)}
        onSettings={() => openSettings(activeItem!)}
      />

      <CapacityLogFormDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        spotId={activeItem?.spot_id ?? null}
        spotName={activeItem ? getSpotName(activeItem) : ''}
        current={activeItem}
        onSuccess={handleRefresh}
      />

      <CapacitySettingsFormDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        spotId={activeItem?.spot_id ?? null}
        spotName={activeItem ? getSpotName(activeItem) : ''}
        current={activeItem}
        onSuccess={handleRefresh}
      />

      {canManageAlertConfigs && (
        <CapacityConfigFormDialog
          open={configOpen}
          onOpenChange={setConfigOpen}
          editConfig={editConfig}
          onSuccess={() => configsQuery.refetch()}
        />
      )}
    </PageLayout>
  )
}
