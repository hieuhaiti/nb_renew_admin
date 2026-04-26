import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { userService, roleService, useApiQuery } from '@/service'
import type { ApiResponse, User, UserCreateBody, UserUpdateBody, Role } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const createSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(100, 'Email không được quá 100 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').max(128, 'Mật khẩu không được quá 128 ký tự'),
  full_name: z.string().max(100).optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^[0-9+\-\s\(\)]{10,20}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  avatar_url: z.string().url('URL avatar không hợp lệ').optional().or(z.literal('')),
  role_id: z.coerce.number().min(1, 'Vai trò là bắt buộc'),
  is_active: z.boolean(),
  is_verified: z.boolean(),
})

const updateSchema = createSchema.extend({
  password: z.string().max(128).optional().or(z.literal('')),
})

type UserFormValues = z.infer<typeof createSchema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onSubmit: (data: UserCreateBody | UserUpdateBody) => void
  isLoading?: boolean
}

export default function UserFormDialog({
  open,
  onOpenChange,
  userId,
  onSubmit,
  isLoading = false,
}: UserFormDialogProps) {
  const dbQuery = useApiQuery(
    ['user', userId],
    () => userService.getById(userId!),
    { enabled: !!userId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<User | { user: User }>)?.data
  const user =
    rawData && 'id' in rawData ? (rawData as User) : (rawData as { user?: User })?.user ?? null
  const isEdit = !!user

  const rolesQuery = useApiQuery(['roles'], () => roleService.getAll(), {}, false, false)
  const roles = (rolesQuery.data as ApiResponse<Role[]>)?.data ?? []

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? updateSchema : createSchema) as any,
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      phone: '',
      avatar_url: '',
      role_id: 2,
      is_active: true,
      is_verified: false,
    },
  })

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        role_id: user.role_id || 2,
        is_active: user.is_active ?? true,
        is_verified: user.is_verified ?? false,
      })
    } else {
      reset({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        avatar_url: '',
        role_id: 2,
        is_active: true,
        is_verified: false,
      })
    }
  }, [user, reset, open])

  const handleFormSubmit: SubmitHandler<UserFormValues> = (data) => {
    if (isEdit) {
      const payload: UserUpdateBody = {
        email: data.email,
        ...(data.full_name?.trim() && { full_name: data.full_name }),
        ...(data.phone?.trim() && { phone: data.phone }),
        ...(data.avatar_url?.trim() && { avatar_url: data.avatar_url }),
        role_id: data.role_id,
        is_active: data.is_active,
        is_verified: data.is_verified,
      }
      onSubmit(payload)
    } else {
      const payload: UserCreateBody = {
        email: data.email,
        password: data.password!,
        ...(data.full_name?.trim() && { full_name: data.full_name }),
        ...(data.phone?.trim() && { phone: data.phone }),
        ...(data.avatar_url?.trim() && { avatar_url: data.avatar_url }),
        role_id: data.role_id,
        is_active: data.is_active,
        is_verified: data.is_verified,
      }
      onSubmit(payload)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản người dùng mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Mật khẩu {!isEdit && <span className="text-destructive">*</span>}
              {isEdit && (
                <span className="text-muted-foreground ml-1 text-xs">(Để trống nếu không đổi)</span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              placeholder={isEdit ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
            />
            {errors.password && (
              <p className="text-destructive text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input id="full_name" {...register('full_name')} placeholder="Họ và tên" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input id="phone" {...register('phone')} placeholder="Số điện thoại" />
              {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role_id">
                Vai trò <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('role_id')?.toString() || ''}
                onValueChange={(v) => setValue('role_id', parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role_id && (
                <p className="text-destructive text-sm">{errors.role_id.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">URL ảnh đại diện</Label>
            <Input
              id="avatar_url"
              {...register('avatar_url')}
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatar_url && (
              <p className="text-destructive text-sm">{errors.avatar_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={watch('is_active') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_active', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Kích hoạt</SelectItem>
                  <SelectItem value="false">Không kích hoạt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Xác thực</Label>
              <Select
                value={watch('is_verified') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_verified', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đã xác thực</SelectItem>
                  <SelectItem value="false">Chưa xác thực</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
