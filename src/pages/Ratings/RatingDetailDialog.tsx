import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Rating, RatingStatus } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { UserCell } from '@/components/common/UserCell'

const STATUS_LABEL: Record<RatingStatus, string> = {
  pending: 'Chờ duyệt',
  published: 'Đã xuất bản',
  rejected: 'Từ chối',
}
const STATUS_CLASS: Record<RatingStatus, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}
const STATUS_DOT: Record<RatingStatus, string> = {
  pending: 'bg-warning',
  published: 'bg-success',
  rejected: 'bg-destructive',
}

const STARS = ['★', '★★', '★★★', '★★★★', '★★★★★']

interface RatingDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rating: Rating | null
  onEdit?: () => void
}

export default function RatingDetailDialog({
  open,
  onOpenChange,
  rating,
  onEdit,
}: RatingDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        actions={
          onEdit && (
            <button
              onClick={onEdit}
              title="Kiểm duyệt / Phản hồi"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Kiểm duyệt / Phản hồi</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết đánh giá</DialogTitle>
        <DialogDescription>Thông tin chi tiết đánh giá của người dùng</DialogDescription>

        {!rating ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{rating.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Điểm sao:</span>
              <span className="col-span-2 text-warning font-medium">
                {STARS[(rating.stars ?? 1) - 1]} ({rating.stars}/5)
              </span>
            </div>
            {rating.title && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Tiêu đề:</span>
                <span className="col-span-2 font-medium">{rating.title}</span>
              </div>
            )}
            {rating.content && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Nội dung:</span>
                <span className="col-span-2 text-sm">{rating.content}</span>
              </div>
            )}
            {rating.pros && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ưu điểm:</span>
                <span className="col-span-2 text-sm text-success">{rating.pros}</span>
              </div>
            )}
            {rating.cons && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Nhược điểm:</span>
                <span className="col-span-2 text-sm text-destructive">{rating.cons}</span>
              </div>
            )}
            {rating.visit_date && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ngày ghé thăm:</span>
                <span className="col-span-2">{rating.visit_date}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Người đánh giá:</span>
              <span className="col-span-2">
                <UserCell userId={String(rating.user_id)} inlineUser={rating.user} />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                <StatusDotBadge
                  label={STATUS_LABEL[rating.status]}
                  badgeClass={STATUS_CLASS[rating.status]}
                  dotClass={STATUS_DOT[rating.status]}
                />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Hữu ích:</span>
              <span className="col-span-2">{rating.helpful_count} lượt</span>
            </div>
            {rating.photo_urls?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ảnh:</span>
                <div className="col-span-2 flex flex-wrap gap-2">
                  {rating.photo_urls.map((url, i) => (
                    <img
                      key={i}
                      src={parseLink(url)}
                      alt={`photo-${i}`}
                      className="h-16 w-16 cursor-zoom-in rounded border object-cover"
                      onClick={() => openLightbox(parseLink(url))}
                    />
                  ))}
                </div>
              </div>
            )}
            {rating.reply_text && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Phản hồi admin:</span>
                <div className="col-span-2">
                  <p className="text-sm">{rating.reply_text}</p>
                  {rating.replied_at && (
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {formatDateTime(rating.replied_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{formatDateTime(rating.created_at)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
