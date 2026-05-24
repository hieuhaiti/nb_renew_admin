import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, businessService } from '@/service'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import type {
  ApiResponse,
  Business,
  BusinessListData,
  BusinessStatus,
  BusinessApprovalBody,
  BusinessFormBody,
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
import { Label } from '@/components/ui/label'
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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Check, X, Ban, Pen, Plus } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { parseLink } from '@/lib/utils'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import BusinessDetailDialog from './BusinessDetailDialog'
import BusinessFormDialog from './BusinessFormDialog'

const STATUS_LABEL: Record<BusinessStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  suspended: 'Tạm khóa',
}
const STATUS_CLASS: Record<BusinessStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  suspended: 'bg-muted/40 text-muted-foreground border-border',
}
const STATUS_DOT: Record<BusinessStatus, string> = {
  pending: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-destructive',
  suspended: 'bg-muted-foreground',
}

export default function BusinessPage(): JSX.Element {
  const openLightbox = useLightboxStore((s) => s.open)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('all')

  // ── Detail / Form dialogs ────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  // ── Reject dialog ────────────────────────────────────────────────────────
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [bizToReject, setBizToReject] = useState<Business | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(statusFilter !== 'all' && { status: statusFilter as BusinessStatus }),
    ...(businessTypeFilter !== 'all' && { business_type: businessTypeFilter }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['businesses', queryParams],
    () => businessService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<BusinessListData>)?.data
  const items = data?.items ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // ── Approval mutation ────────────────────────────────────────────────────
  const approvalMutation = useApiMutation(
    (payload: { id: string; data: BusinessApprovalBody }) =>
      businessService.setApproval(payload.id, payload.data),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  // ── Create / Update mutation ─────────────────────────────────────────────
  const saveMutation = useApiMutation(
    (payload: { id: string | null; data: BusinessFormBody | Partial<BusinessFormBody> }) =>
      payload.id
        ? businessService.update(payload.id, payload.data as Partial<BusinessFormBody>)
        : businessService.create(payload.data as BusinessFormBody),
    {
      onSuccess: () => {
        setFormOpen(false)
        dbQuery.refetch()
      },
    },
    true
  )

  function handleApprove(id: string) {
    approvalMutation.mutate({ id, data: { status: 'approved' } })
  }

  function handleSuspend(id: string) {
    approvalMutation.mutate({ id, data: { status: 'suspended' } })
  }

  function openReject(biz: Business) {
    setBizToReject(biz)
    setRejectionNote('')
    setRejectDialogOpen(true)
  }

  function handleRejectConfirm() {
    if (!bizToReject) return
    approvalMutation.mutate({
      id: bizToReject.id,
      data: { status: 'rejected', rejection_note: rejectionNote || undefined },
    })
    setRejectDialogOpen(false)
    setBizToReject(null)
  }

  function openDetail(id: string) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  function openForm(id: string | null = null) {
    setSelectedId(id)
    setFormOpen(true)
  }

  return (
    <PageLayout title="Doanh nghiệp" description="Quản lý doanh nghiệp du lịch">
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
                <SelectItem value="all">Tất cả TT</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
                <SelectItem value="suspended">Tạm khóa</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={businessTypeFilter}
              onValueChange={(v) => {
                setBusinessTypeFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="san_xuat">Sản xuất</SelectItem>
                <SelectItem value="nha_hang">Nhà hàng</SelectItem>
                <SelectItem value="lu_hanh">Lữ hành</SelectItem>
                <SelectItem value="khu_du_lich">Khu du lịch</SelectItem>
                <SelectItem value="ban_le">Bán lẻ</SelectItem>
                <SelectItem value="hotel">Khách sạn</SelectItem>
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
            <Button size="sm" onClick={() => openForm(null)}>
              <Plus className="mr-1 size-4" />
              Thêm mới
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
              <TableHead>Logo</TableHead>
              <TableHead>Tên doanh nghiệp</TableHead>
              <TableHead>Loại hình</TableHead>
              <TableHead>Chủ sở hữu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-36 text-right">Hành động</TableHead>
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
              items.map((biz: Business) => (
                <TableRow
                  key={biz.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(biz.id)}
                >
                  <TableCell>
                    {biz.logo_url ? (
                      <img
                        src={parseLink(biz.logo_url)}
                        alt={biz.business_name}
                        className="h-10 w-10 cursor-zoom-in rounded border object-contain"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLightbox(parseLink(biz.logo_url!))
                        }}
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{biz.business_name}</p>
                    {biz.address_vi && (
                      <p className="text-muted-foreground text-xs">{biz.address_vi}</p>
                    )}
                    {biz.phone && <p className="text-muted-foreground text-xs">{biz.phone}</p>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {biz.business_type || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {biz.owner_name ? (
                      <p className="font-medium">{biz.owner_name}</p>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[biz.status]}
                      badgeClass={STATUS_CLASS[biz.status]}
                      dotClass={STATUS_DOT[biz.status]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {biz.created_at ? formatDate(biz.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openForm(biz.id)
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pen className="size-4" />
                      </Button>
                      {biz.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(biz.id)
                            }}
                            title="Duyệt"
                            disabled={approvalMutation.isPending}
                          >
                            <Check className="text-success size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openReject(biz)
                            }}
                            title="Từ chối"
                            disabled={approvalMutation.isPending}
                          >
                            <X className="text-destructive size-4" />
                          </Button>
                        </>
                      )}
                      {biz.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSuspend(biz.id)
                          }}
                          title="Tạm khóa"
                          disabled={approvalMutation.isPending}
                        >
                          <Ban className="text-warning size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      {/* ── Detail dialog ── */}
      <BusinessDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        businessId={selectedId}
        onEdit={() => {
          setDetailOpen(false)
          setFormOpen(true)
        }}
      />

      {/* ── Form dialog (create / edit) ── */}
      <BusinessFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        businessId={selectedId}
        onSubmit={(data) => saveMutation.mutate({ id: selectedId, data })}
        isLoading={saveMutation.isPending}
      />

      {/* ── Reject confirmation dialog ── */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Từ chối doanh nghiệp</DialogTitle>
          <DialogDescription>Nhập lý do từ chối (không bắt buộc)</DialogDescription>
          <div className="mt-2 space-y-2">
            <Label htmlFor="biz_rejection_note">Lý do từ chối</Label>
            <Input
              id="biz_rejection_note"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Thông tin không hợp lệ..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={approvalMutation.isPending}
            >
              {approvalMutation.isPending ? 'Đang xử lý...' : 'Từ chối'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
