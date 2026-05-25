import type { JSX } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiMutation, capacityService } from '@/service'
import type { CapacityState, CapacitySettingsBody } from '@/types/api'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const settingsSchema = z.object({
  max_capacity: z.coerce.number().int().min(1, 'Sức chứa tối đa phải ≥ 1'),
  alert_threshold_pct: z.coerce.number().min(1).max(100, 'Ngưỡng cảnh báo phải 1–100'),
})
type SettingsFormValues = z.infer<typeof settingsSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  spotId: string | null
  spotName: string
  current: CapacityState | null
  onSuccess: () => void
}

export default function CapacitySettingsFormDialog({
  open,
  onOpenChange,
  spotId,
  spotName,
  current,
  onSuccess,
}: Props): JSX.Element {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormValues>,
    defaultValues: { max_capacity: 100, alert_threshold_pct: 80 },
  })

  useEffect(() => {
    if (open && current) {
      form.reset({
        max_capacity: current.max_capacity ?? 100,
        alert_threshold_pct: current.alert_threshold_pct ?? 80,
      })
    }
  }, [open, current, form])

  const mutation = useApiMutation(
    (payload: { spotId: string; data: CapacitySettingsBody }) =>
      capacityService.updateSettings(payload.spotId, payload.data),
    {
      onSuccess: () => {
        onOpenChange(false)
        onSuccess()
      },
    },
    true
  )

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    if (!spotId) return
    mutation.mutate({
      spotId,
      data: { max_capacity: values.max_capacity, alert_threshold_pct: values.alert_threshold_pct },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Cài đặt sức chứa</DialogTitle>
        <DialogDescription>{spotName}</DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="set_max_capacity">
              Sức chứa tối đa <span className="text-destructive">*</span>
            </Label>
            <Input id="set_max_capacity" type="number" min={1} {...form.register('max_capacity')} />
            {form.formState.errors.max_capacity && (
              <p className="text-destructive text-xs">
                {form.formState.errors.max_capacity.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="set_alert_threshold">
              Ngưỡng cảnh báo (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="set_alert_threshold"
              type="number"
              min={1}
              max={100}
              {...form.register('alert_threshold_pct')}
            />
            <p className="text-muted-foreground text-xs">
              Vạch định mức an toàn cố định — khi <span className="font-mono">tỉ lệ(%)</span>{' '}
              vượt ngưỡng này: AI hạn chế gợi ý điểm đến.
            </p>
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
              {mutation.isPending ? 'Đang lưu...' : 'Lưu cài đặt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
