import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { spotCategoryService, useApiQuery } from '@/service'
import type { ApiResponse, SpotCategory } from '@/types/api'
import { formatDateTime } from '@/lib/date'

interface CategoryDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: number | null
}

export default function CategoryDetailDialog({
  open,
  onOpenChange,
  categoryId,
}: CategoryDetailDialogProps) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chi tiết danh mục</DialogTitle>
        <DialogDescription>Thông tin chi tiết danh mục điểm du lịch</DialogDescription>

        {category ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2">{category.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Code:</span>
              <span className="col-span-2 font-mono text-sm">{category.code}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên (VI):</span>
              <span className="col-span-2">{category.name_vi}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên (EN):</span>
              <span className="col-span-2 text-muted-foreground">{category.name_en || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Danh mục cha:</span>
              <span className="col-span-2 text-muted-foreground">{category.parent_id ?? '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Màu:</span>
              <span className="col-span-2">
                {category.color_hex ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="border-border inline-block h-4 w-4 rounded border"
                      style={{ backgroundColor: category.color_hex }}
                    />
                    <span className="font-mono text-xs">{category.color_hex}</span>
                  </span>
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Thứ tự:</span>
              <span className="col-span-2">{category.sort_order}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                {category.is_active ? (
                  <Badge variant="default">Đang hoạt động</Badge>
                ) : (
                  <Badge variant="secondary">Ngừng hoạt động</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2 text-sm">
                {category.created_at ? formatDateTime(category.created_at) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2 text-sm">
                {category.updated_at ? formatDateTime(category.updated_at) : '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
