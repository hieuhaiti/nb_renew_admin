import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { NewsComment } from '@/types/api'
import { UserText } from '@/components/common/UserText'
import { formatDateTime } from '@/lib/date'

interface NewsCommentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comment: NewsComment | null
}

export default function NewsCommentDetailDialog({
  open,
  onOpenChange,
  comment,
}: NewsCommentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chi tiết bình luận</DialogTitle>
        <DialogDescription>Thông tin chi tiết bình luận đã chọn</DialogDescription>

        {comment ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-xs">{comment.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Bài viết ID:</span>
              <span className="col-span-2 font-mono text-xs">{comment.news_id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Người bình luận:</span>
              <span className="col-span-2">
                {comment.user_id ? (
                  <UserText userId={comment.user_id} />
                ) : (
                  comment.user_name || '-'
                )}
              </span>
            </div>
            {!comment.user_id && comment.user_email && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Email:</span>
                <span className="col-span-2">{comment.user_email}</span>
              </div>
            )}
            {comment.parent_comment_id && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Trả lời:</span>
                <span className="col-span-2 font-mono text-xs">{comment.parent_comment_id}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Nội dung:</span>
              <div className="col-span-2 rounded border p-2 text-sm whitespace-pre-wrap">
                {comment.content}
              </div>
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Trả lời ({comment.replies.length}):</span>
                <div className="col-span-2 space-y-2">
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
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                {comment.is_approved ? (
                  <Badge variant="default">Đã duyệt</Badge>
                ) : (
                  <Badge variant="secondary">Chờ duyệt</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">
                {comment.created_at ? formatDateTime(comment.created_at) : '-'}
              </span>
            </div>
            {comment.updated_at && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Cập nhật:</span>
                <span className="col-span-2">{formatDateTime(comment.updated_at)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
