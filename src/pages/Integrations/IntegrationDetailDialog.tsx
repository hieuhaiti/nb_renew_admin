import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { integrationService, useApiQuery } from '@/service'
import type { ApiResponse, Integration, IntegrationLog, IntegrationLogListData } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { STALE_HOT } from '@/constant/queryConstant'

const ACTIVE_LABEL: Record<string, string> = { true: 'Đang hoạt động', false: 'Tắt' }
const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted/40 text-muted-foreground border-border',
}
const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

const LOG_STATUS_LABEL: Record<string, string> = { success: 'Thành công', error: 'Lỗi' }
const LOG_STATUS_CLASS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
}
const LOG_STATUS_DOT: Record<string, string> = {
  success: 'bg-success',
  error: 'bg-destructive',
}

const INTEGRATION_TYPE_LABEL: Record<string, string> = {
  data_sync: 'Đồng bộ dữ liệu',
  booking: 'Đặt chỗ',
  payment: 'Thanh toán',
  notification: 'Thông báo',
  analytics: 'Phân tích',
}

const AUTH_TYPE_LABEL: Record<string, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic: 'Basic Auth',
  none: 'Không xác thực',
}

interface IntegrationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration | null
  onEdit?: () => void
}

export default function IntegrationDetailDialog({
  open,
  onOpenChange,
  integration,
  onEdit,
}: IntegrationDetailDialogProps) {
  const logsQuery = useApiQuery(
    ['integration-logs', integration?.id],
    () => integrationService.getLogs(integration!.id),
    { staleTime: STALE_HOT, enabled: !!integration?.id && open },
    false,
    false
  )
  const logs: IntegrationLog[] =
    (logsQuery.data as ApiResponse<IntegrationLogListData>)?.data?.logs ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        actions={
          onEdit && (
            <button
              onClick={onEdit}
              title="Chỉnh sửa"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết tích hợp</DialogTitle>
        <DialogDescription>Thông tin và nhật ký tích hợp dịch vụ bên ngoài</DialogDescription>

        {!integration ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-4">
            {/* ── Info ── */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">ID:</span>
                <span className="col-span-2 font-mono text-sm">{integration.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Nhà cung cấp:</span>
                <span className="col-span-2 font-medium">{integration.provider_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Mã:</span>
                <span className="col-span-2 font-mono text-sm">{integration.provider_code}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Loại tích hợp:</span>
                <span className="col-span-2">
                  {INTEGRATION_TYPE_LABEL[integration.integration_type] ?? integration.integration_type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Xác thực:</span>
                <span className="col-span-2">
                  {AUTH_TYPE_LABEL[integration.auth_type] ?? integration.auth_type}
                </span>
              </div>
              {integration.base_url && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-semibold">Base URL:</span>
                  <span className="col-span-2 break-all text-sm">{integration.base_url}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Trạng thái:</span>
                <span className="col-span-2">
                  <StatusDotBadge
                    label={ACTIVE_LABEL[String(integration.is_active)]}
                    badgeClass={ACTIVE_CLASS[String(integration.is_active)]}
                    dotClass={ACTIVE_DOT[String(integration.is_active)]}
                  />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Đồng bộ lần cuối:</span>
                <span className="col-span-2">{formatDateTime(integration.last_synced_at)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Ngày tạo:</span>
                <span className="col-span-2">{formatDateTime(integration.created_at)}</span>
              </div>
            </div>

            {/* ── Logs ── */}
            <div>
              <h3 className="typo-section-title mb-2">Nhật ký</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sự kiện</TableHead>
                      <TableHead className="w-24">Trạng thái</TableHead>
                      <TableHead>Thông điệp</TableHead>
                      <TableHead className="w-36">Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center py-4">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground text-center py-4">
                          Không có nhật ký
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-medium">{log.event}</TableCell>
                          <TableCell>
                            <StatusDotBadge
                              label={LOG_STATUS_LABEL[log.status] ?? log.status}
                              badgeClass={LOG_STATUS_CLASS[log.status] ?? 'bg-muted/40 text-muted-foreground border-border'}
                              dotClass={LOG_STATUS_DOT[log.status] ?? 'bg-muted-foreground'}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-48 truncate text-sm">
                            {log.message ?? '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDateTime(log.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
