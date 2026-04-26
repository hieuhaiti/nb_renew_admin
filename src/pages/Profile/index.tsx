import { useEffect, useState, useCallback } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import PageLayout from '@/layout/pageLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from '@/components/ui/file-upload'
import { toast } from 'react-toastify'
import { authService, useApiMutation } from '@/service'
import { useAuthStore } from '@/stores/common/useAuthStore'

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[0-9+\-\s\(\)]{10,20}$/, 'Số điện thoại không hợp lệ (10-20 ký tự)')
    .optional()
    .or(z.literal('')),
  address_detail: z
    .string()
    .max(1000, 'Địa chỉ không được quá 1000 ký tự')
    .optional()
    .or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const [avatarFiles, setAvatarFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      full_name: '',
      phone: '',
      address_detail: '',
    },
  })

  useEffect(() => {
    reset({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address_detail: user?.address_detail || '',
    })
    setAvatarFiles([])
  }, [user, reset])

  const onAvatarValidate = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Chỉ chấp nhận file ảnh'
    if (file.size > 10 * 1024 * 1024) return 'Kích thước file không được quá 10MB'
    return null
  }, [])

  const onAvatarReject = useCallback((file: File, message: string) => {
    toast.error(
      `${message}: "${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}"`
    )
  }, [])

  const updateMutation = useApiMutation(
    (data: FormData) => authService.updateProfile(data),
    {
      onSuccess: async () => {
        await fetchProfile()
      },
    },
    true
  )

  const handleFormSubmit: SubmitHandler<ProfileFormData> = (data) => {
    const fd = new FormData()
    if (data.full_name?.trim()) fd.append('full_name', data.full_name)
    if (data.phone?.trim()) fd.append('phone', data.phone)
    if (data.address_detail?.trim()) fd.append('address_detail', data.address_detail)
    if (avatarFiles[0]) fd.append('avatar_url', avatarFiles[0])
    updateMutation.mutate(fd)
  }

  return (
    <PageLayout title="Cập nhật thông tin" description="Chỉnh sửa thông tin tài khoản của bạn">
      <Card className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input id="username" value={user?.username || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input id="full_name" {...register('full_name')} placeholder="Nhập họ và tên" />
            {errors.full_name && (
              <p className="text-destructive text-sm">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Điện thoại</Label>
              <Input id="phone" {...register('phone')} placeholder="Số điện thoại" />
              {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_detail">Địa chỉ chi tiết</Label>
              <Input
                id="address_detail"
                {...register('address_detail')}
                placeholder="Nhập địa chỉ chi tiết"
              />
              {errors.address_detail && (
                <p className="text-destructive text-sm">{errors.address_detail.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            {user?.avatar_url && avatarFiles.length === 0 && (
              <div className="mb-2">
                <img
                  src={user.avatar_url}
                  alt="Avatar hiện tại"
                  className="h-16 w-16 rounded-full border object-cover"
                />
                <p className="text-muted-foreground mt-1 text-xs">Ảnh hiện tại</p>
              </div>
            )}
            <FileUpload
              value={avatarFiles}
              onValueChange={setAvatarFiles}
              onFileValidate={onAvatarValidate}
              onFileReject={onAvatarReject}
              accept="image/*"
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
            >
              <FileUploadDropzone className="border-dashed">
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-sm font-medium">Kéo thả ảnh vào đây</p>
                  <p className="text-muted-foreground text-xs">hoặc</p>
                  <FileUploadTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      Chọn ảnh
                    </Button>
                  </FileUploadTrigger>
                  <p className="text-muted-foreground text-xs">PNG, JPG, WEBP · Tối đa 10MB</p>
                </div>
              </FileUploadDropzone>
              <FileUploadList>
                {avatarFiles.map((file) => (
                  <FileUploadItem key={file.name} value={file}>
                    <FileUploadItemPreview />
                    <FileUploadItemMetadata />
                    <FileUploadItemDelete asChild>
                      <Button type="button" variant="ghost" size="sm">
                        Xóa
                      </Button>
                    </FileUploadItemDelete>
                  </FileUploadItem>
                ))}
              </FileUploadList>
            </FileUpload>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {isSubmitting || updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  )
}
