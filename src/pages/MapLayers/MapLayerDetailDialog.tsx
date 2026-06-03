import type { JSX } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import type { MapLayer } from '@/types/api'
import { formatDateTime } from '@/lib/date'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  layer: MapLayer | null
}

function getLayerName(layer: MapLayer): string {
  return layer.name_vi || layer.name || '-'
}

function getLayerType(layer: MapLayer): string {
  return layer.layer_type || layer.geometry_type || '-'
}

function isLayerActive(layer: MapLayer): boolean {
  if (typeof layer.is_active === 'boolean') return layer.is_active
  return layer.status === 'active'
}

export default function MapLayerDetailDialog({ open, onOpenChange, layer }: Props): JSX.Element {
  if (!layer) return <></>
  const active = isLayerActive(layer)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Chi tiết lớp bản đồ</DialogTitle>
        <DialogDescription>{getLayerName(layer)}</DialogDescription>

        <div className="space-y-3 pt-2">
          <Row label="ID" value={String(layer.id)} />
          <Row label="Tên lớp" value={getLayerName(layer)} />
          <Row
            label="Danh mục"
            value={(layer as MapLayer & { category_name?: string }).category_name ?? '-'}
          />
          <Row label="Loại lớp" value={getLayerType(layer)} />
          <Row
            label="URL nguồn"
            value={(layer as MapLayer & { source_url?: string }).source_url ?? '-'}
          />
          <Row
            label="Thứ tự"
            value={
              (layer as MapLayer & { sort_order?: number }).sort_order != null
                ? String((layer as MapLayer & { sort_order?: number }).sort_order)
                : '-'
            }
          />
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground w-32 shrink-0 text-sm">Trạng thái</span>
            <StatusDotBadge
              label={active ? 'Hoạt động' : 'Ngừng'}
              badgeClass={
                active
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-muted text-muted-foreground border-border'
              }
              dotClass={active ? 'bg-success' : 'bg-muted-foreground'}
            />
          </div>
          {layer.created_at && <Row label="Ngày tạo" value={formatDateTime(layer.created_at)} />}
          {layer.updated_at && (
            <Row label="Cập nhật lúc" value={formatDateTime(layer.updated_at)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground w-32 shrink-0 text-sm">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
