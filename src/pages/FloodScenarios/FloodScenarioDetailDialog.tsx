import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { floodScenarioService, useApiQuery } from '@/service'
import type { ApiResponse, FloodScenario } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { Pen } from 'lucide-react'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="col-span-2 text-sm">{children}</span>
    </div>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2 border-b pb-1">{children}</h3>
}

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Quản trị viên nhập',
  AUTO: 'Tự động từ trạm',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: number | null
  onEdit?: () => void
}

export default function FloodScenarioDetailDialog({ open, onOpenChange, scenarioId, onEdit }: Props) {
  const dbQuery = useApiQuery(
    ['flood-scenario', scenarioId],
    () => floodScenarioService.getById(scenarioId!),
    { enabled: scenarioId != null && open, staleTime: 0 },
    false,
    false,
  )

  const item = (dbQuery.data as ApiResponse<FloodScenario>)?.data ?? null

  const fmt = (v: string | null | undefined, unit: string) => {
    if (v == null) return <span className="text-muted-foreground">-</span>
    return `${parseFloat(v)} ${unit}`
  }

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
        <DialogTitle>Chi tiết kịch bản ngập</DialogTitle>
        <DialogDescription>Thông tin chi tiết về kịch bản ngập</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !item ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-2.5">
            <SectionHeading>Thông tin kịch bản</SectionHeading>
            <Row label="ID"><span className="font-mono">{item.id}</span></Row>
            <Row label="Mã"><span className="font-mono">{item.code}</span></Row>
            <Row label="Tên kịch bản"><span className="font-medium">{item.name_vi}</span></Row>
            <Row label="Mô tả">{item.description || '-'}</Row>
            <Row label="Lớp bản đồ">
              <span className="font-mono">{item.layer_code}</span>
              {item.layer && (
                <span className="text-muted-foreground ml-2 text-xs">({item.layer.nameVi})</span>
              )}
            </Row>
            <Row label="Trạng thái">
              {item.is_active ? (
                <Badge variant="outline" className="border-green-500 text-green-600">Đang bật</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">Tắt</Badge>
              )}
            </Row>

            <SectionHeading>Ngưỡng kịch bản</SectionHeading>
            <Row label="Lượng mưa">
              {item.max_rainfall != null
                ? `${parseFloat(item.min_rainfall)} – ${parseFloat(item.max_rainfall)} mm`
                : `≥ ${parseFloat(item.min_rainfall)} mm`}
            </Row>
            <Row label="Mực triều">
              {item.min_tide == null && item.max_tide == null
                ? '-'
                : item.min_tide == null
                  ? `≤ ${parseFloat(item.max_tide!)} m`
                  : item.max_tide == null
                    ? `≥ ${parseFloat(item.min_tide)} m`
                    : `${parseFloat(item.min_tide)} – ${parseFloat(item.max_tide)} m`}
            </Row>

            <SectionHeading>Dữ liệu đầu vào hiện tại</SectionHeading>
            <Row label="Lượng mưa hiện tại">{fmt(item.current_rainfall, 'mm')}</Row>
            <Row label="Nguồn lượng mưa">{SOURCE_LABEL[item.rainfall_source] ?? item.rainfall_source}</Row>
            <Row label="Mực triều hiện tại">{fmt(item.current_tide, 'm')}</Row>
            <Row label="Nguồn mực triều">{SOURCE_LABEL[item.tide_source] ?? item.tide_source}</Row>

            <SectionHeading>Thời gian</SectionHeading>
            <Row label="Ngày tạo">{formatDateTime(item.created_at)}</Row>
            <Row label="Cập nhật lúc">{formatDateTime(item.updated_at)}</Row>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
