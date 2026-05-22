import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ocopService, useApiQuery } from '@/service'
import type { ApiResponse, OcopProduct, OcopFormBody } from '@/types/api'
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

const ocopSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(255),
  category: z.string().max(100).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  star_rating: z.coerce.number().min(1).max(5).optional(),
  certification_no: z.string().max(100).optional().or(z.literal('')),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  price_vnd: z.coerce.number().min(0).optional(),
  unit: z.string().max(50).optional().or(z.literal('')),
  shop_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  producer_name: z.string().max(255).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  is_active: z.boolean(),
})
type OcopFormValues = z.infer<typeof ocopSchema>

const defaultValues: OcopFormValues = {
  name: '',
  category: '',
  description: '',
  star_rating: undefined,
  certification_no: '',
  cover_image_url: '',
  price_vnd: undefined,
  unit: '',
  shop_url: '',
  producer_name: '',
  province_code: '',
  is_active: true,
}

interface OcopFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ocopId: string | null
  onSubmit: (data: OcopFormBody) => void
  isLoading?: boolean
}

export default function OcopFormDialog({
  open,
  onOpenChange,
  ocopId,
  onSubmit,
  isLoading = false,
}: OcopFormDialogProps) {
  const dbQuery = useApiQuery(
    ['ocop', ocopId],
    () => ocopService.getById(ocopId!),
    { enabled: !!ocopId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<OcopProduct | { product: OcopProduct }>)?.data
  const item =
    rawData && 'id' in rawData
      ? (rawData as OcopProduct)
      : (rawData as { product?: OcopProduct })?.product ?? null
  const isEdit = !!item

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<OcopFormValues>({
      resolver: zodResolver(ocopSchema) as any,
      defaultValues,
    })

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        star_rating: item.star_rating ?? undefined,
        certification_no: item.certification_no || '',
        cover_image_url: item.cover_image_url || '',
        price_vnd: item.price_vnd != null ? Number(item.price_vnd) : undefined,
        unit: item.unit || '',
        shop_url: item.shop_url || '',
        producer_name: item.producer_name || '',
        province_code: item.province_code || '',
        is_active: item.is_active,
      })
    } else {
      reset(defaultValues)
    }
  }, [item, reset, open])

  const handleFormSubmit: SubmitHandler<OcopFormValues> = (formData) => {
    const payload: OcopFormBody = {
      name: formData.name,
      ...(formData.category?.trim() && { category: formData.category }),
      ...(formData.description?.trim() && { description: formData.description }),
      ...(formData.star_rating != null && { star_rating: formData.star_rating }),
      ...(formData.certification_no?.trim() && { certification_no: formData.certification_no }),
      ...(formData.cover_image_url?.trim() && { cover_image_url: formData.cover_image_url }),
      ...(formData.price_vnd != null && { price_vnd: formData.price_vnd }),
      ...(formData.unit?.trim() && { unit: formData.unit }),
      ...(formData.shop_url?.trim() && { shop_url: formData.shop_url }),
      ...(formData.producer_name?.trim() && { producer_name: formData.producer_name }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      is_active: formData.is_active,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa sản phẩm OCOP' : 'Thêm sản phẩm OCOP'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin sản phẩm' : 'Thêm sản phẩm OCOP mới'}
        </DialogDescription>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ocop_name">Tên sản phẩm <span className="text-destructive">*</span></Label>
            <Input id="ocop_name" {...register('name')} placeholder="Tên sản phẩm" />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocop_category">Phân loại</Label>
              <Input id="ocop_category" {...register('category')} placeholder="Loại sản phẩm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocop_producer">Nhà sản xuất</Label>
              <Input id="ocop_producer" {...register('producer_name')} placeholder="Tên nhà sản xuất" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ocop_desc">Mô tả</Label>
            <Textarea id="ocop_desc" {...register('description')} rows={3} placeholder="Mô tả sản phẩm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocop_cert">Số chứng nhận</Label>
              <Input id="ocop_cert" {...register('certification_no')} placeholder="Mã chứng nhận OCOP" />
            </div>
            <div className="space-y-2">
              <Label>Sao OCOP</Label>
              <Select
                value={watch('star_rating') != null ? `${watch('star_rating')}` : ''}
                onValueChange={(v) => setValue('star_rating', v ? parseInt(v, 10) : undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 sao</SelectItem>
                  <SelectItem value="2">2 sao</SelectItem>
                  <SelectItem value="3">3 sao</SelectItem>
                  <SelectItem value="4">4 sao</SelectItem>
                  <SelectItem value="5">5 sao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocop_price">Giá (VNĐ)</Label>
              <Input id="ocop_price" type="number" min={0} {...register('price_vnd')} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ocop_unit">Đơn vị</Label>
              <Input id="ocop_unit" {...register('unit')} placeholder="VD: kg, hộp..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ocop_cover">URL ảnh bìa</Label>
            <Input id="ocop_cover" {...register('cover_image_url')} placeholder="https://..." />
            {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ocop_shop">URL cửa hàng</Label>
            <Input id="ocop_shop" {...register('shop_url')} placeholder="https://..." />
            {errors.shop_url && <p className="text-destructive text-sm">{errors.shop_url.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocop_province">Mã tỉnh</Label>
              <Input id="ocop_province" {...register('province_code')} placeholder="Mã tỉnh" />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={watch('is_active') ? 'true' : 'false'} onValueChange={(v) => setValue('is_active', v === 'true')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Ẩn</SelectItem>
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
