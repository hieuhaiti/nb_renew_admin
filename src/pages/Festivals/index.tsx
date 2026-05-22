import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, festivalService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type {
  ApiResponse,
  Festival,
  FestivalListData,
  FestivalFormBody,
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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { parseLink } from '@/lib/utils'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import FestivalDetailDialog from './FestivalDetailDialog'
import FestivalFormDialog from './FestivalFormDialog'

export default function FestivalPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [festivalTypeFilter, setFestivalTypeFilter] = useState<string>('')
  const [upcomingFilter, setUpcomingFilter] = useState<string>('all')

  const trimmedFestivalType = festivalTypeFilter.trim()

  const queryParams = {
    page: Math.max(1, currentPage),
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(trimmedFestivalType && { festival_type: trimmedFestivalType }),
    ...(upcomingFilter !== 'all' && { upcoming: upcomingFilter === 'true' }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['festivals', queryParams],
    () => festivalService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<FestivalListData>)?.data
  const items = data?.items ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = Math.max(1, pagination?.totalPages ?? lastTotalPagesRef.current ?? 1)
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage < 1) {
      setCurrentPage(1)
      return
    }
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Festival | null>(null)

  const createMutation = useApiMutation(
    (payload: FestivalFormBody) => festivalService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: FestivalFormBody }) =>
      festivalService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedId(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => festivalService.delete(id),
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
    <PageLayout title="Lễ hội & sự kiện" description="Quản lý danh mục lễ hội và sự kiện">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Input
              value={festivalTypeFilter}
              onChange={(e) => {
                setFestivalTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Loại lễ hội"
              className="w-40"
            />
            <Select
              value={upcomingFilter}
              onValueChange={(v) => {
                setUpcomingFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sắp diễn ra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Sắp diễn ra</SelectItem>
                <SelectItem value="false">Không</SelectItem>
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
                setSelectedId(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm lễ hội
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
              <TableHead>Ảnh</TableHead>
              <TableHead>Tên (VI)</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Festival) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedId(item.id)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>
                    {item.cover_image_url ? (
                      <img
                        src={parseLink(item.cover_image_url)}
                        alt={item.name}
                        className="h-10 w-10 cursor-zoom-in rounded border object-cover"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLightbox(parseLink(item.cover_image_url!))
                        }}
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    {item.spot_name && (
                      <p className="text-muted-foreground text-xs">{item.spot_name}</p>
                    )}
                    {item.location_name && (
                      <p className="text-muted-foreground text-xs">{item.location_name}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.festival_type || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.start_date ? formatDate(item.start_date) : '-'}
                    {item.end_date && (
                      <span className="text-muted-foreground"> → {formatDate(item.end_date)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_published ? (
                      <Badge variant="default">Đã xuất bản</Badge>
                    ) : (
                      <Badge variant="outline">Nháp</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.created_at ? formatDate(item.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(item.id)
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

      <FestivalDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        festivalId={selectedId}
      />

      <FestivalFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        festivalId={selectedId}
        onSubmit={(payload) => {
          if (selectedId) {
            updateMutation.mutate({ id: selectedId, data: payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{itemToDelete?.name}&quot;? Hành động này không thể
              hoàn tác.
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
