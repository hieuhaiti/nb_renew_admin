import { useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { spotService, useApiQuery, useApiMutation } from '@/service'
import type { ApiResponse, Spot } from '@/types/api'
import type { SpotMedia } from '@/service/spotService'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Star, Trash2, Crown, Upload, Pen } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import RatingsSection from '@/components/common/RatingsSection'

interface SpotDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string | null
  onEdit?: () => void
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

export default function SpotDetailDialog({
  open,
  onOpenChange,
  spotId,
  onEdit,
}: SpotDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dbQuery = useApiQuery(
    ['spot', spotId],
    () => spotService.getById(spotId!),
    { enabled: !!spotId && open, staleTime: 0 },
    false,
    false
  )
  const spot = (dbQuery.data as ApiResponse<{ spot: Spot }>)?.data?.spot ?? null

  const mediaQuery = useApiQuery(
    ['spot-media', spotId],
    () => spotService.getMedia(spotId!),
    { enabled: !!spotId && open, staleTime: 0 },
    false,
    false
  )
  const media: SpotMedia[] = (mediaQuery.data as any)?.data?.media ?? []

  const uploadMutation = useApiMutation(
    (fd: FormData) => spotService.uploadMediaBatch(spotId!, fd),
    { onSuccess: () => mediaQuery.refetch() },
    true
  )

  const deleteMutation = useApiMutation(
    (mediaId: string) => spotService.deleteMedia(spotId!, mediaId),
    { onSuccess: () => mediaQuery.refetch() },
    true
  )

  const setPrimaryMutation = useApiMutation(
    (mediaId: string) => spotService.setPrimaryMedia(spotId!, mediaId),
    { onSuccess: () => mediaQuery.refetch() },
    true
  )

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !spotId) return
    const fd = new FormData()
    Array.from(e.target.files).forEach((f) => fd.append('files', f))
    uploadMutation.mutate(fd)
    e.target.value = ''
  }

  const ratingLabel = formatRatingAvg(spot?.rating_avg)
  const displayName = spot?.name ?? spot?.name_vi
  const displayAddress = spot?.address ?? spot?.address_vi
  const displayDescription = spot?.description ?? spot?.description_vi
  const primaryImage = spot?.primary_image ?? spot?.primary_image_url

  const isPending =
    (uploadMutation as any).isPending ||
    (deleteMutation as any).isPending ||
    (setPrimaryMutation as any).isPending

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
        <DialogTitle>Chi tiết điểm tham quan</DialogTitle>
        <DialogDescription>Thông tin chi tiết điểm tham quan đã chọn</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !spot ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            <Row label="ID">
              <span className="font-mono text-sm">{spot.id}</span>
            </Row>
            <Row label="Tên">
              <span className="font-medium">{displayName || '-'}</span>
            </Row>
            <Row label="Slug">
              <span className="font-mono text-sm">{spot.slug || '-'}</span>
            </Row>
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
                : (spot.category_id ?? '-')}
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
                <span className="text-sm break-all">{spot.website}</span>
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
              {spot.max_capacity != null
                ? `${spot.max_capacity.toLocaleString('vi-VN')} người`
                : '-'}
            </Row>
            {spot.current_capacity_pct != null && (
              <Row label="Công suất hiện tại">{spot.current_capacity_pct}%</Row>
            )}
            {spot.current_visitor_count != null && (
              <Row label="Khách hiện tại">
                {spot.current_visitor_count.toLocaleString('vi-VN')} người
              </Row>
            )}
            <Row label="Đánh giá">
              <span className="flex items-center gap-1">
                {ratingLabel ? (
                  <>
                    <Star className="text-warning size-4 fill-current" />
                    <span>{ratingLabel}</span>
                    <span className="text-muted-foreground text-sm">({spot.rating_count})</span>
                  </>
                ) : (
                  '-'
                )}
              </span>
            </Row>
            <Row label="Trạng thái">
              <Badge variant={spot.status === 'active' ? 'default' : 'secondary'}>
                {spot.status}
              </Badge>
            </Row>
            <Row label="Nổi bật">
              {spot.is_featured ? (
                <Badge variant="default">Nổi bật</Badge>
              ) : (
                <Badge variant="outline">Không</Badge>
              )}
            </Row>
            <Row label="VR 360°">
              {spot.has_vr_360 ? (
                <Badge variant="default">Có</Badge>
              ) : (
                <Badge variant="outline">Không</Badge>
              )}
            </Row>
            <Row label="Thuyết minh âm thanh">
              {spot.has_audio_guide ? (
                <Badge variant="default">Có</Badge>
              ) : (
                <Badge variant="outline">Không</Badge>
              )}
            </Row>
            <Row label="AR">
              {spot.has_ar_support ? (
                <Badge variant="default">Có</Badge>
              ) : (
                <Badge variant="outline">Không</Badge>
              )}
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

            {/* Ratings */}
            <RatingsSection targetType="spot" targetId={spotId!} enabled={open} />

            {/* Media gallery */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Hình ảnh {mediaQuery.isLoading ? '' : `(${media.length})`}
                </span>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={handleUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isPending}
                  >
                    <Upload className="mr-1 size-3" />
                    Tải lên
                  </Button>
                </div>
              </div>

              {mediaQuery.isLoading ? (
                <div className="text-muted-foreground text-sm">Đang tải...</div>
              ) : media.length === 0 ? (
                <div className="text-muted-foreground text-sm">Chưa có hình ảnh</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((m) => (
                    <div key={m.id} className="group relative overflow-hidden rounded border">
                      <img
                        src={parseLink(m.url)}
                        alt={m.title_vi ?? ''}
                        className="aspect-video w-full cursor-zoom-in object-cover"
                        onClick={() => openLightbox(parseLink(m.url))}
                      />
                      {m.is_primary && (
                        <Badge className="absolute top-1 left-1 text-xs">Ảnh chính</Badge>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 flex justify-end gap-1 bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {!m.is_primary && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 text-white hover:bg-white/20"
                            onClick={() => setPrimaryMutation.mutate(m.id)}
                            disabled={isPending}
                            title="Đặt làm ảnh chính"
                          >
                            <Crown className="size-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-destructive/80 size-6 text-white"
                          onClick={() => deleteMutation.mutate(m.id)}
                          disabled={isPending}
                          title="Xóa"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                      {m.title_vi && <div className="truncate p-1 text-xs">{m.title_vi}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
