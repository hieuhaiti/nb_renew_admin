import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, spotCategoryService } from '@/service'
import type { ApiResponse, SpotCategory, SpotCategoryListData, SpotCategoryFormBody, Pagination } from '@/types/api'
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
import { Eye, EyeOff, Pen, Trash2, Plus } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import CategoryDetailDialog from './CategoryDetailDialog'
import CategoryFormDialog from './CategoryFormDialog'
import { formatDate } from '@/lib/date'

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

export default function SpotCategoryPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'sort_order',
    sortOrder: 'ASC' as const,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== 'all' && { is_active: statusFilter === 'true' }),
  }

  const dbQuery = useApiQuery(
    ['spot-categories', queryParams],
    () => spotCategoryService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<SpotCategoryListData>)?.data
  const categories = data?.categories ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<SpotCategory | null>(null)

  const createMutation = useApiMutation(
    (payload: SpotCategoryFormBody) => spotCategoryService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedCategoryId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: Partial<SpotCategoryFormBody> }) =>
      spotCategoryService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedCategoryId(null)
      },
    },
    true
  )

  const toggleMutation = useApiMutation(
    (id: number) => spotCategoryService.toggle(id),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => spotCategoryService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
      },
    },
    true
  )

  return (
    <PageLayout title="Danh mục điểm du lịch" description="Quản lý danh mục điểm du lịch">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
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
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Ngừng</SelectItem>
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
                setSelectedCategoryId(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm danh mục
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
              <TableHead className="w-28">Code</TableHead>
              <TableHead>Tên (VI)</TableHead>
              <TableHead>Tên (EN)</TableHead>
              <TableHead className="w-16">Màu</TableHead>
              <TableHead className="w-20">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category: SpotCategory) => (
                <TableRow
                  className="hover:cursor-pointer"
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>{category.id}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{category.code}</span>
                  </TableCell>
                  <TableCell className="max-w-48 font-medium">
                    <span className="line-clamp-1">{category.name_vi}</span>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="text-muted-foreground line-clamp-1">{category.name_en || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {category.color_hex ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="border-border inline-block h-4 w-4 rounded border"
                          style={{ backgroundColor: category.color_hex }}
                        />
                        <span className="text-muted-foreground font-mono text-xs">{category.color_hex}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{category.sort_order}</TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(category.is_active)]}
                      badgeClass={ACTIVE_CLASS[String(category.is_active)]}
                      dotClass={ACTIVE_DOT[String(category.is_active)]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {category.created_at ? formatDate(category.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategoryId(category.id)
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
                          toggleMutation.mutate(category.id)
                        }}
                        title={category.is_active ? 'Ngừng hoạt động' : 'Kích hoạt'}
                      >
                        {category.is_active ? (
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
                          setCategoryToDelete(category)
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

      <CategoryDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        categoryId={selectedCategoryId}
      />

      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        categoryId={selectedCategoryId}
        onSubmit={(data) => {
          if (selectedCategoryId) {
            updateMutation.mutate({ id: selectedCategoryId, data })
          } else {
            createMutation.mutate(data as SpotCategoryFormBody)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục &quot;{categoryToDelete?.name_vi}&quot;? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
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
