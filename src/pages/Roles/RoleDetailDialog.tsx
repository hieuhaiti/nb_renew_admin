import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { Role } from '@/types/api'
import { formatDate } from '@/lib/date'
import { Pen } from 'lucide-react'

interface RoleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onEdit?: () => void
}

export default function RoleDetailDialog({ open, onOpenChange, role, onEdit }: RoleDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        actions={
          onEdit && !role?.is_system ? (
            <button
              onClick={onEdit}
              title="Chỉnh sửa"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          ) : undefined
        }
      >
        <DialogTitle>Chi tiết vai trò</DialogTitle>
        <DialogDescription>Thông tin chi tiết vai trò đã chọn</DialogDescription>

        {role ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2">{role.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên vai trò:</span>
              <span className="col-span-2 font-medium">{role.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mô tả:</span>
              <span className="text-muted-foreground col-span-2">{role.description || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Loại:</span>
              <span className="col-span-2">
                {role.is_system ? (
                  <Badge variant="outline">Hệ thống</Badge>
                ) : (
                  <Badge variant="secondary">Tùy chỉnh</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{role.created_at ? formatDate(role.created_at) : '-'}</span>
            </div>
            {role.updated_at && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Cập nhật:</span>
                <span className="col-span-2">{formatDate(role.updated_at)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
