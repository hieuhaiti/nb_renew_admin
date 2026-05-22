import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, citizenFeedbackService } from '@/service'
import type {
  ApiResponse,
  CitizenFeedback,
  CitizenFeedbackListData,
  FeedbackStatus,
  FeedbackPriority,
  ModerationStatus,
  UpdateFeedbackStatusBody,
  UpdateModerationBody,
  Pagination,
} from '@/types/api'
import { UserCell } from '@/components/common/UserCell'
import {
  PRIORITY_LABEL,
  PRIORITY_CLASS,
  PRIORITY_DOT,
  STATUS_LABEL,
  STATUS_CLASS,
  STATUS_DOT,
  MOD_LABEL,
  MOD_CLASS,
  MOD_DOT,
} from '@/constant/feedbackConstant'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
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
import { ClipboardEdit, Trash2, MapPin } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import FeedbackDetailDialog from './FeedbackDetailDialog'
import FeedbackUpdateDialog from './FeedbackUpdateDialog'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { formatDate } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'

export default function FeedbackPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | 'all'>('all')
  const [filterModeration, setFilterModeration] = useState<ModerationStatus | 'all'>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    ...(filterStatus !== 'all' && { status: filterStatus }),
    ...(filterPriority !== 'all' && { priority: filterPriority }),
    ...(filterModeration !== 'all' && { moderation_status: filterModeration }),
  }

  const dbQuery = useApiQuery(
    ['feedbacks', queryParams],
    () => citizenFeedbackService.getAll(queryParams),
    { staleTime: STALE_HOT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<CitizenFeedbackListData>)?.data
  const feedbacks = data?.items ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>

  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // Dialog states
  const [selectedFeedback, setSelectedFeedback] = useState<CitizenFeedback | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CitizenFeedback | null>(null)

  const statusMutation = useApiMutation(
    (args: { id: string; data: UpdateFeedbackStatusBody }) =>
      citizenFeedbackService.updateStatus(args.id, args.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setUpdateDialogOpen(false)
        setSelectedFeedback(null)
      },
    },
    true
  )

  const moderationMutation = useApiMutation(
    (args: { id: string; data: UpdateModerationBody }) =>
      citizenFeedbackService.updateModeration(args.id, args.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setUpdateDialogOpen(false)
        setSelectedFeedback(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => citizenFeedbackService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  function openDetails(item: CitizenFeedback) {
    setSelectedFeedback(item)
    setDetailDialogOpen(true)
  }

  function openUpdateDialog(item: CitizenFeedback) {
    setSelectedFeedback(item)
    setUpdateDialogOpen(true)
  }

  function openDeleteDialog(item: CitizenFeedback) {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  return (
    <PageLayout title="Phản ánh người dân" description="Quản lý và xử lý phản ánh từ người dân">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter status */}
            <Select
              value={filterStatus}
              onValueChange={(v) => {
                setFilterStatus(v as FeedbackStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả TT</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="in_progress">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã xử lý</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="closed">Đóng</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter priority */}
            <Select
              value={filterPriority}
              onValueChange={(v) => {
                setFilterPriority(v as FeedbackPriority | 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả UT</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="critical">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter moderation */}
            <Select
              value={filterModeration}
              onValueChange={(v) => {
                setFilterModeration(v as ModerationStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Kiểm duyệt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả KD</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Limit */}
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
              <TableHead className="w-80">ID</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-24">Ưu tiên</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-24">Kiểm duyệt</TableHead>
              <TableHead className="w-36">Người gửi</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedbacks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              feedbacks.map((item: CitizenFeedback) => (
                <TableRow
                  key={item.id}
                  className="hover:cursor-pointer"
                  onClick={() => openDetails(item)}
                >
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <div className="max-w-64">
                      <p className="line-clamp-2 font-medium">{item.title}</p>
                      {item.location_text && (
                        <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                          <MapPin className="size-3" />
                          <span className="line-clamp-1">{item.location_text}</span>
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={PRIORITY_LABEL[item.priority] ?? item.priority}
                      badgeClass={
                        PRIORITY_CLASS[item.priority] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                      }
                      dotClass={PRIORITY_DOT[item.priority] ?? 'bg-gray-400'}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[item.status] ?? item.status}
                      badgeClass={
                        STATUS_CLASS[item.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                      }
                      dotClass={STATUS_DOT[item.status] ?? 'bg-gray-400'}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={MOD_LABEL[item.moderation_status] ?? item.moderation_status}
                      badgeClass={
                        MOD_CLASS[item.moderation_status] ??
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }
                      dotClass={MOD_DOT[item.moderation_status] ?? 'bg-gray-400'}
                    />
                  </TableCell>
                  <TableCell>
                    <UserCell inlineUser={item.user_name} />
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
                          openUpdateDialog(item)
                        }}
                        title="Cập nhật xử lý"
                      >
                        <ClipboardEdit className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(item)
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

      <FeedbackDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        feedbackId={selectedFeedback?.id ?? null}
      />

      <FeedbackUpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        feedback={selectedFeedback}
        onUpdateStatus={(data) => {
          if (selectedFeedback) {
            const { moderation_status, ...statusData } = data
            statusMutation.mutate({ id: selectedFeedback.id, data: statusData })
            if (selectedFeedback.moderation_status === 'pending') {
              moderationMutation.mutate({
                id: selectedFeedback.id,
                data: { moderation_status, admin_response: data.admin_response },
              })
            }
          }
        }}
        onUpdateModeration={(data) => {
          if (selectedFeedback?.moderation_status === 'pending') {
            moderationMutation.mutate({ id: selectedFeedback.id, data })
          }
        }}
        isLoading={statusMutation.isPending || moderationMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phản ánh &quot;{itemToDelete?.title}&quot;? Hành động này
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
