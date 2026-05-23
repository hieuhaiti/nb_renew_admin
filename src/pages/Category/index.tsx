import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, spotCategoryService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type {
  SpotCategory,
  SpotCategoryListData,
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
import { Eye, EyeOff, Pen, Trash2, Plus } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { parseLink, hexToRgba } from '@/lib/utils'
import CategoryDetailDialog from './CategoryDetailDialog'
import CategoryFormDialog from './CategoryFormDialog'
import { STALE_REF } from '@/constant/queryConstant'

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
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['spot-categories', queryParams],
    () => spotCategoryService.getAll(queryParams),
    { staleTime: STALE_REF },
    false,
    false
  )

  const data = (dbQuery.data as { data?: SpotCategoryListData })?.data
  const categories = (data?.items ?? []) as SpotCategory[]
  const pagination = (data?.pagination ?? {}) as Partial<Pagination> & {
    total_pages?: number
    pages?: number
  }
  const lastTotalPagesRef = useRef<number | null>(null)
  const totalPagesFromApi = Number(
    pagination?.totalPages ?? pagination?.total_pages ?? pagination?.pages
  )
  if (Number.isFinite(totalPagesFromApi) && totalPagesFromApi > 0) {
    lastTotalPagesRef.current = totalPagesFromApi
  }
  const totalPages = lastTotalPagesRef.current ?? 1
  const total = Number(pagination?.total ?? 0)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<SpotCategory | null>(null)

  const createMutation = useApiMutation(
    (payload: FormData) => spotCategoryService.create(payload),
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
    (payload: { id: number; data: FormData }) =>
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
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
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
              <TableHead className="w-28">Code</TableHead>
              <TableHead className="w-14">Icon</TableHead>
              <TableHead>Tên (VI)</TableHead>
              <TableHead>Tên (EN)</TableHead>
              <TableHead>Danh mục cha</TableHead>
              <TableHead className="w-16">Màu</TableHead>
              <TableHead className="w-20">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-destructive py-8 text-center">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
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
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{category.code}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: hexToRgba(category.color_hex ?? '#94a3b8', 0.15) }}
                    >
                      {category.icon_url ? (
                        <img
                          src={parseLink(category.icon_url)}
                          alt=""
                          className="h-5 w-5 cursor-zoom-in object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                          onClick={(e) => { e.stopPropagation(); openLightbox(parseLink(category.icon_url!)) }}
                        />
                      ) : (
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: category.color_hex ?? '#94a3b8' }}
                        />
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-48 font-medium">
                    <span className="line-clamp-1">{category.name_vi}</span>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="text-muted-foreground line-clamp-1">
                      {category.name_en || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-40">
                    <span className="text-muted-foreground line-clamp-1">
                      {category.parent_name_vi || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {category.color_hex ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="border-border inline-block h-4 w-4 rounded border"
                          style={{ backgroundColor: category.color_hex }}
                        />
                        <span className="text-muted-foreground font-mono text-xs">
                          {category.color_hex}
                        </span>
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
        onEdit={() => { setDetailDialogOpen(false); setFormDialogOpen(true) }}
      />

      <CategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        categoryId={selectedCategoryId}
        onSubmit={(data) => {
          if (selectedCategoryId) {
            updateMutation.mutate({ id: selectedCategoryId, data })
          } else {
            createMutation.mutate(data)
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
