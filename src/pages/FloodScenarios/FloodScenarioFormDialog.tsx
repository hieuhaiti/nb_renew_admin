import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { floodScenarioService, useApiQuery } from '@/service'
import type { ApiResponse, FloodScenario, FloodScenarioFormBody } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  code: z.string().min(1, 'Mã kịch bản không được để trống').max(100),
  nameVi: z.string().min(1, 'Tên kịch bản không được để trống').max(255),
  minRainfall: z.coerce.number().min(0, 'Không được âm').default(0),
  maxRainfall: z.coerce.number().min(0, 'Không được âm').nullable().optional(),
  minTide: z.coerce.number().nullable().optional(),
  maxTide: z.coerce.number().nullable().optional(),
  layerCode: z.string().min(1, 'Mã lớp bản đồ không được để trống').max(120),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  currentRainfall: z.coerce.number().min(0).nullable().optional(),
  rainfallSource: z.enum(['MANUAL', 'AUTO']).default('MANUAL'),
  currentTide: z.coerce.number().nullable().optional(),
  tideSource: z.enum(['MANUAL', 'AUTO']).default('MANUAL'),
})

type FormValues = z.infer<typeof schema>

const defaultValues: FormValues = {
  code: '',
  nameVi: '',
  minRainfall: 0,
  maxRainfall: null,
  minTide: null,
  maxTide: null,
  layerCode: '',
  description: null,
  isActive: true,
  currentRainfall: null,
  rainfallSource: 'MANUAL',
  currentTide: null,
  tideSource: 'MANUAL',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenarioId: number | null
  onSubmit: (data: FloodScenarioFormBody) => void
  isLoading?: boolean
}

export default function FloodScenarioFormDialog({ open, onOpenChange, scenarioId, onSubmit, isLoading = false }: Props) {
  const dbQuery = useApiQuery(
    ['flood-scenario', scenarioId],
    () => floodScenarioService.getById(scenarioId!),
    { enabled: scenarioId != null && open, staleTime: 0 },
    false,
    false,
  )

  const item = (dbQuery.data as ApiResponse<FloodScenario>)?.data ?? null
  const isEdit = !!item

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (!open) return
    if (item) {
      reset({
        code: item.code,
        nameVi: item.name_vi,
        minRainfall: parseFloat(item.min_rainfall),
        maxRainfall: item.max_rainfall != null ? parseFloat(item.max_rainfall) : null,
        minTide: item.min_tide != null ? parseFloat(item.min_tide) : null,
        maxTide: item.max_tide != null ? parseFloat(item.max_tide) : null,
        layerCode: item.layer_code,
        description: item.description ?? null,
        isActive: item.is_active,
        currentRainfall: item.current_rainfall != null ? parseFloat(item.current_rainfall) : null,
        rainfallSource: item.rainfall_source,
        currentTide: item.current_tide != null ? parseFloat(item.current_tide) : null,
        tideSource: item.tide_source,
      })
    } else if (scenarioId == null) {
      reset(defaultValues)
    }
  }, [item, open, scenarioId, reset])

  const rainfallSource = watch('rainfallSource')
  const tideSource = watch('tideSource')

  const handleFormSubmit: SubmitHandler<FormValues> = (values) => {
    const body: FloodScenarioFormBody = {
      code: values.code,
      nameVi: values.nameVi,
      minRainfall: values.minRainfall,
      maxRainfall: values.maxRainfall ?? null,
      minTide: values.minTide ?? null,
      maxTide: values.maxTide ?? null,
      layerCode: values.layerCode,
      description: values.description || null,
      isActive: values.isActive,
      currentRainfall: values.currentRainfall ?? null,
      rainfallSource: values.rainfallSource,
      currentTide: values.currentTide ?? null,
      tideSource: values.tideSource,
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{isEdit ? 'Cập nhật kịch bản ngập' : 'Thêm kịch bản ngập'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Chỉnh sửa thông tin kịch bản ngập' : 'Tạo mới kịch bản ngập và liên kết lớp bản đồ'}
        </DialogDescription>

        {scenarioId != null && dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 pt-2">

            {/* ── THÔNG TIN KỊCH BẢN ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Thông tin kịch bản</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="code">Mã kịch bản <span className="text-destructive">*</span></Label>
                  <Input id="code" {...register('code')} placeholder="vd: scenario_heavy" />
                  {errors.code && <p className="text-destructive text-xs">{errors.code.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="layerCode">Mã lớp bản đồ <span className="text-destructive">*</span></Label>
                  <Input id="layerCode" {...register('layerCode')} placeholder="vd: lop_phu_sau_ngap_2024" />
                  {errors.layerCode && <p className="text-destructive text-xs">{errors.layerCode.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="nameVi">Tên kịch bản <span className="text-destructive">*</span></Label>
                <Input id="nameVi" {...register('nameVi')} placeholder="vd: Kịch bản ngập nặng (Mưa 100 - 199mm)" />
                {errors.nameVi && <p className="text-destructive text-xs">{errors.nameVi.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" {...register('description')} rows={2} placeholder="Mô tả ngắn về kịch bản ngập này..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isActive" checked={watch('isActive')} onCheckedChange={(v) => setValue('isActive', v)} />
                <Label htmlFor="isActive" className="cursor-pointer">Kích hoạt kịch bản</Label>
              </div>
            </div>

            {/* ── NGƯỠNG KỊCH BẢN ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Ngưỡng kịch bản</h3>
              <p className="text-xs text-muted-foreground">Kịch bản sẽ được áp dụng khi lượng mưa / mực triều nằm trong khoảng này.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="minRainfall">Lượng mưa tối thiểu (mm)</Label>
                  <Input id="minRainfall" type="number" step="0.01" min="0" {...register('minRainfall')} placeholder="0" />
                  {errors.minRainfall && <p className="text-destructive text-xs">{errors.minRainfall.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxRainfall">Lượng mưa tối đa (mm)</Label>
                  <Input
                    id="maxRainfall"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Để trống = không giới hạn"
                    value={watch('maxRainfall') ?? ''}
                    onChange={(e) => setValue('maxRainfall', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="minTide">Mực triều tối thiểu (m)</Label>
                  <Input
                    id="minTide"
                    type="number"
                    step="0.01"
                    placeholder="Để trống = không áp dụng"
                    value={watch('minTide') ?? ''}
                    onChange={(e) => setValue('minTide', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maxTide">Mực triều tối đa (m)</Label>
                  <Input
                    id="maxTide"
                    type="number"
                    step="0.01"
                    placeholder="Để trống = không áp dụng"
                    value={watch('maxTide') ?? ''}
                    onChange={(e) => setValue('maxTide', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* ── DỮ LIỆU ĐẦU VÀO ── */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-1">Dữ liệu đầu vào hiện tại</h3>
              <p className="text-xs text-muted-foreground">Giá trị quan trắc thực tế — khác với ngưỡng kịch bản ở trên.</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nguồn lượng mưa</Label>
                  <Select value={rainfallSource} onValueChange={(v) => setValue('rainfallSource', v as 'MANUAL' | 'AUTO')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Quản trị viên nhập</SelectItem>
                      <SelectItem value="AUTO">Tự động từ trạm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currentRainfall">Lượng mưa hiện tại (mm)</Label>
                  {rainfallSource === 'AUTO' ? (
                    <p className="rounded border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      Lấy tự động từ trạm (chưa tích hợp)
                    </p>
                  ) : (
                    <Input
                      id="currentRainfall"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Để trống = chưa có dữ liệu"
                      value={watch('currentRainfall') ?? ''}
                      onChange={(e) => setValue('currentRainfall', e.target.value === '' ? null : Number(e.target.value))}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nguồn mực triều</Label>
                  <Select value={tideSource} onValueChange={(v) => setValue('tideSource', v as 'MANUAL' | 'AUTO')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Quản trị viên nhập</SelectItem>
                      <SelectItem value="AUTO">Tự động từ trạm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currentTide">Mực triều hiện tại (m)</Label>
                  {tideSource === 'AUTO' ? (
                    <p className="rounded border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                      Lấy tự động từ trạm (chưa tích hợp)
                    </p>
                  ) : (
                    <Input
                      id="currentTide"
                      type="number"
                      step="0.01"
                      placeholder="Để trống = chưa có dữ liệu"
                      value={watch('currentTide') ?? ''}
                      onChange={(e) => setValue('currentTide', e.target.value === '' ? null : Number(e.target.value))}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
