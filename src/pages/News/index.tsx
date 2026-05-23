import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, newsService } from '@/service'
import type { ApiResponse, News, NewsListData, NewsFormBody, Pagination } from '@/types/api'
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
import { Eye, EyeOff, Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import NewsDetailDialog from './NewsDetailDialog'
import NewsFormDialog from './NewsFormDialog'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT } from '@/constant/queryConstant'

const PUBLISHED_LABEL: Record<string, string> = {
  true: 'Đã xuất bản',
  false: 'Bản nháp',
}
const PUBLISHED_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted text-muted-foreground border-border',
}
const PUBLISHED_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

export default function News(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    ...(isPublishedFilter !== 'all' && { is_published: isPublishedFilter === 'true' }),
  }

  const dbQuery = useApiQuery(
    ['news', queryParams],
    () => newsService.getAllAdmin(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<NewsListData>)?.data
  const newsList = data?.news ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [newsToDelete, setNewsToDelete] = useState<News | null>(null)

  const createMutation = useApiMutation(
    (payload: NewsFormBody) => newsService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedNewsId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: NewsFormBody }) => newsService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedNewsId(null)
      },
    },
    true
  )

  const setPublishedMutation = useApiMutation(
    (payload: { id: string; is_published: boolean }) =>
      newsService.setPublished(payload.id, payload.is_published),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => newsService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setNewsToDelete(null)
      },
    },
    true
  )

  return (
    <PageLayout title="Tin tức" description="Quản lý bài viết tin tức">
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
              value={isPublishedFilter}
              onValueChange={(v) => {
                setIsPublishedFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đã xuất bản</SelectItem>
                <SelectItem value="false">Bản nháp</SelectItem>
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
                setSelectedNewsId(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm tin tức
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
              <TableHead className="w-48">ID</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-20">Lượt xem</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              newsList.map((n: News) => (
                <TableRow
                  className="hover:cursor-pointer"
                  key={n.id}
                  onClick={() => {
                    setSelectedNewsId(n.id)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{n.id}</span>
                  </TableCell>
                  <TableCell className="max-w-64 font-medium">
                    <span className="line-clamp-2">{n.title}</span>
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={PUBLISHED_LABEL[String(n.is_published)]}
                      badgeClass={PUBLISHED_CLASS[String(n.is_published)]}
                      dotClass={PUBLISHED_DOT[String(n.is_published)]}
                    />
                  </TableCell>
                  <TableCell>{n.view_count ?? 0}</TableCell>
                  <TableCell className="text-sm">
                    {n.created_at ? formatDate(n.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedNewsId(n.id)
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
                          setPublishedMutation.mutate({ id: n.id, is_published: !n.is_published })
                        }}
                        title={n.is_published ? 'Hủy xuất bản' : 'Xuất bản'}
                      >
                        {n.is_published ? (
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
                          setNewsToDelete(n)
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

      <NewsDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        newsId={selectedNewsId}
        onEdit={() => { setDetailDialogOpen(false); setFormDialogOpen(true) }}
      />

      <NewsFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        newsId={selectedNewsId}
        onSubmit={(payload) => {
          if (selectedNewsId) {
            updateMutation.mutate({ id: selectedNewsId, data: payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài viết &quot;{newsToDelete?.title}&quot;? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => newsToDelete && deleteMutation.mutate(newsToDelete.id)}
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
