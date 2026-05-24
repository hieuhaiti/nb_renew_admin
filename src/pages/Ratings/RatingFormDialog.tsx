import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Rating, RatingStatus } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// ── Schemas ───────────────────────────────────────────────────────────────────

const moderationSchema = z.object({
  status: z.enum(['pending', 'published', 'rejected']),
})
type ModerationFormValues = z.infer<typeof moderationSchema>

const replySchema = z.object({
  reply: z.string().min(1, 'Nội dung phản hồi không được để trống').max(2000),
})
type ReplyFormValues = z.infer<typeof replySchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface RatingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rating: Rating | null
  onUpdateStatus: (data: { status: RatingStatus }) => void
  onReply: (reply: string) => void
  isLoading?: boolean
  hideStatusTab?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RatingFormDialog({
  open,
  onOpenChange,
  rating,
  onUpdateStatus,
  onReply,
  isLoading = false,
  hideStatusTab = false,
}: RatingFormDialogProps) {
  const moderationForm = useForm<ModerationFormValues>({
    resolver: zodResolver(moderationSchema) as any,
    defaultValues: { status: 'pending' },
  })

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema) as any,
    defaultValues: { reply: '' },
  })

  useEffect(() => {
    if (open && rating) {
      moderationForm.reset({ status: rating.status })
      replyForm.reset({ reply: rating.reply_text ?? '' })
    }
  }, [open, rating])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Kiểm duyệt đánh giá</DialogTitle>
        <DialogDescription>
          {rating?.title ? `"${rating.title}"` : 'Cập nhật trạng thái và phản hồi đánh giá'}
        </DialogDescription>

        <Tabs defaultValue={hideStatusTab ? 'reply' : 'moderation'} className="pt-2">
          {!hideStatusTab && (
            <TabsList className="w-full">
              <TabsTrigger value="moderation" className="flex-1">Trạng thái</TabsTrigger>
              <TabsTrigger value="reply" className="flex-1">Phản hồi admin</TabsTrigger>
            </TabsList>
          )}

          {/* ── Moderation tab ── */}
          <TabsContent value="moderation">
            <form
              onSubmit={moderationForm.handleSubmit((values) => onUpdateStatus(values))}
              className="space-y-4 pt-4"
            >
              <div className="space-y-1">
                <Label htmlFor="rating_status">Trạng thái kiểm duyệt</Label>
                <Select
                  value={moderationForm.watch('status')}
                  onValueChange={(v) =>
                    moderationForm.setValue('status', v as RatingStatus)
                  }
                >
                  <SelectTrigger id="rating_status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="published">Xuất bản</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang xử lý...' : 'Cập nhật'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* ── Reply tab ── */}
          <TabsContent value="reply">
            <form
              onSubmit={replyForm.handleSubmit((values) => onReply(values.reply))}
              className="space-y-4 pt-4"
            >
              <div className="space-y-1">
                <Label htmlFor="rating_reply">Nội dung phản hồi</Label>
                <Textarea
                  id="rating_reply"
                  {...replyForm.register('reply')}
                  rows={5}
                  placeholder="Cảm ơn bạn đã đánh giá..."
                />
                {replyForm.formState.errors.reply && (
                  <p className="text-destructive text-xs">
                    {replyForm.formState.errors.reply.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
