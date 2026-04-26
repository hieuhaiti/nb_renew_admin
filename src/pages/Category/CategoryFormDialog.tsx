import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { spotCategoryService, useApiQuery } from '@/service'
import type { ApiResponse, SpotCategory, SpotCategoryFormBody } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const spotCategorySchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Code không được để trống')
    .max(50, 'Code không được vượt quá 50 ký tự'),
  name_vi: z
    .string()
    .trim()
    .min(1, 'Tên tiếng Việt không được để trống')
    .max(255, 'Tên tiếng Việt không được vượt quá 255 ký tự'),
  name_en: z.string().trim().max(255).optional().or(z.literal('')),
  color_hex: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Màu phải có dạng #RRGGBB')
    .optional()
    .or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean(),
})

type SpotCategoryFormValues = z.infer<typeof spotCategorySchema>

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: number | null
  onSubmit: (data: Partial<SpotCategoryFormBody>) => void
  isLoading?: boolean
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  categoryId,
  onSubmit,
  isLoading = false,
}: CategoryFormDialogProps) {
  const dbQuery = useApiQuery(
    ['spot-category', categoryId],
    () => spotCategoryService.getById(categoryId!),
    { enabled: !!categoryId && open, staleTime: 0 },
    false,
    false
  )

  const rawData = (dbQuery.data as ApiResponse<SpotCategory | { category: SpotCategory }>)?.data
  const category =
    rawData && 'id' in rawData
      ? (rawData as SpotCategory)
      : (rawData as { category?: SpotCategory })?.category
  const isEdit = !!category

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SpotCategoryFormValues>({
    resolver: zodResolver(spotCategorySchema) as any,
    defaultValues: {
      code: '',
      name_vi: '',
      name_en: '',
      color_hex: '',
      sort_order: 0,
      is_active: true,
    },
  })

  useEffect(() => {
    if (category) {
      reset({
        code: category.code,
        name_vi: category.name_vi,
        name_en: category.name_en || '',
        color_hex: category.color_hex || '',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      })
    } else {
      reset({
        code: '',
        name_vi: '',
        name_en: '',
        color_hex: '',
        sort_order: 0,
        is_active: true,
      })
    }
  }, [category, reset, open])

  const handleFormSubmit: SubmitHandler<SpotCategoryFormValues> = (data) => {
    const payload: Partial<SpotCategoryFormBody> = {
      code: data.code,
      name_vi: data.name_vi,
      ...(data.name_en?.trim() && { name_en: data.name_en }),
      ...(data.color_hex?.trim() && { color_hex: data.color_hex }),
      ...(data.sort_order !== undefined && { sort_order: data.sort_order }),
      is_active: data.is_active,
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin danh mục điểm du lịch' : 'Tạo danh mục điểm du lịch mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input id="code" {...register('code')} placeholder="VD: NATURE, HISTORY" />
            {errors.code && <p className="text-destructive text-sm">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name_vi">
              Tên (VI) <span className="text-destructive">*</span>
            </Label>
            <Input id="name_vi" {...register('name_vi')} placeholder="Tên danh mục tiếng Việt" />
            {errors.name_vi && <p className="text-destructive text-sm">{errors.name_vi.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name_en">Tên (EN)</Label>
            <Input id="name_en" {...register('name_en')} placeholder="Category name in English" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color_hex">Màu (hex)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color_hex_picker"
                type="color"
                value={watch('color_hex') || '#2563eb'}
                onChange={(e) => setValue('color_hex', e.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input
                id="color_hex"
                {...register('color_hex')}
                value={watch('color_hex') || ''}
                onChange={(e) => setValue('color_hex', e.target.value)}
                placeholder="#FF5733"
              />
            </div>
            {errors.color_hex && (
              <p className="text-destructive text-sm">{errors.color_hex.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Thứ tự hiển thị</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              {...register('sort_order')}
              placeholder="0"
            />
          </div>

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
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
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
