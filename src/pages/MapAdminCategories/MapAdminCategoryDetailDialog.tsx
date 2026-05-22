import type { JSX } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import type { MapAdminCategory } from '@/types/api'
import { formatDateTime } from '@/lib/date'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: MapAdminCategory | null
}

export default function MapAdminCategoryDetailDialog({ open, onOpenChange, category }: Props): JSX.Element {
  if (!category) return <></>

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Chi tiết danh mục</DialogTitle>
        <DialogDescription>{category.name}</DialogDescription>

        <div className="space-y-3 pt-2">
          <Row label="Tên danh mục" value={category.name} />
          <Row label="Mô tả" value={category.description ?? '-'} />
          <Row
            label="Thứ tự"
            value={category.sort_order != null ? String(category.sort_order) : '-'}
          />
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground w-32 shrink-0 text-sm">Trạng thái</span>
            <StatusDotBadge
              label={category.is_active ? 'Hoạt động' : 'Ngừng'}
              badgeClass={
                category.is_active
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-muted text-muted-foreground border-border'
              }
              dotClass={category.is_active ? 'bg-success' : 'bg-muted-foreground'}
            />
          </div>
          {category.created_at && (
            <Row label="Ngày tạo" value={formatDateTime(category.created_at)} />
          )}
          {category.updated_at && (
            <Row label="Cập nhật lúc" value={formatDateTime(category.updated_at)} />
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
