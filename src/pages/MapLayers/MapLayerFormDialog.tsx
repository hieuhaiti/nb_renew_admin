import type { JSX } from 'react'
import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchSelect } from '@/components/common/SearchSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { mapAdminCategoryService, useApiQuery } from '@/service'
import type { ApiResponse, MapAdminCategoryListData, MapLayer } from '@/types/api'
import type { MapLayerFormBody } from '@/service/mapLayerService'
import { STALE_REF } from '@/constant/queryConstant'
import { getMapAdminCategoryItems, getMapAdminCategoryName } from '@/lib/mapAdminCategory'

const LAYER_TYPES = ['geojson', 'vector', 'raster', 'wms', 'mvt', 'xyz'] as const

const schema = z.object({
  code: z.string().min(1, 'Mã lớp không được rỗng'),
  name_vi: z.string().min(1, 'Tên tiếng Việt không được rỗng'),
  name_en: z.string().optional(),
  category_id: z.coerce.number().int().positive('Phải chọn danh mục'),
  layer_type: z.string().min(1, 'Phải chọn loại lớp'),
  source_url: z.string().min(1, 'URL nguồn không được rỗng'),
  min_zoom: z.coerce.number().int().min(0).max(22).optional().nullable(),
  max_zoom: z.coerce.number().int().min(0).max(22).optional().nullable(),
  is_default_visible: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  code: '',
  name_vi: '',
  name_en: '',
  category_id: 0,
  layer_type: '',
  source_url: '',
  min_zoom: null,
  max_zoom: null,
  is_default_visible: true,
  sort_order: 0,
  status: 'active',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  layer?: MapLayer | null
  onSubmit: (data: MapLayerFormBody) => void
  isLoading: boolean
}

export default function MapLayerFormDialog({
  open,
  onOpenChange,
  layer,
  onSubmit,
  isLoading,
}: Props): JSX.Element {
  const isEdit = !!layer

  const categoryQuery = useApiQuery(
    ['map-admin-categories-ref'],
    () =>
      mapAdminCategoryService.getAll({
        page: 1,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        is_active: true,
      }),
    { staleTime: STALE_REF, enabled: open },
    false,
    false
  )
  const categories = getMapAdminCategoryItems(
    (categoryQuery.data as ApiResponse<MapAdminCategoryListData>)?.data
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      if (layer) {
        const l = layer as MapLayer & {
          name_vi?: string
          name_en?: string
          code?: string
          layer_type?: string
          source_url?: string
          min_zoom?: number | null
          max_zoom?: number | null
          is_default_visible?: boolean
          sort_order?: number
          status?: 'active' | 'inactive'
        }
        const status =
          l.status ??
          (typeof l.is_active === 'boolean' ? (l.is_active ? 'active' : 'inactive') : 'active')
        reset({
          code: l.code ?? '',
          name_vi: l.name_vi ?? l.name ?? '',
          name_en: l.name_en ?? '',
          category_id: l.category_id ?? 0,
          layer_type: l.layer_type ?? '',
          source_url: l.source_url ?? '',
          min_zoom: l.min_zoom ?? null,
          max_zoom: l.max_zoom ?? null,
          is_default_visible: l.is_default_visible ?? true,
          sort_order: l.sort_order ?? 0,
          status,
        })
      } else {
        reset(defaultValues)
      }
    }
  }, [layer, open, reset])

  function handleFormSubmit(values: FormValues) {
    const payload: MapLayerFormBody = {
      code: values.code,
      name_vi: values.name_vi,
      category_id: values.category_id,
      layer_type: values.layer_type,
      source_url: values.source_url,
      ...(values.name_en && { name_en: values.name_en }),
      ...(values.min_zoom != null && { min_zoom: values.min_zoom }),
      ...(values.max_zoom != null && { max_zoom: values.max_zoom }),
      is_default_visible: values.is_default_visible,
      ...(values.sort_order != null && { sort_order: values.sort_order }),
      status: values.status,
    }
    onSubmit(payload)
  }

  const categoryIdStr = watch('category_id') ? String(watch('category_id')) : ''
  const layerType = watch('layer_type')
  const status = watch('status')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{isEdit ? 'Chỉnh sửa lớp bản đồ' : 'Thêm lớp bản đồ'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? `Cập nhật cấu hình lớp "${layer?.name_vi ?? layer?.name ?? ''}"`
            : 'Thêm lớp dữ liệu bản đồ mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="layer_code">
                Mã lớp <span className="text-destructive">*</span>
              </Label>
              <Input id="layer_code" {...register('code')} placeholder="vd: OSM_ROAD" />
              {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="layer_sort_order">Thứ tự</Label>
              <Input id="layer_sort_order" type="number" min={0} {...register('sort_order')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="layer_name_vi">
                Tên tiếng Việt <span className="text-destructive">*</span>
              </Label>
              <Input id="layer_name_vi" {...register('name_vi')} placeholder="Tên lớp" />
              {errors.name_vi && (
                <p className="text-destructive text-xs">{errors.name_vi.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="layer_name_en">Tên tiếng Anh</Label>
              <Input id="layer_name_en" {...register('name_en')} placeholder="Layer name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>
                Danh mục <span className="text-destructive">*</span>
              </Label>
              <SearchSelect
                options={categories.map((cat) => ({
                  value: String(cat.id),
                  label: getMapAdminCategoryName(cat),
                }))}
                value={categoryIdStr}
                onValueChange={(v) => setValue('category_id', parseInt(v, 10))}
                placeholder="Chọn danh mục"
                className="w-full"
              />
              {errors.category_id && (
                <p className="text-destructive text-xs">{errors.category_id.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>
                Loại lớp <span className="text-destructive">*</span>
              </Label>
              <Select value={layerType} onValueChange={(v) => setValue('layer_type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  {LAYER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.layer_type && (
                <p className="text-destructive text-xs">{errors.layer_type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="layer_source_url">
              URL nguồn dữ liệu <span className="text-destructive">*</span>
            </Label>
            <Input id="layer_source_url" {...register('source_url')} placeholder="https://..." />
            {errors.source_url && (
              <p className="text-destructive text-xs">{errors.source_url.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="layer_min_zoom">Zoom tối thiểu</Label>
              <Input id="layer_min_zoom" type="number" min={0} max={22} {...register('min_zoom')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="layer_max_zoom">Zoom tối đa</Label>
              <Input id="layer_max_zoom" type="number" min={0} max={22} {...register('max_zoom')} />
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={status ?? 'active'}
                onValueChange={(v) => setValue('status', v as 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Ngừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="layer_default_visible"
              checked={watch('is_default_visible') ?? true}
              onCheckedChange={(v) => setValue('is_default_visible', Boolean(v))}
            />
            <Label htmlFor="layer_default_visible" className="cursor-pointer">
              Hiển thị mặc định
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
