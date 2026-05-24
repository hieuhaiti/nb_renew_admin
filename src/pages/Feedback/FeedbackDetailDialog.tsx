import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { citizenFeedbackService, useApiQuery } from '@/service'
import type { ApiResponse, CitizenFeedback } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { MapPin, User } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import {
  PRIORITY_LABEL,
  PRIORITY_CLASS,
  STATUS_LABEL,
  STATUS_CLASS,
  MOD_LABEL,
  MOD_CLASS,
} from '@/constant/feedbackConstant'

interface FeedbackDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feedbackId: string | null
}

export default function FeedbackDetailDialog({
  open,
  onOpenChange,
  feedbackId,
}: FeedbackDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['feedback', feedbackId],
    () => citizenFeedbackService.getById(feedbackId!),
    { enabled: !!feedbackId && open, staleTime: 0 },
    false,
    false
  )
  const feedback = (dbQuery.data as ApiResponse<CitizenFeedback>)?.data ?? null

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2">
      <span className="font-semibold">{label}:</span>
      <div className="col-span-2">{children}</div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>Chi tiết phản ánh</DialogTitle>
        <DialogDescription>Thông tin chi tiết phản ánh của người dân</DialogDescription>

        {feedback ? (
          <div className="mt-4 space-y-3">
            <Row label="ID">{feedback.id}</Row>
            <Row label="Tiêu đề">
              <span className="font-medium">{feedback.title}</span>
            </Row>
            <Row label="Nội dung">
              <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
            </Row>
            <Row label="Mức độ ưu tiên">
              <Badge variant="outline" className={PRIORITY_CLASS[feedback.priority] ?? ''}>
                {PRIORITY_LABEL[feedback.priority] ?? feedback.priority}
              </Badge>
            </Row>
            <Row label="Trạng thái xử lý">
              <Badge variant="outline" className={STATUS_CLASS[feedback.status] ?? ''}>
                {STATUS_LABEL[feedback.status] ?? feedback.status}
              </Badge>
            </Row>
            <Row label="Kiểm duyệt">
              <Badge variant="outline" className={MOD_CLASS[feedback.moderation_status] ?? ''}>
                {MOD_LABEL[feedback.moderation_status] ?? feedback.moderation_status}
              </Badge>
            </Row>
            <Row label="Xác minh vị trí">
              <Badge
                variant="outline"
                className={
                  feedback.is_location_verified
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }
              >
                {feedback.is_location_verified ? 'Đã xác minh thực địa' : 'Chưa xác minh'}
              </Badge>
            </Row>
            {/* Người gửi */}
            {(feedback.user_name || feedback.user_avatar) && (
              <Row label="Người gửi">
                <div className="flex items-center gap-2">
                  {feedback.user_avatar ? (
                    <img
                      src={parseLink(feedback.user_avatar)}
                      alt=""
                      className="size-8 cursor-zoom-in rounded-full border object-cover"
                      onClick={() => openLightbox(parseLink(feedback.user_avatar!))}
                    />
                  ) : (
                    <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                      <User className="size-4" />
                    </div>
                  )}
                  <p className="text-sm font-medium">{feedback.user_name}</p>
                </div>
              </Row>
            )}

            {/* Vị trí */}
            {(feedback.location_text || feedback.latitude || feedback.longitude) && (
              <Row label="Vị trí">
                <div className="flex items-start gap-1">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  <div>
                    {feedback.location_text && <p className="text-sm">{feedback.location_text}</p>}
                    {(feedback.latitude || feedback.longitude) && (
                      <p className="text-muted-foreground text-xs">
                        {feedback.latitude}, {feedback.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </Row>
            )}

            {feedback.forest_loss_area_estimate_m2 != null && (
              <Row label="Diện tích mất rừng ước tính">
                {feedback.forest_loss_area_estimate_m2.toLocaleString('vi-VN')} m²
              </Row>
            )}

            {/* Admin response */}
            {feedback.admin_response && (
              <Row label="Phản hồi admin">
                <p className="bg-muted rounded-md p-2 text-sm">{feedback.admin_response}</p>
              </Row>
            )}
            {feedback.resolution_note && (
              <Row label="Ghi chú xử lý">
                <p className="bg-muted rounded-md p-2 text-sm">{feedback.resolution_note}</p>
              </Row>
            )}
            {feedback.responded_at && (
              <Row label="Phản hồi lúc">{formatDateTime(feedback.responded_at)}</Row>
            )}

            {/* Images */}
            {feedback.images && feedback.images.length > 0 && (
              <Row label="Ảnh đính kèm">
                <div className="grid grid-cols-3 gap-2">
                  {feedback.images.map((url, idx) => (
                    <img
                      key={idx}
                      src={parseLink(url)}
                      alt=""
                      className="h-24 w-full cursor-zoom-in rounded border object-cover transition hover:opacity-80"
                      onClick={() => openLightbox(parseLink(url))}
                    />
                  ))}
                </div>
              </Row>
            )}

            <Row label="Ngày tạo">
              {feedback.created_at ? formatDateTime(feedback.created_at) : '-'}
            </Row>
            <Row label="Cập nhật lúc">
              {feedback.updated_at ? formatDateTime(feedback.updated_at) : '-'}
            </Row>
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">Đang tải dữ liệu...</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
