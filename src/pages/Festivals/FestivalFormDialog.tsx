import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { festivalService, useApiQuery } from '@/service'
import type { ApiResponse, Festival, FestivalFormBody } from '@/types/api'
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

const festivalSchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  name_en: z.string().max(255).optional().or(z.literal('')),
  festival_type: z.string().max(100).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  is_recurring: z.boolean(),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  location_name: z.string().max(255).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  is_published: z.boolean(),
})
type FestivalFormValues = z.infer<typeof festivalSchema>

const defaultValues: FestivalFormValues = {
  name_vi: '',
  name_en: '',
  festival_type: '',
  description_vi: '',
  start_date: '',
  end_date: '',
  is_recurring: false,
  cover_image_url: '',
  website: '',
  location_name: '',
  province_code: '',
  is_published: false,
}

interface FestivalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  festivalId: string | null
  onSubmit: (data: FestivalFormBody) => void
  isLoading?: boolean
}

export default function FestivalFormDialog({
  open,
  onOpenChange,
  festivalId,
  onSubmit,
  isLoading = false,
}: FestivalFormDialogProps) {
  const dbQuery = useApiQuery(
    ['festival', festivalId],
    () => festivalService.getById(festivalId!),
    { enabled: !!festivalId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<Festival | { festival: Festival }>)?.data
  const item =
    rawData && 'id' in rawData
      ? (rawData as Festival)
      : (rawData as { festival?: Festival })?.festival ?? null
  const isEdit = !!item

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FestivalFormValues>({
      resolver: zodResolver(festivalSchema) as any,
      defaultValues,
    })

  useEffect(() => {
    if (item) {
      reset({
        name_vi: item.name,
        name_en: '',
        festival_type: item.festival_type || '',
        description_vi: item.description || '',
        start_date: item.start_date ? item.start_date.slice(0, 10) : '',
        end_date: item.end_date ? item.end_date.slice(0, 10) : '',
        is_recurring: item.is_recurring,
        cover_image_url: item.cover_image_url || '',
        website: item.website || '',
        location_name: item.location_name || '',
        province_code: item.province_code || '',
        is_published: item.is_published,
      })
    } else {
      reset(defaultValues)
    }
  }, [item, reset, open])

  const handleFormSubmit: SubmitHandler<FestivalFormValues> = (formData) => {
    const payload: FestivalFormBody = {
      name_vi: formData.name_vi,
      ...(formData.name_en?.trim() && { name_en: formData.name_en }),
      ...(formData.festival_type?.trim() && { festival_type: formData.festival_type }),
      ...(formData.description_vi?.trim() && { description_vi: formData.description_vi }),
      ...(formData.start_date?.trim() && { start_date: formData.start_date }),
      ...(formData.end_date?.trim() && { end_date: formData.end_date }),
      is_recurring: formData.is_recurring,
      ...(formData.cover_image_url?.trim() && (!isEdit || formData.cover_image_url !== (item?.cover_image_url || '')) && { cover_image_url: formData.cover_image_url }),
      ...(formData.website?.trim() && (!isEdit || formData.website !== (item?.website || '')) && { website: formData.website }),
      ...(formData.location_name?.trim() && { location_name: formData.location_name }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      is_published: formData.is_published,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa lễ hội' : 'Thêm lễ hội mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin lễ hội' : 'Thêm lễ hội hoặc sự kiện mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fes_name_vi">Tên (VI) <span className="text-destructive">*</span></Label>
            <Input id="fes_name_vi" {...register('name_vi')} placeholder="Tên tiếng Việt" />
            {errors.name_vi && <p className="text-destructive text-sm">{errors.name_vi.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fes_name_en">Tên (EN)</Label>
              <Input id="fes_name_en" {...register('name_en')} placeholder="English name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fes_type">Loại lễ hội</Label>
              <Input id="fes_type" {...register('festival_type')} placeholder="VD: Truyền thống..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fes_desc">Mô tả</Label>
            <Textarea id="fes_desc" {...register('description_vi')} rows={3} placeholder="Mô tả lễ hội" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fes_start">Ngày bắt đầu</Label>
              <Input id="fes_start" type="date" {...register('start_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fes_end">Ngày kết thúc</Label>
              <Input id="fes_end" type="date" {...register('end_date')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fes_location">Địa điểm</Label>
            <Input id="fes_location" {...register('location_name')} placeholder="Tên địa điểm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fes_cover">URL ảnh bìa</Label>
            <Input id="fes_cover" {...register('cover_image_url')} placeholder="https://..." />
            {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fes_website">Website</Label>
            <Input id="fes_website" {...register('website')} placeholder="https://..." />
            {errors.website && <p className="text-destructive text-sm">{errors.website.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fes_province">Mã tỉnh</Label>
              <Input id="fes_province" {...register('province_code')} placeholder="Mã tỉnh" />
            </div>
            <div className="space-y-2">
              <Label>Định kỳ</Label>
              <Select value={watch('is_recurring') ? 'true' : 'false'} onValueChange={(v) => setValue('is_recurring', v === 'true')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Có</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Xuất bản</Label>
              <Select value={watch('is_published') ? 'true' : 'false'} onValueChange={(v) => setValue('is_published', v === 'true')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Nháp</SelectItem>
                  <SelectItem value="true">Xuất bản</SelectItem>
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
