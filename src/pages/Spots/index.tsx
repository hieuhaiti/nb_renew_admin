import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, spotService, spotCategoryService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type {
  Spot,
  SpotListData,
  SpotFormBody,
  SpotStatus,
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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'
import SpotDetailDialog from './SpotDetailDialog'
import SpotFormDialog from './SpotFormDialog'

const STATUS_LABEL: Record<SpotStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  pending: 'Chờ duyệt',
  closed: 'Đã đóng',
}
const STATUS_CLASS: Record<SpotStatus, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted/40 text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
}
const STATUS_DOT: Record<SpotStatus, string> = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  closed: 'bg-destructive',
}

function formatRatingAvg(value: unknown): string | null {
  if (value == null) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  return num.toFixed(1)
}


export default function SpotPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [provinceCodeFilter, setProvinceCodeFilter] = useState<string>('')
  const [featuredFilter, setFeaturedFilter] = useState<string>('all')
  const [ratingMinFilter, setRatingMinFilter] = useState<string>('')

  const parsedCategoryId =
    categoryFilter !== 'all' ? Number.parseInt(categoryFilter, 10) : Number.NaN
  const parsedRatingMin = ratingMinFilter.trim() ? Number.parseFloat(ratingMinFilter) : Number.NaN
  const trimmedProvinceCode = provinceCodeFilter.trim()

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(statusFilter !== 'all' && { status: statusFilter as SpotStatus }),
    ...(!Number.isNaN(parsedCategoryId) && { category_id: parsedCategoryId }),
    ...(trimmedProvinceCode && { province_code: trimmedProvinceCode }),
    ...(featuredFilter !== 'all' && { is_featured: featuredFilter === 'true' }),
    ...(!Number.isNaN(parsedRatingMin) && { rating_min: parsedRatingMin }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['spots', queryParams],
    () => spotService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as { data?: SpotListData })?.data
  const items = data?.spots ?? []

  const categoryQuery = useApiQuery(
    ['spot-filter-categories'],
    () => spotCategoryService.getAll({ page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_REF },
    false,
    false
  )
  const filterCategories = ((categoryQuery.data as { data?: SpotCategoryListData })?.data?.items ??
    []) as SpotCategory[]

  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Spot | null>(null)

  const createMutation = useApiMutation(
    (payload: SpotFormBody) => spotService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedSpotId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: Partial<SpotFormBody> }) =>
      spotService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedSpotId(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => spotService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const toggleFeaturedMutation = useApiMutation(
    (id: string) => spotService.toggleFeatured(id),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  return (
    <PageLayout title="Điểm tham quan" description="Quản lý điểm tham quan du lịch">
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
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {filterCategories.map((category) => (
                  <SelectItem key={category.id} value={`${category.id}`}>
                    {category.name_vi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={provinceCodeFilter}
              onChange={(e) => {
                setProvinceCodeFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Mã tỉnh"
              className="w-28"
            />
            <Select
              value={featuredFilter}
              onValueChange={(v) => {
                setFeaturedFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Nổi bật" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nổi bật</SelectItem>
                <SelectItem value="true">Nổi bật</SelectItem>
                <SelectItem value="false">Không nổi bật</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={ratingMinFilter}
              onChange={(e) => {
                setRatingMinFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Rating từ"
              className="w-28"
            />
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
                setSelectedSpotId(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm điểm
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
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead>Tên điểm</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead>Đánh giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Nổi bật</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-destructive py-8 text-center">
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
              items.map((item: Spot) => {
                const ratingAvgLabel = formatRatingAvg(item.rating_avg)
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedSpotId(item.id)
                      setDetailDialogOpen(true)
                    }}
                  >
                    <TableCell>
                      {item.primary_image ?? item.primary_image_url ? (
                        <img
                          src={parseLink((item.primary_image ?? item.primary_image_url)!)}
                          alt={item.name ?? item.name_vi}
                          className="h-10 w-10 cursor-zoom-in rounded border object-cover"
                          onClick={(e) => { e.stopPropagation(); openLightbox(parseLink((item.primary_image ?? item.primary_image_url)!)) }}
                        />
                      ) : (
                        <div className="bg-muted h-10 w-10 rounded border" />
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.name ?? item.name_vi}</p>
                      {item.category_name && (
                        <p className="text-muted-foreground text-xs">{item.category_name}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-32 text-sm">
                      <span className="line-clamp-2">{item.address ?? item.address_vi ?? '-'}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {ratingAvgLabel != null ? (
                        <span className="text-warning flex items-center gap-1">
                          <Star className="size-3" />
                          {ratingAvgLabel}
                          <span className="text-muted-foreground">({item.rating_count})</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusDotBadge
                        label={STATUS_LABEL[item.status]}
                        badgeClass={STATUS_CLASS[item.status]}
                        dotClass={STATUS_DOT[item.status]}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={item.is_featured}
                        disabled={toggleFeaturedMutation.isPending}
                        onCheckedChange={(checked) => {
                          const nextValue = Boolean(checked)
                          if (nextValue !== item.is_featured) toggleFeaturedMutation.mutate(item.id)
                        }}
                        aria-label={`Featured: ${item.name ?? item.name_vi}`}
                        onClick={(e) => e.stopPropagation()}
                      />
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
                            setSelectedSpotId(item.id)
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
                )
              })
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <SpotDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        spotId={selectedSpotId}
        onEdit={() => {
          setDetailDialogOpen(false)
          setFormDialogOpen(true)
        }}
      />

      <SpotFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        spotId={selectedSpotId}
        onSubmit={(payload) => {
          if (selectedSpotId) {
            updateMutation.mutate({ id: selectedSpotId, data: payload })
          } else {
            createMutation.mutate(payload as SpotFormBody)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{itemToDelete?.name ?? itemToDelete?.name_vi}&quot;?
              Hành động này không thể hoàn tác.
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
