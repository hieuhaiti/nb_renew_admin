import type { JSX } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { useApiMutation, capacityService } from '@/service'
import type { CapacityState, CapacityLogBody, CapacityStatus } from '@/types/api'
import { useForm, Controller, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { ArrowDown } from 'lucide-react'

const DATA_SOURCE_OPTIONS = [
  { value: 'manual', label: 'Thủ công' },
  { value: 'iot', label: 'IoT' },
  { value: 'api', label: 'API' },
  { value: 'realtime', label: 'Realtime' },
] as const

const logSchema = z.object({
  visitor_count: z.coerce.number().int().min(0, 'Số khách phải ≥ 0'),
  data_source: z.enum(['manual', 'iot', 'api', 'realtime']).optional(),
})
type LogFormValues = z.infer<typeof logSchema>

const STATUS_LABEL: Record<CapacityStatus, string> = {
  normal: 'Bình thường',
  moderate: 'Vừa phải',
  busy: 'Đông khách',
  near_full: 'Gần đầy',
  overloaded: 'Quá tải',
  closed: 'Đóng cửa',
}
const STATUS_CLASS: Record<CapacityStatus, string> = {
  normal: 'bg-success/10 text-success border-success/20',
  moderate: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
  busy: 'bg-warning/10 text-warning border-warning/20',
  near_full: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  overloaded: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted/40 text-muted-foreground border-border',
}
const STATUS_DOT: Record<CapacityStatus, string> = {
  normal: 'bg-success',
  moderate: 'bg-sky-500',
  busy: 'bg-warning',
  near_full: 'bg-orange-500',
  overloaded: 'bg-destructive',
  closed: 'bg-muted-foreground',
}

function predictStatus(pct: number): CapacityStatus {
  if (pct >= 100) return 'overloaded'
  if (pct >= 85) return 'near_full'
  if (pct >= 60) return 'busy'
  return 'normal'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string | null
  spotName: string
  current: CapacityState | null
  onSuccess: () => void
}

export default function CapacityLogFormDialog({
  open,
  onOpenChange,
  spotId,
  spotName,
  current,
  onSuccess,
}: Props): JSX.Element {
  const form = useForm<LogFormValues>({
    resolver: zodResolver(logSchema) as Resolver<LogFormValues>,
    defaultValues: { visitor_count: 0, data_source: undefined },
  })

  useEffect(() => {
    if (open && current) {
      form.reset({
        visitor_count: current.visitor_count ?? 0,
        data_source: undefined,
      })
    }
  }, [open, current, form])

  const mutation = useApiMutation(
    (payload: { spotId: string; data: CapacityLogBody }) =>
      capacityService.log(payload.spotId, payload.data),
    {
      onSuccess: () => {
        onOpenChange(false)
        onSuccess()
      },
    },
    true
  )

  const onSubmit: SubmitHandler<LogFormValues> = (values) => {
    if (!spotId) return
    mutation.mutate({
      spotId,
      data: {
        visitor_count: values.visitor_count,
        ...(values.data_source && { data_source: values.data_source }),
      },
    })
  }

  const visitorCount = form.watch('visitor_count')
  const maxCap = current?.max_capacity ?? null
  const currentPct = current?.capacity_pct != null ? parseFloat(current.capacity_pct) : null
  const predictedPct = maxCap != null && visitorCount >= 0 ? (visitorCount / maxCap) * 100 : null
  const predictedStatus = predictedPct != null ? predictStatus(predictedPct) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="">
        <DialogTitle>Ghi nhận lượt khách</DialogTitle>
        <DialogDescription>{spotName}</DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex gap-5 pt-2">
            {/* ── Form fields ── */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="log_visitor_count">
                  Số khách hiện tại <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="log_visitor_count"
                    type="number"
                    min={0}
                    className="flex-1"
                    {...form.register('visitor_count')}
                  />
                  {maxCap != null && (
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      / {maxCap}
                    </span>
                  )}
                </div>
                {form.formState.errors.visitor_count && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.visitor_count.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="log_data_source">Nguồn dữ liệu</Label>
                <Controller
                  control={form.control}
                  name="data_source"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v || undefined)}
                    >
                      <SelectTrigger id="log_data_source">
                        <SelectValue placeholder="Chọn nguồn..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_SOURCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* ── Comparison panel ── */}
            <div className="w-44 shrink-0">
              <div className="bg-muted/30 rounded-md border p-3 text-xs">
                {/* Current */}
                <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                  Hiện tại
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khách</span>
                    <span className="font-medium tabular-nums">
                      {current?.visitor_count ?? '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tỷ lệ</span>
                    <span className="font-medium tabular-nums">
                      {currentPct != null ? `${currentPct.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div className="pt-0.5">
                    {current?.status ? (
                      <StatusDotBadge
                        label={STATUS_LABEL[current.status as CapacityStatus]}
                        badgeClass={STATUS_CLASS[current.status as CapacityStatus]}
                        dotClass={STATUS_DOT[current.status as CapacityStatus]}
                      />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                <div className="my-3 flex items-center justify-center">
                  <ArrowDown className="text-muted-foreground size-4" />
                </div>

                {/* Predicted */}
                <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                  Sau khi lưu
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khách</span>
                    <span className="font-medium tabular-nums">{visitorCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tỷ lệ</span>
                    <span className="font-medium tabular-nums">
                      {predictedPct != null ? `${predictedPct.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                  <div className="pt-0.5">
                    {predictedStatus ? (
                      <StatusDotBadge
                        label={STATUS_LABEL[predictedStatus]}
                        badgeClass={STATUS_CLASS[predictedStatus]}
                        dotClass={STATUS_DOT[predictedStatus]}
                      />
                    ) : maxCap == null ? (
                      <span className="text-muted-foreground text-[10px]">
                        Chưa có max_capacity
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
