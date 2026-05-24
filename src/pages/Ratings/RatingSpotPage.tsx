import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, ratingService, spotService } from '@/service'
import { SearchSelect } from '@/components/common/SearchSelect'
import type {
  ApiResponse,
  Rating,
  RatingListData,
  RatingStatus,
  Pagination,
  Spot,
  SpotListData,
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
import { Check, Pen, X, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { UserCell } from '@/components/common/UserCell'
import { formatDate } from '@/lib/date'
import { STALE_HOT, STALE_REF } from '@/constant/queryConstant'
import RatingDetailDialog from './RatingDetailDialog'
import RatingFormDialog from './RatingFormDialog'

const STATUS_LABEL: Record<RatingStatus, string> = {
  pending: 'Chờ duyệt',
  published: 'Đã xuất bản',
  rejected: 'Từ chối',
}
const STATUS_CLASS: Record<RatingStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}
const STATUS_DOT: Record<RatingStatus, string> = {
  pending: 'bg-warning',
  published: 'bg-success',
  rejected: 'bg-destructive',
}

const STARS = ['★', '★★', '★★★', '★★★★', '★★★★★']

export default function RatingSpotPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [spotId, setSpotId] = useState<string>('')

  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ratingToDelete, setRatingToDelete] = useState<Rating | null>(null)

  const spotQuery = useApiQuery(
    ['rating-spot-targets'],
    () => spotService.getAll({ page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_REF },
    false,
    false
  )

  const spots = ((spotQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []) as Spot[]
  const spotOptions = spots.map((s) => ({ id: s.id, label: s.name_vi || s.slug || s.id }))

  useEffect(() => {
    if (spotOptions.length === 0) {
      if (spotId) setSpotId('')
      return
    }
    if (!spotOptions.some((opt) => opt.id === spotId)) setSpotId(spotOptions[0].id)
  }, [spotId, spotOptions])

  const hasSpotId = Boolean(spotId)

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(hasSpotId && { spot_id: spotId }),
    ...(statusFilter !== 'all' && { status: statusFilter as RatingStatus }),
  }

  const dbQuery = useApiQuery(
    ['ratings-spots', queryParams],
    () => ratingService.getAll(queryParams),
    { enabled: hasSpotId, staleTime: STALE_HOT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<RatingListData>)?.data
  const allRatings = data?.ratings ?? []
  const ratings = searchValue
    ? allRatings.filter(
        (r: Rating) =>
          r.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
          r.content?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : allRatings
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const statusMutation = useApiMutation(
    (payload: { id: string; status: RatingStatus }) =>
      ratingService.setStatus(payload.id, { status: payload.status }),
    { onSuccess: () => { setFormOpen(false); dbQuery.refetch() } },
    true
  )

  const replyMutation = useApiMutation(
    (payload: { id: string; reply: string }) => ratingService.reply(payload.id, payload.reply),
    { onSuccess: () => { setFormOpen(false); dbQuery.refetch() } },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => ratingService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setRatingToDelete(null)
      },
    },
    true
  )

  function openDetail(r: Rating) {
    setSelectedRating(r)
    setDetailOpen(true)
  }

  function openForm(r: Rating) {
    setSelectedRating(r)
    setFormOpen(true)
  }

  return (
    <PageLayout title="Đánh giá điểm du lịch" description="Quản lý đánh giá các điểm tham quan">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => { setSearchValue(v); setCurrentPage(1) }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={hasSpotId ? () => dbQuery.refetch() : undefined}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <SearchSelect
              options={spotOptions.map((o) => ({ value: o.id, label: o.label }))}
              value={spotId}
              onValueChange={(v) => { setSpotId(v); setCurrentPage(1) }}
              placeholder="Chọn điểm du lịch"
              className="w-64"
            />

            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
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
              <TableHead className="w-48">ID</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="w-20">Sao</TableHead>
              <TableHead className="w-36">Người đánh giá</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-36 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasSpotId ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Vui lòng chọn điểm du lịch để xem đánh giá
                </TableCell>
              </TableRow>
            ) : ratings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              ratings.map((r: Rating) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{r.id}</span>
                  </TableCell>
                  <TableCell className="max-w-64">
                    {r.title && <p className="font-medium">{r.title}</p>}
                    {r.content && (
                      <p className="text-muted-foreground line-clamp-1 text-sm">{r.content}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-warning text-sm">{STARS[r.stars - 1]}</TableCell>
                  <TableCell>
                    <UserCell userId={r.user_id} inlineUser={r.user ? { ...r.user, id: String(r.user.id) } : undefined} />
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[r.status]}
                      badgeClass={STATUS_CLASS[r.status]}
                      dotClass={STATUS_DOT[r.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.created_at ? formatDate(r.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); openForm(r) }}
                        title="Kiểm duyệt / Phản hồi"
                      >
                        <Pen className="size-4" />
                      </Button>
                      {r.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost" size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              statusMutation.mutate({ id: r.id, status: 'published' })
                            }}
                            title="Xuất bản"
                          >
                            <Check className="text-success size-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              statusMutation.mutate({ id: r.id, status: 'rejected' })
                            }}
                            title="Từ chối"
                          >
                            <X className="text-destructive size-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRatingToDelete(r)
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

      <RatingDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        rating={selectedRating}
        onEdit={() => { setDetailOpen(false); setFormOpen(true) }}
      />

      <RatingFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        rating={selectedRating}
        onUpdateStatus={(data) =>
          selectedRating && statusMutation.mutate({ id: selectedRating.id, status: data.status })
        }
        onReply={(reply) =>
          selectedRating && replyMutation.mutate({ id: selectedRating.id, reply })
        }
        isLoading={statusMutation.isPending || replyMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ratingToDelete && deleteMutation.mutate(ratingToDelete.id)}
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
