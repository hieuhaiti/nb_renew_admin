import type { JSX } from 'react'
import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiQuery, useApiMutation, capacityService, spotService } from '@/service'
import { SearchSelect } from '@/components/common/SearchSelect'
import type { ApiResponse, CapacityConfig, CapacityConfigBody, SpotListData } from '@/types/api'
import { useForm, Controller, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { STALE_REF } from '@/constant/queryConstant'

const configSchema = z.object({
  spot_id: z.string().min(1, 'Vui lòng chọn điểm tham quan'),
  max_capacity: z.coerce.number().int().min(1, 'Sức chứa tối đa phải ≥ 1'),
  alert_threshold_pct: z.coerce.number().min(1).max(100, 'Ngưỡng cảnh báo phải 1–100'),
})
type ConfigFormValues = z.infer<typeof configSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editConfig?: CapacityConfig | null
  onSuccess: () => void
}

export default function CapacityConfigFormDialog({
  open,
  onOpenChange,
  editConfig,
  onSuccess,
}: Props): JSX.Element {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema) as Resolver<ConfigFormValues>,
    defaultValues: { spot_id: '', max_capacity: 1000, alert_threshold_pct: 80 },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        editConfig
          ? {
              spot_id: editConfig.spot_id,
              max_capacity: editConfig.max_capacity,
              alert_threshold_pct: editConfig.alert_threshold_pct,
            }
          : { spot_id: '', max_capacity: 1000, alert_threshold_pct: 80 }
      )
    }
  }, [open, editConfig, form])

  const spotsQuery = useApiQuery(
    ['spots-for-config'],
    () => spotService.getAll({ limit: 200, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_REF, enabled: open },
    false,
    false
  )
  const spots = (spotsQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []

  const mutation = useApiMutation(
    (data: CapacityConfigBody) => capacityService.saveConfig(data),
    {
      onSuccess: () => {
        onOpenChange(false)
        onSuccess()
      },
    },
    true
  )

  const onSubmit: SubmitHandler<ConfigFormValues> = (values) => {
    mutation.mutate({
      spot_id: values.spot_id,
      max_capacity: values.max_capacity,
      alert_threshold_pct: values.alert_threshold_pct,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{editConfig ? 'Cập nhật cấu hình' : 'Thêm cấu hình cảnh báo'}</DialogTitle>
        <DialogDescription>
          Đặt ngưỡng cảnh báo và sức chứa tối đa cho điểm tham quan
        </DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>
              Điểm tham quan <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={form.control}
              name="spot_id"
              render={({ field }) => (
                <SearchSelect
                  options={spots.map((s) => ({ value: s.id, label: s.name_vi ?? s.slug ?? s.id }))}
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  placeholder="Chọn điểm tham quan..."
                  disabled={!!editConfig}
                  className="w-full"
                />
              )}
            />
            {form.formState.errors.spot_id && (
              <p className="text-destructive text-xs">{form.formState.errors.spot_id.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cfg_max_capacity">
              Sức chứa tối đa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cfg_max_capacity"
              type="number"
              min={1}
              {...form.register('max_capacity')}
            />
            {form.formState.errors.max_capacity && (
              <p className="text-destructive text-xs">
                {form.formState.errors.max_capacity.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cfg_threshold">
              Ngưỡng cảnh báo (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cfg_threshold"
              type="number"
              min={1}
              max={100}
              {...form.register('alert_threshold_pct')}
            />
            {form.formState.errors.alert_threshold_pct && (
              <p className="text-destructive text-xs">
                {form.formState.errors.alert_threshold_pct.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
