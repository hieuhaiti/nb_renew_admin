import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { NewsComment } from '@/types/api'
import { UserText } from '@/components/common/UserText'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{children}</span>
    </div>
  )
}

interface NewsCommentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comment: NewsComment | null
  onEdit?: () => void
}

export default function NewsCommentDetailDialog({
  open,
  onOpenChange,
  comment,
  onEdit,
}: NewsCommentDetailDialogProps) {
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
        <DialogTitle>Chi tiết bình luận</DialogTitle>
        <DialogDescription>Thông tin chi tiết bình luận đã chọn</DialogDescription>

        {!comment ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-2.5">
            <Row label="ID">
              <span className="font-mono">{comment.id}</span>
            </Row>
            <Row label="Bài viết ID">
              <span className="font-mono">{comment.news_id}</span>
            </Row>
            <Row label="Người bình luận">
              {comment.user_id ? (
                <UserText userId={comment.user_id} />
              ) : (
                comment.user_name || '-'
              )}
            </Row>
            {!comment.user_id && comment.user_email && (
              <Row label="Email">{comment.user_email}</Row>
            )}
            {comment.parent_comment_id && (
              <Row label="Trả lời comment">
                <span className="font-mono text-xs">{comment.parent_comment_id}</span>
              </Row>
            )}
            <Row label="Nội dung">
              <div className="rounded border p-2 text-sm whitespace-pre-wrap">
                {comment.content}
              </div>
            </Row>
            <Row label="Trạng thái">
              {comment.is_approved ? (
                <Badge variant="default">Đã duyệt</Badge>
              ) : (
                <Badge variant="secondary">Chờ duyệt</Badge>
              )}
            </Row>
            {comment.replies && comment.replies.length > 0 && (
              <Row label={`Trả lời (${comment.replies.length})`}>
                <div className="space-y-2">
                  {comment.replies.map((r) => (
                    <div key={r.id} className="rounded border p-2 text-sm">
                      <p className="text-muted-foreground text-xs">
                        {r.user ? r.user.full_name || `User #${r.user.id}` : r.user_name || '-'} ·{' '}
                        {formatDateTime(r.created_at)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{r.content}</p>
                    </div>
                  ))}
                </div>
              </Row>
            )}
            <Row label="Ngày tạo">{comment.created_at ? formatDateTime(comment.created_at) : '-'}</Row>
            {comment.updated_at && (
              <Row label="Cập nhật">{formatDateTime(comment.updated_at)}</Row>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
