import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { mapLayerService, useApiMutation, useApiQuery } from '@/service'
import type { ApiResponse, MapLayer, MapLayerListData, Pagination } from '@/types/api'
import type { MapLayerFormBody } from '@/service/mapLayerService'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Eye, EyeOff, Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import MapLayerFormDialog from './MapLayerFormDialog'
import MapLayerDetailDialog from './MapLayerDetailDialog'

const ACTIVE_LABEL: Record<string, string> = {
  true: 'Hoạt động',
  false: 'Ngừng',
}
const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted text-muted-foreground border-border',
}
const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

function getLayerName(layer: MapLayer): string {
  return layer.name_vi || layer.name || '-'
}

function getLayerType(layer: MapLayer): string {
  return layer.layer_type || layer.geometry_type || '-'
}

function isLayerActive(layer: MapLayer): boolean {
  if (typeof layer.is_active === 'boolean') return layer.is_active
  return layer.status === 'active'
}

export default function MapLayerPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [layerTypeFilter, setLayerTypeFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(layerTypeFilter !== 'all' && { layer_type: layerTypeFilter }),
  }

  const dbQuery = useApiQuery(
    ['mapLayers', queryParams],
    () => mapLayerService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<MapLayerListData>)?.data
  const layers = data?.items ?? data?.mapLayers ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [layerToDelete, setLayerToDelete] = useState<MapLayer | null>(null)
  const layerToDeleteName = layerToDelete ? getLayerName(layerToDelete) : ''

  const toggleMutation = useApiMutation(
    (id: number) => mapLayerService.toggle(id),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const createMutation = useApiMutation(
    (payload: MapLayerFormBody) => mapLayerService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedLayer(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: Partial<MapLayerFormBody> }) =>
      mapLayerService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedLayer(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => mapLayerService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setLayerToDelete(null)
      },
    },
    true
  )

  function handleFormSubmit(payload: MapLayerFormBody) {
    if (selectedLayer) {
      updateMutation.mutate({ id: selectedLayer.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <PageLayout title="Lớp bản đồ" description="Quản lý lớp dữ liệu bản đồ">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={layerTypeFilter}
              onValueChange={(v) => {
                setLayerTypeFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi loại</SelectItem>
                <SelectItem value="geojson">GeoJSON</SelectItem>
                <SelectItem value="vector">Vector</SelectItem>
                <SelectItem value="raster">Raster</SelectItem>
                <SelectItem value="wms">WMS</SelectItem>
                <SelectItem value="mvt">MVT</SelectItem>
                <SelectItem value="xyz">XYZ</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${limit}`}
              onValueChange={(v) => {
                setLimit(parseInt(v, 10))
                setCurrentPage(1)
              }}
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

            <Button
              variant="default"
              onClick={() => {
                setSelectedLayer(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm lớp
            </Button>
          </div>
        }
        total={total}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: (page: number) => setCurrentPage(page),
        }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên lớp</TableHead>
              <TableHead className="w-32">Danh mục</TableHead>
              <TableHead className="w-24">Loại lớp</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={7} className="text-destructive py-8 text-center">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : layers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              layers.map((layer: MapLayer) => (
                <TableRow
                  key={layer.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedLayer(layer)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>{layer.id}</TableCell>
                  <TableCell className="max-w-64 font-medium">
                    <span className="line-clamp-2">{getLayerName(layer)}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(layer as MapLayer & { category_name?: string }).category_name || '-'}
                  </TableCell>
                  <TableCell className="uppercase">{getLayerType(layer)}</TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(isLayerActive(layer))]}
                      badgeClass={ACTIVE_CLASS[String(isLayerActive(layer))]}
                      dotClass={ACTIVE_DOT[String(isLayerActive(layer))]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {layer.created_at ? formatDate(layer.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMutation.mutate(layer.id)
                        }}
                        title={isLayerActive(layer) ? 'Ngừng hoạt động' : 'Kích hoạt'}
                      >
                        {isLayerActive(layer) ? (
                          <EyeOff className="text-muted-foreground size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLayer(layer)
                          setFormDialogOpen(true)
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
                          setLayerToDelete(layer)
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

      <MapLayerDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        layer={selectedLayer}
      />

      <MapLayerFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        layer={selectedLayer}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lớp &quot;{layerToDeleteName}&quot;? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => layerToDelete && deleteMutation.mutate(layerToDelete.id)}
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
