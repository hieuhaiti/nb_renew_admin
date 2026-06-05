import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { businessService, useApiQuery } from '@/service'
import type { ApiResponse, Business, BusinessFormBody } from '@/types/api'
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
import { BUSINESS_TYPE_OPTIONS } from '@/constant/businessConstant'

// ── Schema ────────────────────────────────────────────────────────────────────

const businessSchema = z.object({
  business_name: z.string().min(1, 'Tên doanh nghiệp không được để trống').max(255),
  business_type: z.string().min(1, 'Loại hình không được để trống'),
  business_code: z.string().max(50).optional().or(z.literal('')),
  tax_id: z.string().max(50).optional().or(z.literal('')),
  license_number: z.string().max(100).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  logo_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  address_vi: z.string().max(255).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  lng: z.coerce.number().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
})
type BusinessFormValues = z.infer<typeof businessSchema>

const defaultValues: BusinessFormValues = {
  business_name: '',
  business_type: '',
  business_code: '',
  tax_id: '',
  license_number: '',
  description_vi: '',
  logo_url: '',
  phone: '',
  email: '',
  website: '',
  address_vi: '',
  province_code: '',
  lng: null,
  lat: null,
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface BusinessFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId: string | null
  onSubmit: (data: BusinessFormBody | Partial<BusinessFormBody>) => void
  isLoading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BusinessFormDialog({
  open,
  onOpenChange,
  businessId,
  onSubmit,
  isLoading = false,
}: BusinessFormDialogProps) {
  const dbQuery = useApiQuery(
    ['business', businessId],
    () => businessService.getById(businessId!),
    { enabled: !!businessId && open, staleTime: 0 },
    false,
    false
  )
  const businessData = (dbQuery.data as ApiResponse<{ business?: Business } | Business>)?.data
  const biz =
    businessData && 'business' in businessData
      ? (businessData.business ?? null)
      : ((businessData as Business | undefined) ?? null)
  const isEdit = !!biz

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (biz) {
      reset({
        business_name: biz.business_name,
        business_type: biz.business_type ?? '',
        business_code: biz.business_code ?? '',
        tax_id: biz.tax_id ?? '',
        license_number: biz.license_number ?? '',
        description_vi: biz.description_vi ?? biz.description ?? '',
        logo_url: biz.logo_url ?? '',
        phone: biz.phone ?? '',
        email: biz.email ?? '',
        website: biz.website ?? '',
        address_vi: biz.address_vi ?? '',
        province_code: biz.province_code ?? '',
        lng: biz.geom?.coordinates[0] ?? null,
        lat: biz.geom?.coordinates[1] ?? null,
      })
    } else {
      reset(defaultValues)
    }
  }, [biz, reset, open])

  const handleFormSubmit: SubmitHandler<BusinessFormValues> = (values) => {
    const body: Partial<BusinessFormBody> = {
      business_name: values.business_name,
      business_type: values.business_type,
      ...(values.business_code && { business_code: values.business_code }),
      ...(values.tax_id && { tax_id: values.tax_id }),
      ...(values.license_number && { license_number: values.license_number }),
      ...(values.description_vi && { description_vi: values.description_vi }),
      ...(values.logo_url && { logo_url: values.logo_url }),
      ...(values.phone && { phone: values.phone }),
      ...(values.email && { email: values.email }),
      ...(values.website && { website: values.website }),
      ...(values.address_vi && { address_vi: values.address_vi }),
      ...(values.province_code && { province_code: values.province_code }),
      ...(values.lng != null && { lng: values.lng }),
      ...(values.lat != null && { lat: values.lat }),
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{isEdit ? 'Cập nhật doanh nghiệp' : 'Thêm doanh nghiệp mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Chỉnh sửa thông tin doanh nghiệp' : 'Điền thông tin để thêm doanh nghiệp mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="biz_name">
                Tên doanh nghiệp <span className="text-destructive">*</span>
              </Label>
              <Input
                id="biz_name"
                {...register('business_name')}
                placeholder="Tên doanh nghiệp..."
              />
              {errors.business_name && (
                <p className="text-destructive text-xs">{errors.business_name.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz_type">
                Loại hình <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('business_type')}
                onValueChange={(v) => setValue('business_type', v)}
              >
                <SelectTrigger id="biz_type">
                  <SelectValue placeholder="Chọn loại hình" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_type && (
                <p className="text-destructive text-xs">{errors.business_type.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="biz_code">Mã doanh nghiệp</Label>
              <Input id="biz_code" {...register('business_code')} placeholder="HTX-NB-001" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz_tax">Mã số thuế</Label>
              <Input id="biz_tax" {...register('tax_id')} placeholder="0123456789" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="biz_license">Số giấy phép</Label>
            <Input id="biz_license" {...register('license_number')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="biz_phone">Điện thoại</Label>
              <Input id="biz_phone" {...register('phone')} placeholder="0229 xxxx xxx" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz_email">Email</Label>
              <Input
                id="biz_email"
                type="email"
                {...register('email')}
                placeholder="contact@example.vn"
              />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="biz_website">Website</Label>
            <Input id="biz_website" {...register('website')} placeholder="https://example.vn" />
            {errors.website && <p className="text-destructive text-xs">{errors.website.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="biz_province">Mã tỉnh</Label>
              <Input id="biz_province" {...register('province_code')} placeholder="37" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz_address">Địa chỉ</Label>
              <Input
                id="biz_address"
                {...register('address_vi')}
                placeholder="Số x, đường y, tỉnh z"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="biz_lng">Kinh độ</Label>
              <Input
                id="biz_lng"
                type="number"
                step="any"
                {...register('lng')}
                placeholder="105.97"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="biz_lat">Vĩ độ</Label>
              <Input
                id="biz_lat"
                type="number"
                step="any"
                {...register('lat')}
                placeholder="20.25"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="biz_logo">URL logo</Label>
            <Input id="biz_logo" {...register('logo_url')} placeholder="https://..." />
            {errors.logo_url && (
              <p className="text-destructive text-xs">{errors.logo_url.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="biz_desc">Mô tả</Label>
            <Textarea
              id="biz_desc"
              {...register('description_vi')}
              rows={4}
              placeholder="Mô tả doanh nghiệp..."
            />
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
