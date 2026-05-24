import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, integrationService } from '@/service'
import type {
  ApiResponse,
  Integration,
  IntegrationListData,
  IntegrationFormBody,
  Pagination,
} from '@/types/api'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pen, Plus, Trash2, RefreshCw } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import IntegrationDetailDialog from './IntegrationDetailDialog'
import IntegrationFormDialog from './IntegrationFormDialog'

const INTEGRATION_TYPE_LABEL: Record<string, string> = {
  data_sync: 'Đồng bộ dữ liệu',
  booking: 'Đặt chỗ',
  payment: 'Thanh toán',
  notification: 'Thông báo',
  analytics: 'Phân tích',
}

const AUTH_TYPE_LABEL: Record<string, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic: 'Basic Auth',
  none: 'Không xác thực',
}

const ACTIVE_LABEL: Record<string, string> = { true: 'Đang hoạt động', false: 'Tắt' }
const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted/40 text-muted-foreground border-border',
}
const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

export default function IntegrationPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // ── Detail / Form dialogs ────────────────────────────────────────────────
  const [selectedItem, setSelectedItem] = useState<Integration | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  // ── Delete dialog ────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Integration | null>(null)

  // ── Sync state ────────────────────────────────────────────────────────────
  const [syncingId, setSyncingId] = useState<number | null>(null)

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(activeFilter !== 'all' && { is_active: activeFilter === 'true' }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['integrations', queryParams],
    () => integrationService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<IntegrationListData>)?.data
  const items = data?.integrations ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = Math.max(1, pagination?.totalPages ?? lastTotalPagesRef.current ?? 1)
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const createMutation = useApiMutation(
    (payload: IntegrationFormBody) => integrationService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormOpen(false)
        setSelectedItem(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: Partial<IntegrationFormBody> }) =>
      integrationService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormOpen(false)
        setSelectedItem(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => integrationService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const syncMutation = useApiMutation(
    (id: number) => integrationService.sync(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setSyncingId(null)
      },
    },
    true
  )

  function handleFormSubmit(data: IntegrationFormBody) {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  function openDetail(item: Integration) {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  function openForm(item: Integration | null = null) {
    setSelectedItem(item)
    setFormOpen(true)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <PageLayout
      title="Tích hợp bên thứ 3"
      description="Quản lý các tích hợp dịch vụ bên ngoài"
    >
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => { setSearchValue(v); setCurrentPage(1) }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select
              value={activeFilter}
              onValueChange={(v) => { setActiveFilter(v); setCurrentPage(1) }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Tắt</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${limit}`}
              onValueChange={(v) => { setLimit(parseInt(v, 10)); setCurrentPage(1) }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => openForm(null)}>
              <Plus className="mr-1 size-4" />
              Thêm tích hợp
            </Button>
          </div>
        }
        total={total}
        pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="w-36">Loại tích hợp</TableHead>
              <TableHead className="w-28">Xác thực</TableHead>
              <TableHead className="w-32">Trạng thái</TableHead>
              <TableHead className="w-36">Đồng bộ lần cuối</TableHead>
              <TableHead className="w-32 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive text-center py-8">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Integration) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(item)}
                >
                  <TableCell>
                    <p className="font-medium">{item.provider_name}</p>
                    <p className="text-muted-foreground text-xs">{item.provider_code}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {INTEGRATION_TYPE_LABEL[item.integration_type] ?? item.integration_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {AUTH_TYPE_LABEL[item.auth_type] ?? item.auth_type}
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(item.is_active)]}
                      badgeClass={ACTIVE_CLASS[String(item.is_active)]}
                      dotClass={ACTIVE_DOT[String(item.is_active)]}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDateTime(item.last_synced_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSyncingId(item.id)
                          syncMutation.mutate(item.id)
                        }}
                        title="Đồng bộ ngay"
                        disabled={syncMutation.isPending && syncingId === item.id}
                      >
                        <RefreshCw
                          className={`size-4 ${syncMutation.isPending && syncingId === item.id ? 'animate-spin' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openForm(item)
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setItemToDelete(item)
                          setDeleteDialogOpen(true)
                        }}
                        title="Xóa"
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      {/* ── Detail dialog (includes logs) ── */}
      <IntegrationDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        integration={selectedItem}
        onEdit={() => {
          setDetailOpen(false)
          setFormOpen(true)
        }}
      />

      {/* ── Form dialog (create / edit) ── */}
      <IntegrationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        integration={selectedItem}
        onSubmit={handleFormSubmit}
        isLoading={isMutating}
      />

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tích hợp &quot;{itemToDelete?.provider_name}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
