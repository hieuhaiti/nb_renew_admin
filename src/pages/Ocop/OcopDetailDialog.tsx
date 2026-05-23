import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ocopService, useApiQuery } from '@/service'
import type { ApiResponse, OcopProduct } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { Pen } from 'lucide-react'

const STAR_LABELS: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' }

interface OcopDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ocopId: string | null
  onEdit?: () => void
}

export default function OcopDetailDialog({ open, onOpenChange, ocopId, onEdit }: OcopDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['ocop', ocopId],
    () => ocopService.getById(ocopId!),
    { enabled: !!ocopId && open, staleTime: 0 },
    false,
    false
  )
  const item = (dbQuery.data as ApiResponse<OcopProduct>)?.data ?? null

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
        <DialogTitle>Chi tiết sản phẩm OCOP</DialogTitle>
        <DialogDescription>Thông tin chi tiết sản phẩm OCOP</DialogDescription>

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
              <span className="font-semibold">Phân loại:</span>
              <span className="col-span-2">{item.category || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Nhà sản xuất:</span>
              <span className="col-span-2">{item.producer_name || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Số chứng nhận:</span>
              <span className="col-span-2">{item.certification_no || '-'}</span>
            </div>
            {item.certified_at && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ngày cấp:</span>
                <span className="col-span-2">{formatDateTime(item.certified_at)}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Sao OCOP:</span>
              <span className="col-span-2 text-warning">
                {item.star_rating != null ? STAR_LABELS[item.star_rating] : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Giá:</span>
              <span className="col-span-2">
                {item.price_vnd != null
                  ? `${Number(item.price_vnd).toLocaleString('vi-VN')}đ${item.unit ? `/${item.unit}` : ''}`
                  : '-'}
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
            {item.business_name && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Doanh nghiệp:</span>
                <span className="col-span-2">{item.business_name}</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                {item.is_active ? <Badge variant="default">Hoạt động</Badge> : <Badge variant="outline">Ẩn</Badge>}
              </span>
            </div>
            {item.shop_url && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Shop URL:</span>
                <span className="col-span-2 break-all text-sm">{item.shop_url}</span>
              </div>
            )}
            {(item.lat != null || item.lng != null) && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Tọa độ:</span>
                <span className="col-span-2 font-mono text-sm">{item.lat}, {item.lng}</span>
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
