import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { festivalService, useApiQuery } from '@/service'
import type { ApiResponse, Festival } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/date'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { Pen } from 'lucide-react'

interface FestivalDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  festivalId: string | null
  onEdit?: () => void
}

export default function FestivalDetailDialog({ open, onOpenChange, festivalId, onEdit }: FestivalDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['festival', festivalId],
    () => festivalService.getById(festivalId!),
    { enabled: !!festivalId && open, staleTime: 0 },
    false,
    false
  )
  const item = (dbQuery.data as ApiResponse<Festival>)?.data ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-lg overflow-y-auto"
        actions={
          onEdit && (
            <button onClick={onEdit} title="Chỉnh sửa" className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none">
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết lễ hội</DialogTitle>
        <DialogDescription>Thông tin chi tiết lễ hội / sự kiện</DialogDescription>

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
                onClick={() => openLightbox(parseLink(item.cover_image_url!))}
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
              <span className="font-semibold">Loại:</span>
              <span className="col-span-2">{item.festival_type || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Địa điểm:</span>
              <span className="col-span-2">{item.location_name || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Thời gian:</span>
              <span className="col-span-2">
                {item.start_date ? formatDate(item.start_date) : '-'}
                {item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mô tả:</span>
              <span className="col-span-2 text-sm">{item.description || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tỉnh:</span>
              <span className="col-span-2">{item.province_name || item.province_code || '-'}</span>
            </div>
            {item.spot_name && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Điểm tham quan:</span>
                <span className="col-span-2">{item.spot_name}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Định kỳ:</span>
              <span className="col-span-2">
                {item.is_recurring ? <Badge variant="default">Có</Badge> : <Badge variant="outline">Không</Badge>}
              </span>
            </div>
            {item.is_recurring && item.recurrence_rule && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Chu kỳ:</span>
                <span className="col-span-2 font-mono text-sm">{item.recurrence_rule}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                {item.is_published ? <Badge variant="default">Đã xuất bản</Badge> : <Badge variant="outline">Nháp</Badge>}
              </span>
            </div>
            {item.website && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Website:</span>
                <span className="col-span-2 break-all text-sm">{item.website}</span>
              </div>
            )}
            {(item.lat != null || item.lng != null) && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Tọa độ:</span>
                <span className="col-span-2 font-mono text-sm">
                  {item.lat}, {item.lng}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{item.created_at ? formatDateTime(item.created_at) : '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật lần cuối:</span>
              <span className="col-span-2">{item.updated_at ? formatDateTime(item.updated_at) : '-'}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
