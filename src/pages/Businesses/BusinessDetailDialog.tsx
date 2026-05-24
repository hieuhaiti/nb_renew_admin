import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { businessService, useApiQuery } from '@/service'
import type { ApiResponse, Business, BusinessStatus } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import RatingsSection from '@/components/common/RatingsSection'

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

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  san_xuat: 'Sản xuất',
  nha_hang: 'Nhà hàng',
  lu_hanh: 'Lữ hành',
  khu_du_lich: 'Khu du lịch',
  ban_le: 'Bán lẻ',
  hotel: 'Khách sạn',
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{children}</span>
    </div>
  )
}

interface BusinessDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string | null
  onEdit?: () => void
}

export default function BusinessDetailDialog({
  open,
  onOpenChange,
  businessId,
  onEdit,
}: BusinessDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)

  const dbQuery = useApiQuery(
    ['business', businessId],
    () => businessService.getById(businessId!),
    { enabled: !!businessId && open, staleTime: 0 },
    false,
    false
  )
  const biz = (dbQuery.data as ApiResponse<{ business: Business }>)?.data?.business ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        actions={
          onEdit && (
            <button
              onClick={onEdit}
              title="Chỉnh sửa"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết doanh nghiệp</DialogTitle>
        <DialogDescription>Thông tin chi tiết doanh nghiệp du lịch</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !biz ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-2.5">
            {biz.logo_url && (
              <img
                src={parseLink(biz.logo_url)}
                alt={biz.business_name}
                className="h-24 w-24 cursor-zoom-in rounded border object-contain"
                onClick={() => openLightbox(parseLink(biz.logo_url!))}
              />
            )}

            {/* ── Thông tin cơ bản ── */}
            <Row label="ID">
              <span className="font-mono">{biz.id}</span>
            </Row>
            <Row label="Tên doanh nghiệp">
              <span className="font-medium">{biz.business_name}</span>
            </Row>
            <Row label="Mã doanh nghiệp">{biz.business_code || '-'}</Row>
            <Row label="Loại hình">
              {BUSINESS_TYPE_LABEL[biz.business_type] ?? (biz.business_type || '-')}
            </Row>
            <Row label="Mã số thuế">{biz.tax_id || '-'}</Row>
            <Row label="Số giấy phép">{biz.license_number || '-'}</Row>

            {/* ── Liên hệ & địa chỉ ── */}
            <Row label="Điện thoại">{biz.phone || '-'}</Row>
            <Row label="Email">{biz.email || '-'}</Row>
            <Row label="Website">
              {biz.website ? (
                <a
                  href={biz.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {biz.website}
                </a>
              ) : (
                '-'
              )}
            </Row>
            <Row label="Mã tỉnh">{biz.province_code || '-'}</Row>
            <Row label="Địa chỉ">{biz.address_vi || '-'}</Row>
            {biz.geom?.coordinates && (
              <Row label="Tọa độ">
                <span className="font-mono">
                  {biz.geom.coordinates[1]}, {biz.geom.coordinates[0]}
                </span>
              </Row>
            )}

            {/* ── Chủ sở hữu ── */}
            {(biz.owner_name || biz.owner_email) && (
              <>
                <Row label="Chủ sở hữu">
                  <span className="font-medium">{biz.owner_name || '-'}</span>
                </Row>
                {biz.owner_email && <Row label="Email chủ">{biz.owner_email}</Row>}
              </>
            )}

            {/* ── Đánh giá ── */}
            {(biz.rating_avg || biz.rating_count > 0) && (
              <Row label="Đánh giá">
                ⭐ {biz.rating_avg ?? '-'} ({biz.rating_count} lượt)
              </Row>
            )}

            {/* ── Trạng thái & duyệt ── */}
            <Row label="Trạng thái">
              <StatusDotBadge
                label={STATUS_LABEL[biz.status]}
                badgeClass={STATUS_CLASS[biz.status]}
                dotClass={STATUS_DOT[biz.status]}
              />
            </Row>
            {biz.approved_at && (
              <Row label="Ngày duyệt">{formatDateTime(biz.approved_at)}</Row>
            )}
            {biz.approved_by_name && (
              <Row label="Người duyệt">{biz.approved_by_name}</Row>
            )}
            {biz.rejection_note && (
              <Row label="Lý do từ chối">
                <span className="text-destructive">{biz.rejection_note}</span>
              </Row>
            )}

            {/* ── Mô tả ── */}
            {biz.description && (
              <Row label="Mô tả">{biz.description}</Row>
            )}

            {/* ── Thời gian ── */}
            <Row label="Ngày tạo">{formatDateTime(biz.created_at)}</Row>
            <Row label="Cập nhật">{formatDateTime(biz.updated_at)}</Row>

            {/* ── Đánh giá ── */}
            <RatingsSection targetType="business" targetId={biz.id} enabled={open} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
