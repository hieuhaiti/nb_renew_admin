import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { vlogService, useApiQuery } from '@/service'
import type { ApiResponse, Vlog, VlogStatus } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { UserCell } from '@/components/common/UserCell'

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

interface VlogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vlogId: string | null
  onEdit?: () => void
}

export default function VlogDetailDialog({
  open,
  onOpenChange,
  vlogId,
  onEdit,
}: VlogDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)

  const dbQuery = useApiQuery(
    ['vlog', vlogId],
    () => vlogService.getByIdAdmin(vlogId!),
    { enabled: !!vlogId && open, staleTime: 0 },
    false,
    false
  )
  const raw = (dbQuery.data as ApiResponse<{ vlog: Vlog }>)?.data
  const vlog = raw && 'id' in raw ? (raw as unknown as Vlog) : raw?.vlog ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        actions={
          onEdit && (
            <button
              onClick={onEdit}
              title="Kiểm duyệt"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Kiểm duyệt</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết vlog</DialogTitle>
        <DialogDescription>Thông tin chi tiết vlog người dùng</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !vlog ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            {vlog.cover_image_url && (
              <img
                src={parseLink(vlog.cover_image_url)}
                alt={vlog.title}
                className="h-40 w-full cursor-zoom-in rounded border object-cover"
                onClick={() => openLightbox(parseLink(vlog.cover_image_url!))}
              />
            )}

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{vlog.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tiêu đề:</span>
              <span className="col-span-2 font-medium">{vlog.title}</span>
            </div>
            {vlog.excerpt && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Tóm tắt:</span>
                <span className="col-span-2 text-sm">{vlog.excerpt}</span>
              </div>
            )}
            {vlog.content && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Nội dung:</span>
                <span className="col-span-2 text-sm">{vlog.content}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Nền tảng:</span>
              <span className="col-span-2">{vlog.platform || '-'}</span>
            </div>
            {vlog.video_url && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Video:</span>
                <span className="col-span-2">
                  <a
                    href={vlog.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all text-sm"
                  >
                    {vlog.video_url}
                  </a>
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Lượt xem:</span>
              <span className="col-span-2">
                {vlog.view_count} lượt xem · {vlog.like_count} thích · {vlog.comment_count} bình luận
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tác giả:</span>
              <span className="col-span-2">
                <UserCell userId={String(vlog.user_id)} inlineUser={vlog.user} />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                <StatusDotBadge
                  label={STATUS_LABEL[vlog.status]}
                  badgeClass={STATUS_CLASS[vlog.status]}
                  dotClass={STATUS_DOT[vlog.status]}
                />
              </span>
            </div>
            {vlog.rejection_note && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Lý do từ chối:</span>
                <span className="col-span-2 text-destructive text-sm">{vlog.rejection_note}</span>
              </div>
            )}
            {vlog.media_urls?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ảnh đính kèm:</span>
                <div className="col-span-2 flex flex-wrap gap-2">
                  {vlog.media_urls.map((url, i) => (
                    <img
                      key={i}
                      src={parseLink(url)}
                      alt={`media-${i}`}
                      className="h-16 w-16 cursor-zoom-in rounded border object-cover"
                      onClick={() => openLightbox(parseLink(url))}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{formatDateTime(vlog.created_at)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2">{formatDateTime(vlog.updated_at)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
