import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { spotCategoryService, useApiQuery } from '@/service'
import type { ApiResponse, SpotCategory } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { parseLink } from '@/lib/utils'
import { Pen } from 'lucide-react'

interface CategoryDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: number | null
  onEdit?: () => void
}

export default function CategoryDetailDialog({
  open,
  onOpenChange,
  categoryId,
  onEdit,
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
      <DialogContent
        className="max-h-[80vh] max-w-2xl overflow-y-auto"
        actions={
          onEdit && (
            <button onClick={onEdit} title="Chỉnh sửa" className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none">
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          )
        }
      >
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
              <span className="col-span-2 text-muted-foreground">{category.parent_name_vi ?? '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Icon:</span>
              <span className="col-span-2">
                {category.icon_url ? (
                  <img
                    src={parseLink(category.icon_url)}
                    alt="icon"
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  '-'
                )}
              </span>
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
