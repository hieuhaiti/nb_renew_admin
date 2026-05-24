import type { JSX } from 'react'
import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { MapAdminCategory } from '@/types/api'
import type { MapAdminCategoryFormBody } from '@/service/mapAdminCategoryService'

const schema = z.object({
  code: z.string().min(1, 'Mã danh mục không được rỗng'),
  name_vi: z.string().min(1, 'Tên tiếng Việt không được rỗng'),
  name_en: z.string().optional(),
  description: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  code: '',
  name_vi: '',
  name_en: '',
  description: '',
  sort_order: 0,
  is_active: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: MapAdminCategory | null
  onSubmit: (data: MapAdminCategoryFormBody) => void
  isLoading: boolean
}

export default function MapAdminCategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isLoading,
}: Props): JSX.Element {
  const isEdit = !!category

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
      if (category) {
        reset({
          code: (category as MapAdminCategory & { code?: string }).code ?? '',
          name_vi: (category as MapAdminCategory & { name_vi?: string }).name_vi ?? category.name ?? '',
          name_en: (category as MapAdminCategory & { name_en?: string }).name_en ?? '',
          description: category.description ?? '',
          sort_order: category.sort_order ?? 0,
          is_active: category.is_active ?? true,
        })
      } else {
        reset(defaultValues)
      }
    }
  }, [category, open, reset])

  function handleFormSubmit(values: FormValues) {
    const payload: MapAdminCategoryFormBody = {
      code: values.code,
      name_vi: values.name_vi,
      ...(values.name_en && { name_en: values.name_en }),
      ...(values.description && { description: values.description }),
      ...(values.sort_order != null && { sort_order: values.sort_order }),
      is_active: values.is_active ?? true,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
        <DialogDescription>
          {isEdit ? `Cập nhật thông tin danh mục "${category?.name}"` : 'Tạo danh mục bản đồ mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat_code">
                Mã danh mục <span className="text-destructive">*</span>
              </Label>
              <Input id="cat_code" {...register('code')} placeholder="vd: NATURE" />
              {errors.code && (
                <p className="text-destructive text-xs">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat_sort_order">Thứ tự</Label>
              <Input
                id="cat_sort_order"
                type="number"
                min={0}
                {...register('sort_order')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat_name_vi">
              Tên tiếng Việt <span className="text-destructive">*</span>
            </Label>
            <Input id="cat_name_vi" {...register('name_vi')} placeholder="Tên danh mục" />
            {errors.name_vi && (
              <p className="text-destructive text-xs">{errors.name_vi.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat_name_en">Tên tiếng Anh</Label>
            <Input id="cat_name_en" {...register('name_en')} placeholder="Category name" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat_description">Mô tả</Label>
            <Input id="cat_description" {...register('description')} placeholder="Mô tả ngắn" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="cat_is_active"
              checked={watch('is_active') ?? true}
              onCheckedChange={(v) => setValue('is_active', Boolean(v))}
            />
            <Label htmlFor="cat_is_active" className="cursor-pointer">
              Đang hoạt động
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
