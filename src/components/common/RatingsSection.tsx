import { useState } from 'react'
import { ratingService, useApiQuery, useApiMutation } from '@/service'
import type { ApiResponse, Rating, RatingListData, RatingStatus } from '@/types/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { UserCell } from '@/components/common/UserCell'
import { formatDate } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
import { Check, Pen, Trash2, X } from 'lucide-react'
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
import RatingDetailDialog from '@/pages/Ratings/RatingDetailDialog'
import RatingFormDialog from '@/pages/Ratings/RatingFormDialog'

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

interface RatingsSectionProps {
  targetType: 'spot' | 'business'
  targetId: string
  enabled: boolean
}

export default function RatingsSection({ targetType, targetId, enabled }: RatingsSectionProps) {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ratingToDelete, setRatingToDelete] = useState<Rating | null>(null)

  const queryParams = {
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(targetType === 'spot' ? { spot_id: targetId } : { business_id: targetId }),
  }

  const dbQuery = useApiQuery(
    ['ratings-section', targetType, targetId],
    () => ratingService.getAll(queryParams),
    { enabled: enabled && !!targetId, staleTime: STALE_HOT },
    false,
    false
  )

  const ratings: Rating[] = (dbQuery.data as ApiResponse<RatingListData>)?.data?.ratings ?? []
  const total = (dbQuery.data as ApiResponse<RatingListData>)?.data?.pagination?.total ?? 0

  const statusMutation = useApiMutation(
    (payload: { id: string; status: RatingStatus }) =>
      ratingService.setStatus(payload.id, { status: payload.status }),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const replyMutation = useApiMutation(
    (payload: { id: string; reply: string }) => ratingService.reply(payload.id, payload.reply),
    {
      onSuccess: () => {
        setFormOpen(false)
        dbQuery.refetch()
      },
    },
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

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          Đánh giá {dbQuery.isLoading ? '' : `(${total})`}
        </span>
        {!dbQuery.isLoading && (
          <Button size="sm" variant="ghost" onClick={() => dbQuery.refetch()} className="h-7 px-2 text-xs">
            Làm mới
          </Button>
        )}
      </div>

      {dbQuery.isLoading ? (
        <div className="text-muted-foreground text-sm">Đang tải...</div>
      ) : ratings.length === 0 ? (
        <div className="text-muted-foreground text-sm">Chưa có đánh giá</div>
      ) : (
        <div className="rounded border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung</TableHead>
                <TableHead className="w-16">Sao</TableHead>
                <TableHead className="w-32">Người dùng</TableHead>
                <TableHead className="w-28">Trạng thái</TableHead>
                <TableHead className="w-24">Ngày tạo</TableHead>
                <TableHead className="w-28 text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratings.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedRating(r)
                    setDetailOpen(true)
                  }}
                >
                  <TableCell className="max-w-48">
                    {r.title && <p className="font-medium text-sm truncate">{r.title}</p>}
                    {r.content && (
                      <p className="text-muted-foreground line-clamp-1 text-xs">{r.content}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-warning text-sm">{STARS[r.stars - 1]}</TableCell>
                  <TableCell>
                    <UserCell userId={r.user_id} inlineUser={r.user} />
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[r.status]}
                      badgeClass={STATUS_CLASS[r.status]}
                      dotClass={STATUS_DOT[r.status]}
                    />
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.created_at ? formatDate(r.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRating(r)
                          setFormOpen(true)
                        }}
                        title="Kiểm duyệt / Phản hồi"
                      >
                        <Pen className="size-3.5" />
                      </Button>
                      {r.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              statusMutation.mutate({ id: r.id, status: 'published' })
                            }}
                            title="Xuất bản"
                          >
                            <Check className="text-success size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              statusMutation.mutate({ id: r.id, status: 'rejected' })
                            }}
                            title="Từ chối"
                          >
                            <X className="text-destructive size-3.5" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRatingToDelete(r)
                          setDeleteDialogOpen(true)
                        }}
                        title="Xóa"
                      >
                        <Trash2 className="text-destructive size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RatingDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        rating={selectedRating}
        onEdit={() => {
          setDetailOpen(false)
          setFormOpen(true)
        }}
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
    </div>
  )
}
