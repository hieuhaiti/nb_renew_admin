import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, ratingService } from '@/service'
import type { ApiResponse, Rating, RatingListData, RatingStatus } from '@/types/api'
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
import { Pen } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { UserCell } from '@/components/common/UserCell'
import { formatDate } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'
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

export default function RatingMyBusinessPage(): JSX.Element {
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [selectedRating, setSelectedRating] = useState<Rating | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const dbQuery = useApiQuery(
    ['ratings-my-business'],
    () => ratingService.getMyBusiness(),
    { staleTime: STALE_HOT },
    false,
    false
  )

  const allRatings: Rating[] =
    (dbQuery.data as ApiResponse<RatingListData>)?.data?.ratings ?? []

  const ratings = allRatings.filter((r) => {
    const matchSearch =
      !searchValue ||
      r.title?.toLowerCase().includes(searchValue.toLowerCase()) ||
      r.content?.toLowerCase().includes(searchValue.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const total = allRatings.length

  const replyMutation = useApiMutation(
    (payload: { id: string; reply: string }) => ratingService.reply(payload.id, payload.reply),
    { onSuccess: () => { setFormOpen(false); dbQuery.refetch() } },
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
    <PageLayout
      title="Đánh giá doanh nghiệp của tôi"
      description="Xem và phản hồi đánh giá từ khách hàng"
    >
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          </div>
        }
        total={total}
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
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ratings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  {dbQuery.isLoading ? 'Đang tải...' : 'Chưa có đánh giá nào'}
                </TableCell>
              </TableRow>
            ) : (
              ratings.map((r) => (
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
                    <UserCell userId={r.user_id} inlineUser={r.user} />
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
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); openForm(r) }}
                      title="Phản hồi đánh giá"
                    >
                      <Pen className="size-4" />
                    </Button>
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
        onUpdateStatus={() => {}}
        onReply={(reply) =>
          selectedRating && replyMutation.mutate({ id: selectedRating.id, reply })
        }
        isLoading={replyMutation.isPending}
        hideStatusTab
      />
    </PageLayout>
  )
}
