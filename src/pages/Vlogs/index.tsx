import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, vlogService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type { ApiResponse, Vlog, VlogListData, VlogStatus, VlogModerationBody, Pagination } from '@/types/api'
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
import { Check, Pen, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { UserCell } from '@/components/common/UserCell'
import { formatDate } from '@/lib/date'
import { parseLink } from '@/lib/utils'
import { STALE_HOT } from '@/constant/queryConstant'
import VlogDetailDialog from './VlogDetailDialog'
import VlogFormDialog from './VlogFormDialog'

const STATUS_LABEL: Record<VlogStatus, string> = {
  pending: 'Chờ duyệt',
  published: 'Đã xuất bản',
  rejected: 'Từ chối',
  draft: 'Nháp',
}
const STATUS_CLASS: Record<VlogStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  draft: 'bg-muted/40 text-muted-foreground border-border',
}
const STATUS_DOT: Record<VlogStatus, string> = {
  pending: 'bg-warning',
  published: 'bg-success',
  rejected: 'bg-destructive',
  draft: 'bg-muted-foreground',
}

export default function VlogPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [userIdFilter, setUserIdFilter] = useState<string>('')

  // ── Detail / Form dialogs ────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedVlog, setSelectedVlog] = useState<Vlog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  // ── Delete dialog ────────────────────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vlogToDelete, setVlogToDelete] = useState<Vlog | null>(null)

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(statusFilter !== 'all' && { status: statusFilter as VlogStatus }),
    ...(platformFilter.trim() && { platform: platformFilter.trim() }),
    ...(userIdFilter.trim() && { user_id: userIdFilter.trim() }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['vlogs', queryParams],
    () => vlogService.getAllAdmin(queryParams),
    { staleTime: STALE_HOT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<VlogListData>)?.data
  const items = data?.vlogs ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const moderateMutation = useApiMutation(
    (payload: { id: string; data: VlogModerationBody }) =>
      vlogService.moderate(payload.id, payload.data),
    {
      onSuccess: () => {
        setFormOpen(false)
        dbQuery.refetch()
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => vlogService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setVlogToDelete(null)
      },
    },
    true
  )

  function handleApprove(id: string) {
    moderateMutation.mutate({ id, data: { status: 'published' } })
  }

  function openDetail(vlog: Vlog) {
    setSelectedId(vlog.id)
    setSelectedVlog(vlog)
    setDetailOpen(true)
  }

  function openForm(vlog: Vlog) {
    setSelectedId(vlog.id)
    setSelectedVlog(vlog)
    setFormOpen(true)
  }

  return (
    <PageLayout title="Vlog" description="Quản lý và kiểm duyệt vlog người dùng">
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
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="draft">Nháp</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Nền tảng"
              className="w-32"
            />
            <Input
              value={userIdFilter}
              onChange={(e) => {
                setUserIdFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="User ID"
              className="w-48"
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
              <TableHead>Tiêu đề</TableHead>
              <TableHead className="w-20">Nền tảng</TableHead>
              <TableHead className="w-36">Tác giả</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((vlog: Vlog) => (
                <TableRow
                  key={vlog.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(vlog)}
                >
                  <TableCell>
                    {vlog.cover_image_url ? (
                      <img
                        src={parseLink(vlog.cover_image_url)}
                        alt={vlog.title}
                        className="h-10 w-10 cursor-zoom-in rounded border object-cover"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLightbox(parseLink(vlog.cover_image_url!))
                        }}
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p className="font-medium">{vlog.title}</p>
                    {vlog.excerpt && (
                      <p className="text-muted-foreground line-clamp-1 text-sm">{vlog.excerpt}</p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      {vlog.view_count} lượt xem · {vlog.like_count} thích
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {vlog.platform || '-'}
                  </TableCell>
                  <TableCell>
                    <UserCell userId={vlog.user_id} inlineUser={vlog.user} />
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[vlog.status]}
                      badgeClass={STATUS_CLASS[vlog.status]}
                      dotClass={STATUS_DOT[vlog.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {vlog.created_at ? formatDate(vlog.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openForm(vlog)
                        }}
                        title="Kiểm duyệt"
                      >
                        <Pen className="size-4" />
                      </Button>
                      {vlog.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(vlog.id)
                          }}
                          title="Xuất bản ngay"
                          disabled={moderateMutation.isPending}
                        >
                          <Check className="text-success size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setVlogToDelete(vlog)
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

      {/* ── Detail dialog ── */}
      <VlogDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        vlogId={selectedId}
        onEdit={() => {
          setDetailOpen(false)
          setFormOpen(true)
        }}
      />

      {/* ── Form dialog (moderation) ── */}
      <VlogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        vlog={selectedVlog}
        onSubmit={(data) =>
          selectedId && moderateMutation.mutate({ id: selectedId, data })
        }
        isLoading={moderateMutation.isPending}
      />

      {/* ── Delete confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vlog &quot;{vlogToDelete?.title}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => vlogToDelete && deleteMutation.mutate(vlogToDelete.id)}
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
