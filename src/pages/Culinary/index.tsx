import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, culinaryService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type {
  ApiResponse,
  Culinary,
  CulinaryListData,
  CulinaryFormBody,
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
import CulinaryDetailDialog from './CulinaryDetailDialog'
import CulinaryFormDialog from './CulinaryFormDialog'

export default function CulinaryPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [specialityFilter, setSpecialityFilter] = useState<string>('all')

  const trimmedCategory = categoryFilter.trim()

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(trimmedCategory && { category: trimmedCategory }),
    ...(specialityFilter !== 'all' && { is_speciality: specialityFilter === 'true' }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['culinary', queryParams],
    () => culinaryService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<CulinaryListData>)?.data
  const items = data?.items ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Culinary | null>(null)

  const createMutation = useApiMutation(
    (payload: CulinaryFormBody) => culinaryService.create(payload),
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
    (payload: { id: string; data: CulinaryFormBody }) =>
      culinaryService.update(payload.id, payload.data),
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
    (id: string) => culinaryService.delete(id),
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
    <PageLayout title="Ẩm thực" description="Quản lý danh mục ẩm thực">
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
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Loại ẩm thực"
              className="w-40"
            />
            <Select
              value={specialityFilter}
              onValueChange={(v) => {
                setSpecialityFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Đặc sản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả đặc sản</SelectItem>
                <SelectItem value="true">Đặc sản</SelectItem>
                <SelectItem value="false">Không đặc sản</SelectItem>
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
              Thêm ẩm thực
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
              <TableHead>Phân loại</TableHead>
              <TableHead>Đặc sản</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
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
              items.map((item: Culinary) => (
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
                        onClick={(e) => { e.stopPropagation(); openLightbox(parseLink(item.cover_image_url!)) }}
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category || '-'}</TableCell>
                  <TableCell>
                    {item.is_speciality ? (
                      <Badge variant="default">Đặc sản</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
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

      <CulinaryDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        culinaryId={selectedId}
        onEdit={() => { setDetailDialogOpen(false); setFormDialogOpen(true) }}
      />

      <CulinaryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        culinaryId={selectedId}
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
