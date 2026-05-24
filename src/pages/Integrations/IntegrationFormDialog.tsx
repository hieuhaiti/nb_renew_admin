import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Integration, IntegrationFormBody, IntegrationAuthType, IntegrationType } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ── Schema ────────────────────────────────────────────────────────────────────

const integrationSchema = z.object({
  provider_code: z.string().min(1, 'Mã nhà cung cấp không được để trống').max(50),
  provider_name: z.string().min(1, 'Tên nhà cung cấp không được để trống').max(255),
  integration_type: z.enum(['data_sync', 'booking', 'payment', 'notification', 'analytics']),
  base_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  auth_type: z.enum(['api_key', 'oauth2', 'basic', 'none']),
  webhook_secret: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean(),
})
type IntegrationFormValues = z.infer<typeof integrationSchema>

const INTEGRATION_TYPE_LABEL: Record<IntegrationType, string> = {
  data_sync: 'Đồng bộ dữ liệu',
  booking: 'Đặt chỗ',
  payment: 'Thanh toán',
  notification: 'Thông báo',
  analytics: 'Phân tích',
}

const AUTH_TYPE_LABEL: Record<IntegrationAuthType, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic: 'Basic Auth',
  none: 'Không xác thực',
}

const defaultValues: IntegrationFormValues = {
  provider_code: '',
  provider_name: '',
  integration_type: 'data_sync',
  base_url: '',
  auth_type: 'api_key',
  webhook_secret: '',
  is_active: true,
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface IntegrationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integration: Integration | null
  onSubmit: (data: IntegrationFormBody) => void
  isLoading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IntegrationFormDialog({
  open,
  onOpenChange,
  integration,
  onSubmit,
  isLoading = false,
}: IntegrationFormDialogProps) {
  const isEdit = !!integration

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<IntegrationFormValues>({
      resolver: zodResolver(integrationSchema),
      defaultValues,
    })

  useEffect(() => {
    if (integration) {
      reset({
        provider_code: integration.provider_code,
        provider_name: integration.provider_name,
        integration_type: integration.integration_type,
        base_url: integration.base_url ?? '',
        auth_type: integration.auth_type,
        webhook_secret: '',
        is_active: integration.is_active,
      })
    } else {
      reset(defaultValues)
    }
  }, [integration, reset, open])

  const handleFormSubmit: SubmitHandler<IntegrationFormValues> = (values) => {
    const body: IntegrationFormBody = {
      provider_code: values.provider_code,
      provider_name: values.provider_name,
      integration_type: values.integration_type,
      auth_type: values.auth_type,
      ...(values.base_url && { base_url: values.base_url }),
      ...(values.webhook_secret && { webhook_secret: values.webhook_secret }),
      is_active: values.is_active,
    }
    onSubmit(body)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>{isEdit ? 'Cập nhật tích hợp' : 'Thêm tích hợp mới'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Chỉnh sửa thông tin tích hợp dịch vụ bên ngoài'
            : 'Điền thông tin tích hợp dịch vụ bên ngoài'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="int_code">
                Mã nhà cung cấp <span className="text-destructive">*</span>
              </Label>
              <Input id="int_code" {...register('provider_code')} placeholder="google_maps" />
              {errors.provider_code && (
                <p className="text-destructive text-xs">{errors.provider_code.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="int_name">
                Tên nhà cung cấp <span className="text-destructive">*</span>
              </Label>
              <Input id="int_name" {...register('provider_name')} placeholder="Google Maps" />
              {errors.provider_name && (
                <p className="text-destructive text-xs">{errors.provider_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="int_type">Loại tích hợp</Label>
              <Select
                value={watch('integration_type')}
                onValueChange={(v) => setValue('integration_type', v as IntegrationType)}
              >
                <SelectTrigger id="int_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(INTEGRATION_TYPE_LABEL) as [IntegrationType, string][]).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="int_auth">Phương thức xác thực</Label>
              <Select
                value={watch('auth_type')}
                onValueChange={(v) => setValue('auth_type', v as IntegrationAuthType)}
              >
                <SelectTrigger id="int_auth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(AUTH_TYPE_LABEL) as [IntegrationAuthType, string][]).map(
                    ([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="int_url">Base URL</Label>
            <Input
              id="int_url"
              {...register('base_url')}
              placeholder="https://api.example.com"
            />
            {errors.base_url && (
              <p className="text-destructive text-xs">{errors.base_url.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="int_secret">
              Webhook Secret{' '}
              {isEdit && (
                <span className="text-muted-foreground">(để trống giữ nguyên)</span>
              )}
            </Label>
            <Input
              id="int_secret"
              {...register('webhook_secret')}
              type="password"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="int_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', !!checked)}
            />
            <Label htmlFor="int_active" className="cursor-pointer">
              Kích hoạt tích hợp
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
