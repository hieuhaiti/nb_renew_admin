import type { JSX } from 'react'
import { useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useApiQuery, useApiMutation, capacityService, spotService, roleService } from '@/service'
import { SearchSelect } from '@/components/common/SearchSelect'
import type { ApiResponse, CapacityConfig, CapacityConfigBody, SpotListData, Role } from '@/types/api'
import { useForm, Controller, type SubmitHandler, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { STALE_REF } from '@/constant/queryConstant'

const configSchema = z
  .object({
    spot_id: z.string().min(1, 'Vui lòng chọn điểm tham quan'),
    threshold_busy: z.coerce.number().int().min(1).max(99, 'Phải 1–99'),
    threshold_near: z.coerce.number().int().min(1).max(99, 'Phải 1–99'),
    threshold_over: z.coerce.number().int().min(1).max(200, 'Phải 1–200'),
    notify_roles: z.array(z.string()).optional(),
  })
  .refine((v) => v.threshold_busy < v.threshold_near, {
    message: 'Ngưỡng đông phải nhỏ hơn ngưỡng gần đầy',
    path: ['threshold_busy'],
  })
  .refine((v) => v.threshold_near < v.threshold_over, {
    message: 'Ngưỡng gần đầy phải nhỏ hơn ngưỡng quá tải',
    path: ['threshold_near'],
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
    defaultValues: {
      spot_id: '',
      threshold_busy: 70,
      threshold_near: 85,
      threshold_over: 100,
      notify_roles: [],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        editConfig
          ? {
              spot_id: editConfig.spot_id,
              threshold_busy: editConfig.threshold_busy,
              threshold_near: editConfig.threshold_near,
              threshold_over: editConfig.threshold_over,
              notify_roles: editConfig.notify_roles ?? [],
            }
          : {
              spot_id: '',
              threshold_busy: 70,
              threshold_near: 85,
              threshold_over: 100,
              notify_roles: [],
            }
      )
    }
  }, [open, editConfig, form])

  const spotsQuery = useApiQuery(
    ['spots-for-config'],
    () => spotService.getAll({ limit: 100, sortBy: 'created_at', sortOrder: 'DESC' }),
    { staleTime: STALE_REF, enabled: open },
    false,
    false
  )
  const spots = (spotsQuery.data as ApiResponse<SpotListData>)?.data?.spots ?? []

  const rolesQuery = useApiQuery(
    ['roles'],
    () => roleService.getAll(),
    { staleTime: STALE_REF, enabled: open },
    false,
    false
  )
  const roles: Role[] = (rolesQuery.data as unknown as ApiResponse<{ roles: Role[] }>)?.data?.roles ?? []

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
      threshold_busy: values.threshold_busy,
      threshold_near: values.threshold_near,
      threshold_over: values.threshold_over,
      notify_roles: values.notify_roles?.length ? values.notify_roles : null,
    })
  }

  const busy = form.watch('threshold_busy')
  const near = form.watch('threshold_near')
  const over = form.watch('threshold_over')
  const cap = over > 0 ? over : 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{editConfig ? 'Cập nhật cấu hình' : 'Thêm cấu hình cảnh báo'}</DialogTitle>
        <DialogDescription>
          Cấu hình nâng cao — đặt ngưỡng % tải trọng chi tiết, hệ thống push thông báo đến vai trò
          quản lý khi vượt mức
        </DialogDescription>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Spot select */}
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

          {/* preview bar */}
          <div className="space-y-1">
            <div className="bg-muted relative h-3 overflow-hidden rounded-full">
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{ width: `${(busy / cap) * 100}%`, backgroundColor: 'hsl(var(--success) / 0.7)' }}
              />
              <div
                className="absolute inset-y-0 transition-all"
                style={{
                  left: `${(busy / cap) * 100}%`,
                  width: `${((near - busy) / cap) * 100}%`,
                  backgroundColor: 'hsl(var(--warning) / 0.7)',
                }}
              />
              <div
                className="absolute inset-y-0 transition-all"
                style={{
                  left: `${(near / cap) * 100}%`,
                  width: `${((over - near) / cap) * 100}%`,
                  backgroundColor: 'rgb(249 115 22 / 0.7)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-success">Bình thường</span>
              <span className="text-warning">Đông</span>
              <span className="text-orange-500">Gần đầy</span>
              <span className="text-destructive">Quá tải</span>
            </div>
          </div>

          {/* Threshold inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cfg_busy" className="text-warning text-xs">
                Đông khách (%)
              </Label>
              <Input id="cfg_busy" type="number" min={1} max={99} {...form.register('threshold_busy')} />
              <p className="text-muted-foreground text-[10px]">Tỷ lệ ≥ ngưỡng này → trạng thái "Đông"</p>
              {form.formState.errors.threshold_busy && (
                <p className="text-destructive text-xs">{form.formState.errors.threshold_busy.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfg_near" className="text-orange-500 text-xs">
                Gần đầy (%)
              </Label>
              <Input id="cfg_near" type="number" min={1} max={99} {...form.register('threshold_near')} />
              <p className="text-muted-foreground text-[10px]">Tỷ lệ ≥ ngưỡng này → trạng thái "Gần đầy"</p>
              {form.formState.errors.threshold_near && (
                <p className="text-destructive text-xs">{form.formState.errors.threshold_near.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cfg_over" className="text-destructive text-xs">
                Quá tải (%)
              </Label>
              <Input id="cfg_over" type="number" min={1} max={200} {...form.register('threshold_over')} />
              <p className="text-muted-foreground text-[10px]">Tỷ lệ ≥ ngưỡng này → trạng thái "Quá tải"</p>
              {form.formState.errors.threshold_over && (
                <p className="text-destructive text-xs">{form.formState.errors.threshold_over.message}</p>
              )}
            </div>
          </div>

          {/* notify_roles */}
          <div className="space-y-1.5">
            <Label>Vai trò nhận thông báo</Label>
            <p className="text-muted-foreground text-xs">
              Push thông báo đến các vai trò này khi lượng khách vượt ngưỡng
            </p>
            <Controller
              control={form.control}
              name="notify_roles"
              render={({ field }) => {
                const selected = field.value ?? []
                return (
                  <div className="max-h-36 overflow-y-auto rounded-md border p-2">
                    {rolesQuery.isLoading ? (
                      <p className="text-muted-foreground py-2 text-center text-xs">Đang tải...</p>
                    ) : roles.length === 0 ? (
                      <p className="text-muted-foreground py-2 text-center text-xs">Không có vai trò</p>
                    ) : (
                      <div className="space-y-2">
                        {roles.map((role) => {
                          const id = String(role.id)
                          return (
                            <label
                              key={role.id}
                              className="flex cursor-pointer items-center gap-2.5"
                            >
                              <Checkbox
                                checked={selected.includes(id)}
                                onCheckedChange={(checked) => {
                                  field.onChange(
                                    checked
                                      ? [...selected, id]
                                      : selected.filter((v) => v !== id)
                                  )
                                }}
                              />
                              <span className="text-sm">{role.name_vi ?? role.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }}
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
