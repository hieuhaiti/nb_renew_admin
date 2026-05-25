import { type JSX, Fragment } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, newsCommentService, newsService } from '@/service'
import type {
  ApiResponse,
  News,
  NewsComment,
  NewsCommentListData,
  NewsListData,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronDown, MessagesSquare, Pen, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { UserCell } from '@/components/common/UserCell'
import NewsCommentDetailDialog from './NewsCommentDetailDialog'
import NewsCommentFormDialog from './NewsCommentFormDialog'
import { formatDate } from '@/lib/date'
import { STALE_HOT, STALE_DEFAULT } from '@/constant/queryConstant'
import { cn } from '@/lib/utils'

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
  // ── News picker ────────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')
  const [activeNewsId, setActiveNewsId] = useState<string>('')
  const [activeNewsTitle, setActiveNewsTitle] = useState<string>('')

  const newsListQuery = useApiQuery(
    ['news-picker'],
    () => newsService.getAllAdmin({ limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const allNews: News[] = (newsListQuery.data as ApiResponse<NewsListData>)?.data?.items ?? []
  const filteredNews = pickerSearch.trim()
    ? allNews.filter((n) => n.title.toLowerCase().includes(pickerSearch.toLowerCase()))
    : allNews

  // ── Comments query ─────────────────────────────────────────────────────────
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
  const allComments = data?.items ?? []
  const comments = searchValue
    ? allComments.filter(
        (c: NewsComment) =>
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

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [selectedComment, setSelectedComment] = useState<NewsComment | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [commentToEdit, setCommentToEdit] = useState<NewsComment | null>(null)
  const [commentToReply, setCommentToReply] = useState<NewsComment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<NewsComment | null>(null)

  // ── Mutations ──────────────────────────────────────────────────────────────
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

  function selectNews(news: News) {
    setActiveNewsId(news.id)
    setActiveNewsTitle(news.title)
    setPickerOpen(false)
    setPickerSearch('')
    setCurrentPage(1)
  }

  function openEdit(c: NewsComment) {
    setCommentToEdit(c)
    setCommentToReply(null)
    setFormDialogOpen(true)
  }

  function openReply(c: NewsComment) {
    setCommentToReply(c)
    setCommentToEdit(null)
    setFormDialogOpen(true)
  }

  return (
    <PageLayout title="Bình luận tin tức" description="Quản lý bình luận theo bài viết">
      {/* ── News picker ── */}
      <div className="mb-4">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={pickerOpen}
              className="w-full max-w-lg justify-between"
            >
              <span className={cn('truncate', !activeNewsTitle && 'text-muted-foreground')}>
                {activeNewsTitle || 'Chọn bài viết để xem bình luận...'}
              </span>
              <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
            <div className="p-2">
              <Input
                placeholder="Tìm tiêu đề bài viết..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {newsListQuery.isLoading ? (
                <p className="text-muted-foreground p-3 text-center text-sm">Đang tải...</p>
              ) : filteredNews.length === 0 ? (
                <p className="text-muted-foreground p-3 text-center text-sm">Không tìm thấy</p>
              ) : (
                filteredNews.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={cn(
                      'hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                      activeNewsId === n.id && 'bg-accent'
                    )}
                    onClick={() => selectNews(n)}
                  >
                    <Check
                      className={cn(
                        'mt-0.5 size-4 shrink-0',
                        activeNewsId === n.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="line-clamp-2">{n.title}</span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
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
              <TableHead>Người bình luận</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-36 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!activeNewsId ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Chọn bài viết ở trên để xem bình luận
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Không có bình luận
                </TableCell>
              </TableRow>
            ) : (
              comments.map((c: NewsComment) => (
                <Fragment key={c.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedComment(c)
                      setDetailDialogOpen(true)
                    }}
                  >
                    <TableCell>
                      <UserCell userId={c.user_id} inlineUser={c.user ?? c.user_name} />
                    </TableCell>
                    <TableCell className="max-w-80">
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
                            variant="ghost"
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
                            title="Duyệt"
                          >
                            <Check className="text-success size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(c)
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
                            openReply(c)
                          }}
                          title="Trả lời"
                        >
                          <MessagesSquare className="size-4" />
                        </Button>
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

                  {c.replies?.map((reply) => (
                    <TableRow
                      key={reply.id}
                      className="bg-muted/40 cursor-pointer"
                      onClick={() => {
                        setSelectedComment(reply)
                        setDetailDialogOpen(true)
                      }}
                    >
                      <TableCell>
                        <div className="border-muted-foreground/30 ml-3 flex items-start gap-2 border-l-2 pl-3">
                          <MessagesSquare className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                          <UserCell
                            userId={reply.user_id}
                            inlineUser={reply.user ?? reply.author_full_name ?? reply.user_name}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="max-w-80">
                        <span className="line-clamp-2 text-sm">{reply.content}</span>
                      </TableCell>
                      <TableCell>
                        <StatusDotBadge
                          label={APPROVED_LABEL[String(reply.is_approved)]}
                          badgeClass={APPROVED_CLASS[String(reply.is_approved)]}
                          dotClass={APPROVED_DOT[String(reply.is_approved)]}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {reply.created_at ? formatDate(reply.created_at) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!reply.is_approved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={setApprovalMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation()
                                setApprovalMutation.mutate({
                                  newsId: reply.news_id,
                                  commentId: reply.id,
                                  is_approved: true,
                                })
                              }}
                              title="Duyệt"
                            >
                              <Check className="text-success size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(reply)
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
                              setCommentToDelete(reply)
                              setDeleteDialogOpen(true)
                            }}
                            title="Xóa"
                          >
                            <Trash2 className="text-destructive size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <NewsCommentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        comment={selectedComment}
        onEdit={() => {
          setDetailDialogOpen(false)
          if (selectedComment) openEdit(selectedComment)
        }}
      />

      <NewsCommentFormDialog
        open={formDialogOpen}
        onOpenChange={(v) => {
          setFormDialogOpen(v)
          if (!v) {
            setCommentToEdit(null)
            setCommentToReply(null)
          }
        }}
        comment={commentToEdit}
        parentComment={commentToReply}
        onSuccess={() => dbQuery.refetch()}
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
