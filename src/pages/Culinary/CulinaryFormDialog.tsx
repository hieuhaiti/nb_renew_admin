import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { culinaryService, useApiQuery } from '@/service'
import type { ApiResponse, Culinary, CulinaryFormBody } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useProvinceScope } from '@/hooks/useProvinceScope'

const culinarySchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(255),
  category: z.string().max(100).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  cover_image_url: z.url('URL không hợp lệ').optional().or(z.literal('')),
  is_speciality: z.boolean(),
  province_code: z.string().max(10).optional().or(z.literal('')),
})
type CulinaryFormValues = z.infer<typeof culinarySchema>

const defaultValues: CulinaryFormValues = {
  name: '',
  category: '',
  description: '',
  cover_image_url: '',
  is_speciality: false,
  province_code: '',
}

interface CulinaryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  culinaryId: string | null
  onSubmit: (data: CulinaryFormBody) => void
  isLoading?: boolean
}

export default function CulinaryFormDialog({
  open,
  onOpenChange,
  culinaryId,
  onSubmit,
  isLoading = false,
}: CulinaryFormDialogProps) {
  const { provinceCode, canEditProvinceCode } = useProvinceScope()
  const dbQuery = useApiQuery(
    ['culinary', culinaryId],
    () => culinaryService.getById(culinaryId!),
    { enabled: !!culinaryId && open, staleTime: 0 },
    false,
    false
  )
  const item = (dbQuery.data as ApiResponse<Culinary>)?.data ?? null
  const isEdit = !!item

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<CulinaryFormValues>({
      resolver: zodResolver(culinarySchema) as any,
      defaultValues,
    })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        cover_image_url: item.cover_image_url || '',
        is_speciality: item.is_speciality,
        province_code: canEditProvinceCode ? item.province_code || '' : provinceCode,
      })
    } else {
      reset({ ...defaultValues, province_code: canEditProvinceCode ? '' : provinceCode })
    }
  }, [item, reset, open, canEditProvinceCode, provinceCode])

  const handleFormSubmit: SubmitHandler<CulinaryFormValues> = (data) => {
    const submittedProvinceCode = canEditProvinceCode ? data.province_code?.trim() : provinceCode
    const payload: CulinaryFormBody = {
      name: data.name,
      ...(data.category?.trim() && { category: data.category }),
      ...(data.description?.trim() && { description: data.description }),
      ...(data.cover_image_url?.trim() && (!isEdit || data.cover_image_url !== (item?.cover_image_url || '')) && { cover_image_url: data.cover_image_url }),
      is_speciality: data.is_speciality,
      ...(submittedProvinceCode && { province_code: submittedProvinceCode }),
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa ẩm thực' : 'Thêm ẩm thực mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin' : 'Thêm món ẩm thực mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cul_name">Tên <span className="text-destructive">*</span></Label>
            <Input id="cul_name" {...register('name')} placeholder="Tên món ăn" />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cul_category">Phân loại</Label>
            <Input id="cul_category" {...register('category')} placeholder="VD: Món chính..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cul_desc">Mô tả</Label>
            <Textarea id="cul_desc" {...register('description')} rows={3} placeholder="Mô tả về món ăn" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cul_cover">URL ảnh bìa</Label>
            <Input id="cul_cover" {...register('cover_image_url')} placeholder="https://..." />
            {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cul_province">Tỉnh/Thành</Label>
              <Input
                id="cul_province"
                {...register('province_code')}
                placeholder="Mã tỉnh"
                disabled={!canEditProvinceCode}
              />
            </div>
            <div className="space-y-2">
              <Label>Đặc sản</Label>
              <Select value={watch('is_speciality') ? 'true' : 'false'} onValueChange={(v) => setValue('is_speciality', v === 'true')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Đặc sản</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
