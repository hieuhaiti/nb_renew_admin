import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, newsCommentService } from '@/service'
import type { ApiResponse, NewsComment, NewsCommentListData, Pagination } from '@/types/api'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { MessagesSquare, Search, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { UserCell } from '@/components/common/UserCell'
import NewsCommentDetailDialog from './NewsCommentDetailDialog'
import NewsCommentFormDialog from './NewsCommentFormDialog'
import { formatDate } from '@/lib/date'
import { STALE_HOT } from '@/constant/queryConstant'

const APPROVED_LABEL: Record<string, string> = {
  true: 'Đã duyệt',
  false: 'Chờ duyệt',
}
const APPROVED_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-warning/10 text-warning border-warning/20',
}
const APPROVED_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-warning',
}

export default function NewsComments(): JSX.Element {
  const [newsIdInput, setNewsIdInput] = useState<string>('')
  const [activeNewsId, setActiveNewsId] = useState<string>('')
  const [searchValue, setSearchValue] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [approvedFilter, setApprovedFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at' as const,
    sortOrder: 'DESC' as const,
    ...(approvedFilter !== 'all' && { is_approved: approvedFilter === 'true' }),
  }

  const dbQuery = useApiQuery(
    ['news-comments', activeNewsId, queryParams],
    () => newsCommentService.getByNewsId(activeNewsId, queryParams),
    { enabled: !!activeNewsId, staleTime: STALE_HOT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<NewsCommentListData>)?.data
  const allComments = data?.comments ?? []
  const comments = searchValue
    ? allComments.filter((c: NewsComment) =>
        c.content?.toLowerCase().includes(searchValue.toLowerCase()) ||
        c.user_name?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : allComments
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedComment, setSelectedComment] = useState<NewsComment | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<NewsComment | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [commentToReply, setCommentToReply] = useState<NewsComment | null>(null)

  const setApprovalMutation = useApiMutation(
    (payload: { newsId: string; commentId: string; is_approved: boolean }) =>
      newsCommentService.setApproval(payload.newsId, payload.commentId, payload.is_approved),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const deleteMutation = useApiMutation(
    (payload: { newsId: string; commentId: string }) =>
      newsCommentService.delete(payload.newsId, payload.commentId),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setCommentToDelete(null)
      },
    },
    true
  )

  function handleSearch() {
    if (newsIdInput.trim()) {
      setActiveNewsId(newsIdInput.trim())
      setCurrentPage(1)
    }
  }

  return (
    <PageLayout title="Bình luận tin tức" description="Quản lý bình luận theo bài viết">
      <div className="mb-4 flex items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder="Nhập ID bài viết..."
          value={newsIdInput}
          onChange={(e) => setNewsIdInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="outline" onClick={handleSearch}>
          <Search className="mr-1 size-4" />
          Xem bình luận
        </Button>
        {activeNewsId && (
          <span className="text-muted-foreground text-sm">
            Bài viết: <span className="font-mono">{activeNewsId}</span>
          </span>
        )}
      </div>

      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={activeNewsId ? () => dbQuery.refetch() : undefined}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select
              value={approvedFilter}
              onValueChange={(v) => {
                setApprovedFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="false">Chờ duyệt</SelectItem>
                <SelectItem value="true">Đã duyệt</SelectItem>
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
              <TableHead>Người bình luận</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!activeNewsId ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Nhập ID bài viết để xem bình luận
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có bình luận
                </TableCell>
              </TableRow>
            ) : (
              comments.map((c: NewsComment) => (
                <TableRow
                  className="hover:cursor-pointer"
                  key={c.id}
                  onClick={() => {
                    setSelectedComment(c)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{c.id}</span>
                  </TableCell>
                  <TableCell>
                    <UserCell userId={c.user_id} inlineUser={c.user ?? c.user_name} />
                  </TableCell>
                  <TableCell className="max-w-64">
                    <span className="line-clamp-2 text-sm">{c.content}</span>
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={APPROVED_LABEL[String(c.is_approved)]}
                      badgeClass={APPROVED_CLASS[String(c.is_approved)]}
                      dotClass={APPROVED_DOT[String(c.is_approved)]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.created_at ? formatDate(c.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!c.is_approved && (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={setApprovalMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            setApprovalMutation.mutate({
                              newsId: c.news_id,
                              commentId: c.id,
                              is_approved: true,
                            })
                          }}
                          title="Duyệt bình luận"
                        >
                          Duyệt
                        </Button>
                      )}
                      {!c.parent_comment_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCommentToReply(c)
                            setFormDialogOpen(true)
                          }}
                          title="Trả lời bình luận"
                        >
                          <MessagesSquare className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCommentToDelete(c)
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

      <NewsCommentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        parentComment={commentToReply}
        onSuccess={() => {
          dbQuery.refetch()
          setCommentToReply(null)
        }}
      />

      <NewsCommentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        comment={selectedComment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bình luận này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                commentToDelete &&
                deleteMutation.mutate({
                  newsId: commentToDelete.news_id,
                  commentId: commentToDelete.id,
                })
              }
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
