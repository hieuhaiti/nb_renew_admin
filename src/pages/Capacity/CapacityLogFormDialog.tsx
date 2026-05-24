import type { JSX } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useApiMutation, capacityService } from '@/service'
import type { CapacityState, CapacityLogBody } from '@/types/api'
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'

const logSchema = z.object({
  visitor_count: z.coerce.number().int().min(0, 'Số khách phải ≥ 0'),
  max_capacity: z.coerce.number().int().min(1).optional().nullable(),
  data_source: z.string().max(100).optional().or(z.literal('')),
})
type LogFormValues = z.infer<typeof logSchema>

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
    defaultValues: { visitor_count: 0, max_capacity: undefined, data_source: '' },
  })

  useEffect(() => {
    if (open && current) {
      form.reset({
        visitor_count: current.visitor_count ?? 0,
        max_capacity: current.max_capacity ?? undefined,
        data_source: '',
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
        ...(values.max_capacity != null && { max_capacity: values.max_capacity }),
        ...(values.data_source && { data_source: values.data_source }),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Ghi nhận lượt khách</DialogTitle>
        <DialogDescription>{spotName}</DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="log_visitor_count">
              Số khách hiện tại <span className="text-destructive">*</span>
            </Label>
            <Input
              id="log_visitor_count"
              type="number"
              min={0}
              {...form.register('visitor_count')}
            />
            {form.formState.errors.visitor_count && (
              <p className="text-destructive text-xs">
                {form.formState.errors.visitor_count.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="log_max_capacity">Sức chứa tối đa (để trống giữ nguyên)</Label>
            <Input id="log_max_capacity" type="number" min={1} {...form.register('max_capacity')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="log_data_source">Nguồn dữ liệu</Label>
            <Input
              id="log_data_source"
              {...form.register('data_source')}
              placeholder="Cổng vào, camera, thủ công..."
            />
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
