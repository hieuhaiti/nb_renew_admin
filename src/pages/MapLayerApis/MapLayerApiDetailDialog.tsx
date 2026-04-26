import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mapLayerApiService, useApiQuery } from '@/service'
import type { ApiResponse, MapLayerApi } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { getMappedErrorMessage } from '@/validators/mapLayerApiValidators'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { STATUS_LABEL, STATUS_CLASS, STATUS_DOT } from '@/constant/mapLayerApiConstant'

interface MapLayerApiDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  apiId: number | null
}

export default function MapLayerApiDetailDialog({
  open,
  onOpenChange,
  apiId,
}: MapLayerApiDetailDialogProps) {
  const detailQuery = useApiQuery(
    ['mapLayerApiDetailDialog', apiId],
    () => mapLayerApiService.getById(apiId!),
    { enabled: !!apiId && open, staleTime: 0 },
    false,
    false
  )

  const api = ((detailQuery.data as ApiResponse<{ api: MapLayerApi }> | undefined)?.data?.api ??
    null) as MapLayerApi | null

  const errorMessage = detailQuery.error
    ? getMappedErrorMessage(detailQuery.error, 'Không tải được chi tiết API')
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogTitle>Chi tiết API lớp bản đồ</DialogTitle>
        <DialogDescription>Thông tin chi tiết API đã chọn</DialogDescription>

        {errorMessage && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {detailQuery.isLoading && <div className="mt-4">Đang tải dữ liệu...</div>}

        {api ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2">{api.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Tên API:</span>
              <span className="col-span-2">{api.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Slug:</span>
              <span className="col-span-2 font-mono text-sm">{api.slug}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Danh mục:</span>
              <span className="col-span-2">{api.category_name ?? `#${api.category_id}`}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Endpoint URL:</span>
              <span className="col-span-2 font-mono text-sm break-all">{api.endpoint_url}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">HTTP Method:</span>
              <span className="col-span-2">{api.http_method}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái:</span>
              <span className="col-span-2">
                <StatusDotBadge
                  label={STATUS_LABEL[api.status]}
                  badgeClass={STATUS_CLASS[api.status]}
                  dotClass={STATUS_DOT[api.status]}
                />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Mô tả:</span>
              <span className="col-span-2">{api.description || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Published At:</span>
              <span className="col-span-2">
                {api.published_at ? formatDateTime(api.published_at) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">{formatDateTime(api.created_at)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2">{formatDateTime(api.updated_at)}</span>
            </div>
          </div>
        ) : (
          !detailQuery.isLoading && (
            <div className="text-muted-foreground mt-4">Không có dữ liệu</div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
