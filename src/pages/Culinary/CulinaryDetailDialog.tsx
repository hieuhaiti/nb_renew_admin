import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { culinaryService, useApiQuery } from '@/service'
import type { ApiResponse, Culinary } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'

interface CulinaryDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  culinaryId: string | null
}

export default function CulinaryDetailDialog({
  open,
  onOpenChange,
  culinaryId,
}: CulinaryDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['culinary', culinaryId],
    () => culinaryService.getById(culinaryId!),
    { enabled: !!culinaryId && open, staleTime: 0 },
    false,
    false
  )
  const item = (dbQuery.data as ApiResponse<Culinary>)?.data ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogTitle>Chi tiết ẩm thực</DialogTitle>
        <DialogDescription>Thông tin chi tiết món ẩm thực đã chọn</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !item ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            {item.cover_image_url && (
              <img
                src={parseLink(item.cover_image_url)}
                alt={item.name}
                className="h-90 w-full cursor-zoom-in rounded border object-cover"
                onClick={(e) => {
                  e.stopPropagation()
                  openLightbox(parseLink(item.cover_image_url!))
                }}
              />
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{item.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên:</span>
              <span className="col-span-2 font-medium">{item.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Phân loại:</span>
              <span className="col-span-2">{item.category || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mô tả:</span>
              <span className="col-span-2 text-sm">{item.description || '-'}</span>
            </div>
            {item.recipe && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Công thức:</span>
                <span className="col-span-2 text-sm">{item.recipe}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tỉnh/Thành:</span>
              <span className="col-span-2">{item.province_name || item.province_code || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Đánh giá:</span>
              <span className="col-span-2">
                {item.rating_avg ?? '-'}
                {item.rating_count > 0 && (
                  <span className="text-muted-foreground ml-1 text-xs">({item.rating_count} lượt)</span>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Đặc sản:</span>
              <span className="col-span-2">
                {item.is_speciality ? (
                  <Badge variant="default">Đặc sản</Badge>
                ) : (
                  <Badge variant="outline">Không</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">
                {item.created_at ? formatDateTime(item.created_at) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2">
                {item.updated_at ? formatDateTime(item.updated_at) : '-'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
