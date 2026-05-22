import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { tourService, useApiQuery } from '@/service'
import type { ApiResponse, Tour, TourFormBody, TourStatus } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const tourSchema = z.object({
  name: z.string().min(1, 'Tên tour không được để trống').max(255),
  slug: z.string().min(1, 'Slug không được để trống').max(255),
  province_code: z.string().max(10).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  duration_days: z.coerce.number().int().min(1, 'Số ngày phải ≥ 1'),
  price_from_vnd: z.coerce.number().min(0).optional().nullable(),
  max_guests: z.coerce.number().int().min(1).optional().nullable(),
  start_location_vi: z.string().max(255).optional().or(z.literal('')),
  end_location_vi: z.string().max(255).optional().or(z.literal('')),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'inactive', 'archived', 'published']),
  is_featured: z.boolean(),
})
type TourFormValues = z.infer<typeof tourSchema>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const defaultValues: TourFormValues = {
  name: '',
  slug: '',
  province_code: '',
  description_vi: '',
  duration_days: 1,
  price_from_vnd: null,
  max_guests: null,
  start_location_vi: '',
  end_location_vi: '',
  cover_image_url: '',
  status: 'draft',
  is_featured: false,
}

interface TourFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourId: string | null
  onSubmit: (data: TourFormBody | Partial<TourFormBody>) => void
  isLoading?: boolean
}

export default function TourFormDialog({
  open,
  onOpenChange,
  tourId,
  onSubmit,
  isLoading = false,
}: TourFormDialogProps) {
  const dbQuery = useApiQuery(
    ['tour', tourId],
    () => tourService.getById(tourId!),
    { enabled: !!tourId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<Tour | { tour: Tour }>)?.data
  const tour =
    rawData && 'id' in rawData ? (rawData as Tour) : (rawData as { tour?: Tour })?.tour ?? null
  const isEdit = !!tour

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<TourFormValues>({
      resolver: zodResolver(tourSchema) as any,
      defaultValues,
    })

  useEffect(() => {
    if (tour) {
      reset({
        name: tour.name,
        slug: tour.slug,
        province_code: tour.province_code ?? '',
        description_vi: tour.description_vi ?? '',
        duration_days: tour.duration_days,
        price_from_vnd: tour.price_from_vnd != null ? parseFloat(tour.price_from_vnd) : null,
        max_guests: tour.max_guests ?? null,
        start_location_vi: tour.start_location_vi ?? '',
        end_location_vi: tour.end_location_vi ?? '',
        cover_image_url: tour.cover_image_url ?? '',
        status: tour.status,
        is_featured: tour.is_featured,
      })
    } else {
      reset(defaultValues)
    }
  }, [tour, reset, open])

  const handleFormSubmit: SubmitHandler<TourFormValues> = (values) => {
    const body: TourFormBody = {
      name: values.name,
      slug: values.slug,
      ...(values.province_code && { province_code: values.province_code }),
      ...(values.description_vi && { description_vi: values.description_vi }),
      duration_days: values.duration_days,
      ...(values.price_from_vnd != null && { price_from_vnd: values.price_from_vnd }),
      ...(values.max_guests != null && { max_guests: values.max_guests }),
      ...(values.start_location_vi && { start_location_vi: values.start_location_vi }),
      ...(values.end_location_vi && { end_location_vi: values.end_location_vi }),
      ...(values.cover_image_url && (!isEdit || values.cover_image_url !== (tour?.cover_image_url ?? '')) && { cover_image_url: values.cover_image_url }),
      status: values.status,
      is_featured: values.is_featured,
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{isEdit ? 'Cập nhật tour' : 'Thêm tour mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Chỉnh sửa thông tin tour du lịch' : 'Điền thông tin để tạo tour mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tour_name">Tên tour <span className="text-destructive">*</span></Label>
              <Input
                id="tour_name"
                {...register('name')}
                placeholder="Khám phá Tràng An..."
                onChange={(e) => {
                  register('name').onChange(e)
                  if (!isEdit) setValue('slug', slugify(e.target.value))
                }}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour_slug">Slug <span className="text-destructive">*</span></Label>
              <Input id="tour_slug" {...register('slug')} placeholder="kham-pha-trang-an" />
              {errors.slug && <p className="text-destructive text-xs">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tour_days">Số ngày <span className="text-destructive">*</span></Label>
              <Input id="tour_days" type="number" min={1} {...register('duration_days')} />
              {errors.duration_days && <p className="text-destructive text-xs">{errors.duration_days.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour_price">Giá từ (VND)</Label>
              <Input id="tour_price" type="number" min={0} {...register('price_from_vnd')} placeholder="500000" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour_guests">Số khách tối đa</Label>
              <Input id="tour_guests" type="number" min={1} {...register('max_guests')} placeholder="20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tour_start">Điểm xuất phát</Label>
              <Input id="tour_start" {...register('start_location_vi')} placeholder="Ninh Bình" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour_end">Điểm kết thúc</Label>
              <Input id="tour_end" {...register('end_location_vi')} placeholder="Ninh Bình" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="tour_province">Mã tỉnh</Label>
              <Input id="tour_province" {...register('province_code')} placeholder="37" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tour_status">Trạng thái</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as TourStatus)}
              >
                <SelectTrigger id="tour_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Tạm dừng</SelectItem>
                  <SelectItem value="archived">Lưu trữ</SelectItem>
                  <SelectItem value="published">Đã xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="tour_cover">URL ảnh bìa</Label>
            <Input id="tour_cover" {...register('cover_image_url')} placeholder="https://..." />
            {errors.cover_image_url && <p className="text-destructive text-xs">{errors.cover_image_url.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="tour_desc">Mô tả</Label>
            <Textarea id="tour_desc" {...register('description_vi')} rows={3} placeholder="Mô tả tour..." />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="tour_featured"
              checked={watch('is_featured')}
              onCheckedChange={(checked) => setValue('is_featured', !!checked)}
            />
            <Label htmlFor="tour_featured" className="cursor-pointer">Tour nổi bật</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
