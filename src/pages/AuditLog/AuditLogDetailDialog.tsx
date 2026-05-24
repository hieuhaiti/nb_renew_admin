import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { AuditLog } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import { User, Globe, MonitorSmartphone, Clock, Hash, Layers } from 'lucide-react'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

const ACTION_VERB_CLASS: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
  update: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  delete: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  login:  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
  logout: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
}

function ActionBadge({ action }: { action: string }) {
  const parts = action.split('.')
  const verb = parts[parts.length - 1]
  const module = parts.slice(0, -1).join('.')
  const cls = ACTION_VERB_CLASS[verb] ?? 'bg-muted text-muted-foreground border'
  return (
    <div className="flex items-center gap-2">
      <Badge className={cn('border font-mono text-sm px-3 py-0.5', cls)}>{verb}</Badge>
      {module && <span className="text-muted-foreground font-mono text-sm">{module}</span>}
    </div>
  )
}

const Row = ({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex gap-3">
    <div className="text-muted-foreground mt-0.5 w-4 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-muted-foreground mb-0.5 text-xs">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  </div>
)

export default function AuditLogDetailDialog({ open, onOpenChange, log }: AuditLogDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogDescription>Thông tin chi tiết bản ghi nhật ký hệ thống</DialogDescription>

        {log ? (
          <div className="mt-2 space-y-4">
            {/* Header: action badge + id */}
            <div className="bg-muted/40 flex items-center justify-between rounded-lg border px-4 py-3">
              <ActionBadge action={log.action} />
              <span className="text-muted-foreground font-mono text-xs">#{log.id}</span>
            </div>

            {/* User info */}
            <div className="bg-card rounded-lg border p-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
                Người thực hiện
              </p>
              {log.user ? (
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{log.user.full_name}</p>
                    <p className="text-muted-foreground text-xs">{log.user.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">Khách / Hệ thống</p>
              )}
            </div>

            {/* Metadata */}
            <div className="bg-card grid grid-cols-2 gap-4 rounded-lg border p-4">
              <Row icon={<Clock className="h-4 w-4" />} label="Thời gian">
                {formatDateTime(log.created_at)}
              </Row>
              <Row icon={<Globe className="h-4 w-4" />} label="Địa chỉ IP">
                <span className="font-mono">{log.ip_address || '—'}</span>
              </Row>
              {(log.entity_type || log.entity_id) && (
                <>
                  {log.entity_type && (
                    <Row icon={<Layers className="h-4 w-4" />} label="Loại thực thể">
                      {log.entity_type}
                    </Row>
                  )}
                  {log.entity_id && (
                    <Row icon={<Hash className="h-4 w-4" />} label="ID thực thể">
                      <span className="font-mono">{log.entity_id}</span>
                    </Row>
                  )}
                </>
              )}
            </div>

            {/* User agent */}
            {log.user_agent && (
              <div className="bg-card rounded-lg border p-4">
                <Row icon={<MonitorSmartphone className="h-4 w-4" />} label="User Agent">
                  <span className="text-muted-foreground break-all text-xs">{log.user_agent}</span>
                </Row>
              </div>
            )}

            {/* Old / new values */}
            {(log.old_value != null || log.new_value != null) && (
              <div className="grid grid-cols-2 gap-3">
                {log.old_value != null && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">
                      Giá trị cũ
                    </p>
                    <pre className="bg-red-50 dark:bg-red-950/30 max-h-52 overflow-y-auto rounded-lg border border-red-100 p-3 text-xs dark:border-red-900">
                      {JSON.stringify(log.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_value != null && (
                  <div>
                    <p className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wider">
                      Giá trị mới
                    </p>
                    <pre className="bg-emerald-50 dark:bg-emerald-950/30 max-h-52 overflow-y-auto rounded-lg border border-emerald-100 p-3 text-xs dark:border-emerald-900">
                      {JSON.stringify(log.new_value, null, 2)}
                    </pre>
                  </div>
                )}
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
