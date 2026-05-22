import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { tourService, useApiQuery } from '@/service'
import type { ApiResponse, Tour } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Star } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  active: 'Đang hoạt động',
  inactive: 'Tạm dừng',
  archived: 'Lưu trữ',
  published: 'Đã xuất bản',
}

interface TourDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourId: string | null
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export default function TourDetailDialog({ open, onOpenChange, tourId }: TourDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['tour', tourId],
    () => tourService.getById(tourId!),
    { enabled: !!tourId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<Tour | { tour: Tour }>)?.data
  const tour =
    rawData && 'id' in rawData ? (rawData as Tour) : (rawData as { tour?: Tour })?.tour ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chi tiết tour</DialogTitle>
        <DialogDescription>Thông tin chi tiết tour du lịch</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !tour ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            {tour.cover_image_url && (
              <img
                src={parseLink(tour.cover_image_url)}
                alt={tour.name}
                className="h-40 w-full cursor-zoom-in rounded border object-cover"
                onClick={() => openLightbox(parseLink(tour.cover_image_url!))}
              />
            )}

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{tour.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên tour:</span>
              <span className="col-span-2 font-medium">{tour.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Slug:</span>
              <span className="col-span-2 font-mono text-sm">{tour.slug}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tỉnh/Thành:</span>
              <span className="col-span-2">{tour.province_name || tour.province_code || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mô tả:</span>
              <span className="col-span-2 text-sm">{tour.description_vi || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Số ngày:</span>
              <span className="col-span-2">{tour.duration_days} ngày</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Giá từ:</span>
              <span className="col-span-2">{formatPrice(tour.price_from_vnd)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Số khách tối đa:</span>
              <span className="col-span-2">{tour.max_guests ?? '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Điểm xuất phát:</span>
              <span className="col-span-2">{tour.start_location_vi || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Điểm kết thúc:</span>
              <span className="col-span-2">{tour.end_location_vi || '-'}</span>
            </div>
            {tour.includes && tour.includes.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Bao gồm:</span>
                <ul className="col-span-2 list-inside list-disc text-sm">
                  {tour.includes.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            {tour.excludes && tour.excludes.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Không bao gồm:</span>
                <ul className="col-span-2 list-inside list-disc text-sm">
                  {tour.excludes.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Đánh giá:</span>
              <span className="col-span-2 flex items-center gap-1">
                {tour.rating_avg ? (
                  <>
                    <Star className="text-warning size-4 fill-current" />
                    <span>{parseFloat(tour.rating_avg).toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({tour.rating_count} đánh giá)</span>
                  </>
                ) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                <Badge variant={tour.status === 'published' || tour.status === 'active' ? 'default' : 'secondary'}>
                  {STATUS_LABEL[tour.status] ?? tour.status}
                </Badge>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Nổi bật:</span>
              <span className="col-span-2">
                {tour.is_featured ? (
                  <Badge variant="default">Nổi bật</Badge>
                ) : (
                  <Badge variant="outline">Không</Badge>
                )}
              </span>
            </div>
            {tour.business_name && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Doanh nghiệp:</span>
                <span className="col-span-2">{tour.business_name}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{formatDateTime(tour.created_at)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2">{formatDateTime(tour.updated_at)}</span>
            </div>
            {tour.published_at && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Xuất bản lúc:</span>
                <span className="col-span-2">{formatDateTime(tour.published_at)}</span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
