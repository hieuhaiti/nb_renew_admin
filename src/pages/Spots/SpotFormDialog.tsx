import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { spotService, spotCategoryService, useApiQuery } from '@/service'
import type {
  ApiResponse,
  Spot,
  SpotFormBody,
  SpotStatus,
  SpotCategory,
  SpotCategoryListData,
} from '@/types/api'
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

const spotSchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  category_id: z.coerce.number().int().positive().optional(),
  name_en: z.string().max(255).optional().or(z.literal('')),
  slug: z.string().max(255).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  address_vi: z.string().max(500).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.url('URL không hợp lệ').optional().or(z.literal('')),
  ticket_price_adult: z.coerce.number().min(0).optional(),
  ticket_price_child: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'closed']),
  is_featured: z.boolean(),
  max_capacity: z.coerce.number().int().min(0).optional(),
  alert_threshold_pct: z.coerce.number().min(0).max(100).optional(),
  has_vr_360: z.boolean(),
  has_audio_guide: z.boolean(),
})
type SpotFormValues = z.infer<typeof spotSchema>

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

const defaultValues: SpotFormValues = {
  name_vi: '',
  category_id: undefined,
  name_en: '',
  slug: '',
  description_vi: '',
  address_vi: '',
  province_code: '',
  latitude: undefined,
  longitude: undefined,
  phone: '',
  email: '',
  website: '',
  ticket_price_adult: undefined,
  ticket_price_child: undefined,
  max_capacity: undefined,
  alert_threshold_pct: undefined,
  status: 'active',
  is_featured: false,
  has_vr_360: false,
  has_audio_guide: false,
}

interface SpotFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string | null
  onSubmit: (data: SpotFormBody | Partial<SpotFormBody>) => void
  isLoading?: boolean
}

export default function SpotFormDialog({
  open,
  onOpenChange,
  spotId,
  onSubmit,
  isLoading = false,
}: SpotFormDialogProps) {
  const dbQuery = useApiQuery(
    ['spot', spotId],
    () => spotService.getById(spotId!),
    { enabled: !!spotId && open, staleTime: 0 },
    false,
    false
  )
  const spot = (dbQuery.data as ApiResponse<{ spot: Spot }>)?.data?.spot ?? null
  const isEdit = !!spot

  const categoryQuery = useApiQuery(
    ['spot-categories-form'],
    () => spotCategoryService.getAll({ page: 1, limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: 5 * 60 * 1000 },
    false,
    false
  )
  const categories = ((categoryQuery.data as { data?: SpotCategoryListData })?.data?.items ??
    []) as SpotCategory[]

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpotFormValues>({
    resolver: zodResolver(spotSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (spot) {
      reset({
        name_vi: spot.name_vi,
        category_id: spot.category_id ?? undefined,
        name_en: spot.name_en || '',
        slug: spot.slug || '',
        description_vi: spot.description_vi || '',
        address_vi: spot.address_vi || '',
        province_code: spot.province_code || '',
        latitude: spot.latitude ?? undefined,
        longitude: spot.longitude ?? undefined,
        phone: spot.phone || '',
        email: spot.email || '',
        website: spot.website || '',
        ticket_price_adult: toOptionalNumber(spot.ticket_price_adult),
        ticket_price_child: toOptionalNumber(spot.ticket_price_child),
        max_capacity: spot.max_capacity ?? undefined,
        alert_threshold_pct: spot.alert_threshold_pct ?? undefined,
        status: spot.status,
        is_featured: spot.is_featured,
        has_vr_360: spot.has_vr_360,
        has_audio_guide: spot.has_audio_guide,
      })
    } else {
      reset(defaultValues)
    }
  }, [spot, reset, open])

  const handleFormSubmit: SubmitHandler<SpotFormValues> = (formData) => {
    const payload: SpotFormBody = {
      name_vi: formData.name_vi,
      ...(formData.category_id != null && { category_id: formData.category_id }),
      ...(formData.name_en?.trim() && { name_en: formData.name_en }),
      ...(formData.slug?.trim() && { slug: formData.slug }),
      ...(formData.description_vi?.trim() && { description_vi: formData.description_vi }),
      ...(formData.address_vi?.trim() && { address_vi: formData.address_vi }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      ...(formData.latitude != null && { latitude: formData.latitude }),
      ...(formData.longitude != null && { longitude: formData.longitude }),
      ...(formData.phone?.trim() && { phone: formData.phone }),
      ...(formData.email?.trim() && { email: formData.email }),
      ...(formData.website?.trim() && { website: formData.website }),
      ...(formData.ticket_price_adult != null && {
        ticket_price_adult: formData.ticket_price_adult,
      }),
      ...(formData.ticket_price_child != null && {
        ticket_price_child: formData.ticket_price_child,
      }),
      ...(formData.max_capacity != null && { max_capacity: formData.max_capacity }),
      ...(formData.alert_threshold_pct != null && { alert_threshold_pct: formData.alert_threshold_pct }),
      status: formData.status,
      is_featured: formData.is_featured,
      has_vr_360: formData.has_vr_360,
      has_audio_guide: formData.has_audio_guide,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa điểm tham quan' : 'Thêm điểm tham quan'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin điểm tham quan' : 'Thêm điểm tham quan mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spot_category">Danh mục</Label>
            <Select
              value={watch('category_id')?.toString() ?? ''}
              onValueChange={(v) => setValue('category_id', v ? parseInt(v, 10) : undefined)}
            >
              <SelectTrigger id="spot_category" className="w-full">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.parent_name_vi ? `${cat.parent_name_vi} › ${cat.name_vi}` : cat.name_vi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spot_name_vi">
              Tên (VI) <span className="text-destructive">*</span>
            </Label>
            <Input id="spot_name_vi" {...register('name_vi')} placeholder="Tên tiếng Việt" />
            {errors.name_vi && <p className="text-destructive text-sm">{errors.name_vi.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spot_name_en">Tên (EN)</Label>
              <Input id="spot_name_en" {...register('name_en')} placeholder="English name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_slug">Slug</Label>
              <Input id="spot_slug" {...register('slug')} placeholder="vd: hang-mua" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spot_description">Mô tả</Label>
            <Textarea
              id="spot_description"
              {...register('description_vi')}
              rows={3}
              placeholder="Mô tả điểm tham quan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spot_address">Địa chỉ</Label>
            <Input id="spot_address" {...register('address_vi')} placeholder="Địa chỉ tiếng Việt" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spot_province">Mã tỉnh</Label>
              <Input id="spot_province" {...register('province_code')} placeholder="Mã tỉnh" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_lat">Vĩ độ</Label>
              <Input
                id="spot_lat"
                type="number"
                step="any"
                {...register('latitude')}
                placeholder="20.123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_lng">Kinh độ</Label>
              <Input
                id="spot_lng"
                type="number"
                step="any"
                {...register('longitude')}
                placeholder="106.123"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spot_phone">Điện thoại</Label>
              <Input id="spot_phone" {...register('phone')} placeholder="0123456789" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_email">Email</Label>
              <Input
                id="spot_email"
                type="email"
                {...register('email')}
                placeholder="contact@..."
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_website">Website</Label>
              <Input id="spot_website" {...register('website')} placeholder="https://..." />
              {errors.website && (
                <p className="text-destructive text-sm">{errors.website.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticket_adult">Giá vé người lớn (VNĐ)</Label>
              <Input
                id="ticket_adult"
                type="number"
                min={0}
                {...register('ticket_price_adult')}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket_child">Giá vé trẻ em (VNĐ)</Label>
              <Input
                id="ticket_child"
                type="number"
                min={0}
                {...register('ticket_price_child')}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spot_max_capacity">Sức chứa tối đa</Label>
              <Input
                id="spot_max_capacity"
                type="number"
                min={0}
                {...register('max_capacity')}
                placeholder="5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_alert_pct">Ngưỡng cảnh báo (%)</Label>
              <Input
                id="spot_alert_pct"
                type="number"
                min={0}
                max={100}
                {...register('alert_threshold_pct')}
                placeholder="80"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as SpotStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="closed">Đã đóng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nổi bật</Label>
              <Select
                value={watch('is_featured') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_featured', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Nổi bật</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>VR 360°</Label>
              <Select
                value={watch('has_vr_360') ? 'true' : 'false'}
                onValueChange={(v) => setValue('has_vr_360', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Có</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Thuyết minh âm thanh</Label>
              <Select
                value={watch('has_audio_guide') ? 'true' : 'false'}
                onValueChange={(v) => setValue('has_audio_guide', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Có</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
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
