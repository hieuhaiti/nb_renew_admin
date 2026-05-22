import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, tourService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type { ApiResponse, Tour, TourListData, TourStatus, TourFormBody, Pagination } from '@/types/api'
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
import { Pen, Plus, Trash2, Star } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { parseLink } from '@/lib/utils'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import TourDetailDialog from './TourDetailDialog'
import TourFormDialog from './TourFormDialog'

const STATUS_LABEL: Record<TourStatus, string> = {
  draft: 'Nháp',
  active: 'Đang hoạt động',
  inactive: 'Tạm dừng',
  archived: 'Lưu trữ',
  published: 'Đã xuất bản',
}
const STATUS_CLASS: Record<TourStatus, string> = {
  draft: 'bg-muted/40 text-muted-foreground border-border',
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-warning/10 text-warning border-warning/20',
  archived: 'bg-muted/40 text-muted-foreground border-border',
  published: 'bg-success/10 text-success border-success/20',
}
const STATUS_DOT: Record<TourStatus, string> = {
  draft: 'bg-muted-foreground',
  active: 'bg-success',
  inactive: 'bg-warning',
  archived: 'bg-muted-foreground',
  published: 'bg-success',
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export default function TourPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(statusFilter !== 'all' && { status: statusFilter as TourStatus }),
    ...(featuredFilter !== 'all' && { is_featured: featuredFilter === 'true' }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['tours', queryParams],
    () => tourService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<TourListData>)?.data
  const items = data?.tours ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = Math.max(1, pagination?.totalPages ?? lastTotalPagesRef.current ?? 1)
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedTourId, setSelectedTourId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Tour | null>(null)

  const createMutation = useApiMutation(
    (payload: TourFormBody) => tourService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedTourId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: Partial<TourFormBody> }) =>
      tourService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedTourId(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => tourService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  return (
    <PageLayout title="Tour du lịch" description="Quản lý tour du lịch trong hệ thống">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => { setSearchValue(v); setCurrentPage(1) }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
                <SelectItem value="archived">Lưu trữ</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
              </SelectContent>
            </Select>
            <Select value={featuredFilter} onValueChange={(v) => { setFeaturedFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Nổi bật</SelectItem>
                <SelectItem value="false">Không nổi bật</SelectItem>
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
            <Button size="sm" onClick={() => { setSelectedTourId(null); setFormDialogOpen(true) }}>
              <Plus className="mr-1 size-4" />
              Thêm tour
            </Button>
          </div>
        }
        total={total}
        pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead>Tên tour</TableHead>
              <TableHead className="w-20">Ngày</TableHead>
              <TableHead className="w-36">Giá từ</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-12 text-center">Nổi bật</TableHead>
              <TableHead className="w-28">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-destructive">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((tour: Tour) => (
                <TableRow
                  key={tour.id}
                  className="cursor-pointer"
                  onClick={() => { setSelectedTourId(tour.id); setDetailDialogOpen(true) }}
                >
                  <TableCell>
                    {tour.cover_image_url ? (
                      <img
                        src={parseLink(tour.cover_image_url)}
                        alt={tour.name}
                        className="h-10 w-10 cursor-zoom-in rounded border object-cover"
                        onClick={(e) => { e.stopPropagation(); openLightbox(parseLink(tour.cover_image_url!)) }}
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p className="font-medium">{tour.name}</p>
                    {tour.start_location_vi && (
                      <p className="text-muted-foreground line-clamp-1 text-sm">
                        {tour.start_location_vi}
                        {tour.end_location_vi ? ` → ${tour.end_location_vi}` : ''}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{tour.duration_days} ngày</TableCell>
                  <TableCell className="text-sm">{formatPrice(tour.price_from_vnd)}</TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[tour.status]}
                      badgeClass={STATUS_CLASS[tour.status]}
                      dotClass={STATUS_DOT[tour.status]}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {tour.is_featured ? (
                      <Star className="text-warning mx-auto size-4 fill-current" />
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(tour.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTourId(tour.id)
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
                          setItemToDelete(tour)
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

      <TourDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        tourId={selectedTourId}
      />

      <TourFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        tourId={selectedTourId}
        onSubmit={(payload) => {
          if (selectedTourId) {
            updateMutation.mutate({ id: selectedTourId, data: payload })
          } else {
            createMutation.mutate(payload as TourFormBody)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tour &quot;{itemToDelete?.name}&quot;? Hành động này không thể hoàn tác.
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
