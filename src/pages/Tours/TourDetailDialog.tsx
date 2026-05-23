import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { tourService, useApiQuery } from '@/service'
import type { ApiResponse, Tour } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Star, Pen } from 'lucide-react'
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
  onEdit?: () => void
}

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return '-'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(num)) return '-'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export default function TourDetailDialog({ open, onOpenChange, tourId, onEdit }: TourDetailDialogProps) {
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

  const stops = tour?.stops ?? []
  const hasStops = stops.length > 0
  const days = hasStops
    ? Array.from(new Set(stops.map((s) => s.day_number))).sort((a, b) => a - b)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[85vh] overflow-y-auto transition-all ${hasStops ? 'max-w-4xl' : 'max-w-2xl'}`}
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
        <DialogTitle>Chi tiết tour</DialogTitle>
        <DialogDescription>Thông tin chi tiết tour du lịch</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !tour ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className={`mt-2 ${hasStops ? 'flex gap-6' : ''}`}>
            {/* ── Thông tin tour ── */}
            <div className={`${hasStops ? 'w-[55%]' : 'w-full'} space-y-3`}>
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
                    {tour.includes.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.excludes && tour.excludes.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Không bao gồm:</span>
                  <ul className="col-span-2 list-inside list-disc text-sm">
                    {tour.excludes.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
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
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Trạng thái:</span>
                <span className="col-span-2">
                  <Badge
                    variant={
                      tour.status === 'published' || tour.status === 'active' ? 'default' : 'secondary'
                    }
                  >
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

            {/* ── Danh sách điểm dừng ── */}
            {hasStops && (
              <div className="border-l pl-4 w-[45%]">
                <h3 className="typo-section-title mb-3">
                  Lịch trình{' '}
                  <span className="typo-meta font-normal text-muted-foreground">
                    ({stops.length} điểm dừng)
                  </span>
                </h3>
                <div className="space-y-4">
                  {days.map((day) => {
                    const dayStops = stops
                      .filter((s) => s.day_number === day)
                      .sort((a, b) => a.stop_order - b.stop_order)
                    const isFirstDay = day === days[0]
                    const isLastDay = day === days[days.length - 1]
                    return (
                      <div key={day}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="typo-caption rounded bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
                            Ngày {day}
                          </span>
                          <span className="typo-caption text-muted-foreground">
                            {dayStops.length} điểm
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {dayStops.map((stop, idx) => {
                            const isFirst = isFirstDay && idx === 0
                            const isLast = isLastDay && idx === dayStops.length - 1
                            return (
                              <div
                                key={stop.id}
                                className={`rounded border p-2 ${
                                  isFirst
                                    ? 'border-rose-200 bg-rose-50/50'
                                    : isLast
                                      ? 'border-emerald-200 bg-emerald-50/50'
                                      : 'border-border bg-card'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="typo-caption mt-0.5 min-w-4.5 text-center font-mono text-muted-foreground">
                                    {stop.stop_order}.
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="typo-body-sm font-medium">
                                      {stop.title_vi || '—'}
                                    </div>
                                    {stop.description_vi && (
                                      <div className="typo-caption text-muted-foreground">
                                        {stop.description_vi}
                                      </div>
                                    )}
                                    {stop.planned_duration_min != null && (
                                      <div className="typo-caption text-muted-foreground">
                                        {stop.planned_duration_min} phút
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
