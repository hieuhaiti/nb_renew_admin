import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { AuditLog } from '@/types/api'
import { formatDateTime } from '@/lib/date'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

export default function AuditLogDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogDescription>Thông tin chi tiết bản ghi nhật ký hệ thống</DialogDescription>

        {log ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{log.id}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Người dùng:</span>
              <span className="col-span-2">
                {log.user ? (
                  <span>
                    <span className="font-medium">{log.user.full_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({log.user.email})</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Khách / Hệ thống</span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Hành động:</span>
              <span className="col-span-2 font-mono text-sm">{log.action}</span>
            </div>

            {log.entity_type != null && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Loại thực thể:</span>
                <span className="col-span-2 text-sm">{log.entity_type}</span>
              </div>
            )}

            {log.entity_id != null && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">ID thực thể:</span>
                <span className="col-span-2 font-mono text-sm">{log.entity_id}</span>
              </div>
            )}

            {log.old_value != null && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Giá trị cũ:</span>
                <div className="col-span-2">
                  <pre className="bg-muted max-h-48 overflow-y-auto rounded-md p-3 text-xs">
                    {JSON.stringify(log.old_value, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {log.new_value != null && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Giá trị mới:</span>
                <div className="col-span-2">
                  <pre className="bg-muted max-h-48 overflow-y-auto rounded-md p-3 text-xs">
                    {JSON.stringify(log.new_value, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {log.ip_address && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Địa chỉ IP:</span>
                <span className="col-span-2 font-mono text-sm">{log.ip_address}</span>
              </div>
            )}

            {log.user_agent && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">User Agent:</span>
                <span className="text-muted-foreground col-span-2 break-all text-xs">
                  {log.user_agent}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Thời gian:</span>
              <span className="col-span-2">{formatDateTime(log.created_at)}</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-4">Không có dữ liệu.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
