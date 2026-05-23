import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { newsCommentService, useApiMutation } from '@/service'
import type { NewsComment } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

const replySchema = z.object({
  content: z
    .string()
    .min(1, 'Nội dung là bắt buộc')
    .max(2000, 'Nội dung không được vượt quá 2000 ký tự'),
})
type ReplyForm = z.infer<typeof replySchema>

interface NewsCommentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentComment: NewsComment | null
  onSuccess: () => void
}

export default function NewsCommentFormDialog({
  open,
  onOpenChange,
  parentComment,
  onSuccess,
}: NewsCommentFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: '' },
  })

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const replyMutation = useApiMutation(
    (payload: { newsId: string; content: string; parent_comment_id: string }) =>
      newsCommentService.create(payload.newsId, {
        content: payload.content,
        parent_comment_id: payload.parent_comment_id,
      }),
    {
      onSuccess: async (data: unknown, variables: unknown) => {
        const vars = variables as { newsId: string; content: string; parent_comment_id: string }
        const newCommentId = (data as any)?.data?.id as string | undefined
        const approveJobs: Promise<unknown>[] = []
        if (parentComment && !parentComment.is_approved) {
          approveJobs.push(
            newsCommentService.setApproval(vars.newsId, parentComment.id, true)
          )
        }
        if (newCommentId) {
          approveJobs.push(newsCommentService.setApproval(vars.newsId, newCommentId, true))
        }
        await Promise.all(approveJobs)
        onOpenChange(false)
        onSuccess()
      },
    },
    true
  )

  function handleFormSubmit(values: ReplyForm) {
    if (!parentComment) return
    replyMutation.mutate({
      newsId: parentComment.news_id,
      content: values.content,
      parent_comment_id: parentComment.id,
    })
  }

  const displayName = parentComment?.user
    ? parentComment.user.full_name || `User #${parentComment.user.id}`
    : parentComment?.user_name || '-'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Trả lời bình luận</DialogTitle>
        <DialogDescription>Sau khi gửi, bình luận gốc sẽ được tự động duyệt</DialogDescription>

        {parentComment && (
          <div className="bg-muted/40 space-y-2 rounded border p-3 text-sm">
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>{displayName}</span>
              <Badge
                variant={parentComment.is_approved ? 'default' : 'secondary'}
                className="text-xs"
              >
                {parentComment.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}
              </Badge>
            </div>
            <p className="leading-relaxed whitespace-pre-wrap">{parentComment.content}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply-content">
              Nội dung trả lời <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reply-content"
              {...register('content')}
              placeholder="Nhập nội dung trả lời..."
              rows={4}
              autoFocus
            />
            {errors.content && <p className="text-destructive text-sm">{errors.content.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={replyMutation.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={replyMutation.isPending}>
              {replyMutation.isPending ? 'Đang xử lý...' : 'Gửi & Duyệt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
