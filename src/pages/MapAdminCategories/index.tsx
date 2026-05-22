import type { JSX } from 'react'
import { useState } from 'react'
import { mapAdminCategoryService, useApiMutation, useApiQuery } from '@/service'
import type { ApiResponse, MapAdminCategory, MapAdminCategoryListData } from '@/types/api'
import type { MapAdminCategoryFormBody } from '@/service/mapAdminCategoryService'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { STALE_REF } from '@/constant/queryConstant'
import MapAdminCategoryFormDialog from './MapAdminCategoryFormDialog'
import MapAdminCategoryDetailDialog from './MapAdminCategoryDetailDialog'

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

export default function MapAdminCategoriesPage(): JSX.Element {
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const queryParams = {
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== 'all' && { is_active: statusFilter === 'true' }),
  }

  const dbQuery = useApiQuery(
    ['map-admin-categories', queryParams],
    () => mapAdminCategoryService.getAll(queryParams),
    { staleTime: STALE_REF },
    false,
    false
  )

  const categories =
    ((dbQuery.data as ApiResponse<MapAdminCategoryListData>)?.data?.categories ?? []) as MapAdminCategory[]

  const [selectedCategory, setSelectedCategory] = useState<MapAdminCategory | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<MapAdminCategory | null>(null)

  const createMutation = useApiMutation(
    (payload: MapAdminCategoryFormBody) => mapAdminCategoryService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedCategory(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: Partial<MapAdminCategoryFormBody> }) =>
      mapAdminCategoryService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedCategory(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => mapAdminCategoryService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  function handleFormSubmit(payload: MapAdminCategoryFormBody) {
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <PageLayout title="Danh mục bản đồ" description="Quản lý danh mục phân loại lớp bản đồ">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => setSearchValue(v)}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Ngừng</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              onClick={() => {
                setSelectedCategory(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm danh mục
            </Button>
          </div>
        }
        total={categories.length}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên danh mục</TableHead>
              <TableHead className="max-w-64">Mô tả</TableHead>
              <TableHead className="w-20 text-right">Thứ tự</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
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
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow
                  key={cat.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(cat)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>{cat.id}</TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-64 text-sm">
                    <span className="line-clamp-2">{cat.description ?? '-'}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {cat.sort_order ?? '-'}
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(cat.is_active)]}
                      badgeClass={ACTIVE_CLASS[String(cat.is_active)]}
                      dotClass={ACTIVE_DOT[String(cat.is_active)]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {cat.created_at ? formatDate(cat.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCategory(cat)
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
                          setItemToDelete(cat)
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

      <MapAdminCategoryDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        category={selectedCategory}
      />

      <MapAdminCategoryFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        category={selectedCategory}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục &quot;{itemToDelete?.name}&quot;? Hành động này
              không thể hoàn tác.
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
