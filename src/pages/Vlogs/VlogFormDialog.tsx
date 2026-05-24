import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Vlog, VlogModerationBody } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Schema ────────────────────────────────────────────────────────────────────

const moderationSchema = z.object({
  status: z.enum(['published', 'rejected']),
  rejection_note: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
})
type ModerationFormValues = z.infer<typeof moderationSchema>

// ── Props ─────────────────────────────────────────────────────────────────────

interface VlogFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vlog: Vlog | null
  onSubmit: (data: VlogModerationBody) => void
  isLoading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VlogFormDialog({
  open,
  onOpenChange,
  vlog,
  onSubmit,
  isLoading = false,
}: VlogFormDialogProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<ModerationFormValues>({
    resolver: zodResolver(moderationSchema) as any,
    defaultValues: { status: 'published', rejection_note: '' },
  })

  const currentStatus = watch('status')

  useEffect(() => {
    if (open) reset({ status: 'published', rejection_note: '' })
  }, [open, reset])

  const handleFormSubmit = (values: ModerationFormValues) => {
    onSubmit({
      status: values.status,
      rejection_note: values.status === 'rejected' && values.rejection_note
        ? values.rejection_note
        : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Kiểm duyệt vlog</DialogTitle>
        <DialogDescription>
          {vlog ? `"${vlog.title}"` : 'Cập nhật trạng thái kiểm duyệt vlog'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="vlog_status">Trạng thái</Label>
            <Select
              value={currentStatus}
              onValueChange={(v) => setValue('status', v as 'published' | 'rejected')}
            >
              <SelectTrigger id="vlog_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Xuất bản</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentStatus === 'rejected' && (
            <div className="space-y-1">
              <Label htmlFor="vlog_rejection_note">Lý do từ chối</Label>
              <Input
                id="vlog_rejection_note"
                {...register('rejection_note')}
                placeholder="Nội dung không phù hợp..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant={currentStatus === 'rejected' ? 'destructive' : 'default'}
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : currentStatus === 'rejected' ? 'Từ chối' : 'Xuất bản'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
