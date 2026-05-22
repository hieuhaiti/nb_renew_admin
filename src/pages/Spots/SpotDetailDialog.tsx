import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { spotService, useApiQuery } from '@/service'
import type { ApiResponse, Spot } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Star } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'

interface SpotDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string | null
}

function formatRatingAvg(value: unknown): string | null {
  if (value == null) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  return num.toFixed(1)
}

function formatPrice(value: unknown): string {
  if (value == null) return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="font-semibold">{label}:</span>
      <span className="col-span-2">{children}</span>
    </div>
  )
}

export default function SpotDetailDialog({ open, onOpenChange, spotId }: SpotDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['spot', spotId],
    () => spotService.getById(spotId!),
    { enabled: !!spotId && open, staleTime: 0 },
    false,
    false
  )
  const spot = (dbQuery.data as ApiResponse<{ spot: Spot }>)?.data?.spot ?? null

  const ratingLabel = formatRatingAvg(spot?.rating_avg)
  const displayName = spot?.name ?? spot?.name_vi
  const displayAddress = spot?.address ?? spot?.address_vi
  const displayDescription = spot?.description ?? spot?.description_vi
  const primaryImage = spot?.primary_image ?? spot?.primary_image_url

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chi tiết điểm tham quan</DialogTitle>
        <DialogDescription>Thông tin chi tiết điểm tham quan đã chọn</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !spot ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            <Row label="ID"><span className="font-mono text-sm">{spot.id}</span></Row>
            <Row label="Tên"><span className="font-medium">{displayName || '-'}</span></Row>
            <Row label="Slug"><span className="font-mono text-sm">{spot.slug || '-'}</span></Row>
            {displayDescription && (
              <Row label="Mô tả">
                <span className="text-muted-foreground text-sm">{displayDescription}</span>
              </Row>
            )}
            <Row label="Địa chỉ">{displayAddress || '-'}</Row>
            <Row label="Danh mục">
              {spot.category_name
                ? spot.category_parent_name
                  ? `${spot.category_parent_name} › ${spot.category_name}`
                  : spot.category_name
                : spot.category_id ?? '-'}
            </Row>
            <Row label="Tỉnh/Thành">{spot.province_name ?? spot.province_code ?? '-'}</Row>
            {spot.commune_name && <Row label="Xã/Phường">{spot.commune_name}</Row>}
            <Row label="Tọa độ">
              {spot.latitude != null && spot.longitude != null
                ? `${spot.latitude}, ${spot.longitude}`
                : '-'}
            </Row>
            {spot.phone && <Row label="Điện thoại">{spot.phone}</Row>}
            {spot.email && <Row label="Email">{spot.email}</Row>}
            {spot.website && (
              <Row label="Website">
                <span className="break-all text-sm">{spot.website}</span>
              </Row>
            )}
            {spot.opening_hours && (
              <Row label="Giờ mở cửa">
                <span className="font-mono text-sm">
                  {Object.entries(spot.opening_hours)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ')}
                </span>
              </Row>
            )}
            <Row label="Giá vé NL">{formatPrice(spot.ticket_price_adult)}</Row>
            <Row label="Giá vé TE">{formatPrice(spot.ticket_price_child)}</Row>
            <Row label="Sức chứa tối đa">
              {spot.max_capacity != null ? `${spot.max_capacity.toLocaleString('vi-VN')} người` : '-'}
            </Row>
            {spot.current_capacity_pct != null && (
              <Row label="Công suất hiện tại">{spot.current_capacity_pct}%</Row>
            )}
            {spot.current_visitor_count != null && (
              <Row label="Khách hiện tại">{spot.current_visitor_count.toLocaleString('vi-VN')} người</Row>
            )}
            <Row label="Đánh giá">
              <span className="flex items-center gap-1">
                {ratingLabel ? (
                  <>
                    <Star className="text-warning size-4 fill-current" />
                    <span>{ratingLabel}</span>
                    <span className="text-muted-foreground text-sm">({spot.rating_count})</span>
                  </>
                ) : '-'}
              </span>
            </Row>
            <Row label="Trạng thái">
              <Badge variant={spot.status === 'active' ? 'default' : 'secondary'}>
                {spot.status}
              </Badge>
            </Row>
            <Row label="Nổi bật">
              {spot.is_featured
                ? <Badge variant="default">Nổi bật</Badge>
                : <Badge variant="outline">Không</Badge>}
            </Row>
            <Row label="VR 360°">
              {spot.has_vr_360
                ? <Badge variant="default">Có</Badge>
                : <Badge variant="outline">Không</Badge>}
            </Row>
            <Row label="Thuyết minh âm thanh">
              {spot.has_audio_guide
                ? <Badge variant="default">Có</Badge>
                : <Badge variant="outline">Không</Badge>}
            </Row>
            <Row label="AR">
              {spot.has_ar_support
                ? <Badge variant="default">Có</Badge>
                : <Badge variant="outline">Không</Badge>}
            </Row>
            {primaryImage && (
              <Row label="Ảnh chính">
                <img
                  src={parseLink(primaryImage)}
                  alt={displayName ?? ''}
                  className="h-24 cursor-zoom-in rounded border object-cover"
                  onClick={() => openLightbox(parseLink(primaryImage))}
                />
              </Row>
            )}
            <Row label="Ngày tạo">{formatDateTime(spot.created_at)}</Row>
            <Row label="Cập nhật">{formatDateTime(spot.updated_at)}</Row>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
