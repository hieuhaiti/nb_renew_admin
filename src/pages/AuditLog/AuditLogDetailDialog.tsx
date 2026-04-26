import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { AuditLog } from '@/types/api'
import { formatDateTime } from '@/lib/date'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

function methodBadgeVariant(method: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (method) {
    case 'POST':
      return 'default'
    case 'PUT':
    case 'PATCH':
      return 'secondary'
    case 'DELETE':
      return 'destructive'
    default:
      return 'outline'
  }
}

function statusBadgeClass(code: number): string {
  if (code >= 200 && code < 300) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (code >= 400 && code < 500) return 'bg-amber-100 text-amber-700 border-amber-200'
  if (code >= 500) return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
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
              <span className="col-span-2">{log.id}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Người dùng:</span>
              <span className="col-span-2">
                {log.user ? (
                  <span>
                    <span className="font-medium">{log.user.full_name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      ({log.user.username})
                    </span>
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

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Phương thức:</span>
              <span className="col-span-2">
                <Badge variant={methodBadgeVariant(log.method)}>{log.method}</Badge>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Endpoint:</span>
              <span className="col-span-2 font-mono text-sm break-all">{log.endpoint}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mã trạng thái:</span>
              <span className="col-span-2">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(log.status_code)}`}
                >
                  {log.status_code}
                </span>
              </span>
            </div>

            {log.response_time_ms !== undefined && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Thời gian phản hồi:</span>
                <span className="col-span-2">{log.response_time_ms} ms</span>
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
                <span className="text-muted-foreground col-span-2 text-xs break-all">
                  {log.user_agent}
                </span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Thời gian:</span>
              <span className="col-span-2">{formatDateTime(log.created_at)}</span>
            </div>

            {log.request_payload && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Payload:</span>
                <div className="col-span-2">
                  <pre className="bg-muted max-h-64 overflow-y-auto rounded-md p-3 text-xs">
                    {JSON.stringify(log.request_payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground mt-4">Không có dữ liệu.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
