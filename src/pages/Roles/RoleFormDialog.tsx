import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Role } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const roleSchema = z.object({
  name: z.string().min(2, 'Tên vai trò tối thiểu 2 ký tự').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
})
type RoleFormValues = z.infer<typeof roleSchema>

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onSubmit: (data: { name: string; description?: string }) => void
  isLoading?: boolean
}

export default function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isLoading = false,
}: RoleFormDialogProps) {
  const isEdit = !!role

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: { name: '', description: '' },
  })

  useEffect(() => {
    if (role) {
      reset({ name: role.name, description: role.description || '' })
    } else {
      reset({ name: '', description: '' })
    }
  }, [role, reset, open])

  const handleFormSubmit: SubmitHandler<RoleFormValues> = (data) => {
    onSubmit({ name: data.name, ...(data.description?.trim() && { description: data.description }) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin vai trò' : 'Tạo vai trò người dùng mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">
              Tên vai trò <span className="text-destructive">*</span>
            </Label>
            <Input id="role-name" {...register('name')} placeholder="VD: Editor, Moderator..." />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-desc">Mô tả</Label>
            <Textarea id="role-desc" {...register('description')} placeholder="Mô tả quyền hạn của vai trò" rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Hủy</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
