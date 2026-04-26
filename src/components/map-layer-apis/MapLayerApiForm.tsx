import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Globe, Info, Layers, Link2, Save, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CategorySelectField from '@/components/features/CategorySelectField'
import type { CreateMapLayerApiBody, MapLayerApi } from '@/types/api'
import {
  buildUpdatePayload,
  createMapLayerApiSchema,
  normalizeMapLayerApiInput,
} from '@/validators/mapLayerApiValidators'

interface MapLayerApiFormProps {
  mode: 'create' | 'edit'
  initialData?: MapLayerApi | null
  submitting?: boolean
  onSubmitCreate: (payload: CreateMapLayerApiBody) => void
  onSubmitUpdate: (payload: Partial<CreateMapLayerApiBody>) => void
}

type FormValues = z.infer<typeof createMapLayerApiSchema>

const defaultValues: FormValues = {
  category_id: 0,
  name: '',
  slug: '',
  description: '',
  endpoint_url: '',
  http_method: 'GET',
  status: 'draft',
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <Icon className="text-primary h-4 w-4" />
      <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
    </div>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs leading-relaxed">{children}</p>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-destructive text-sm">{message}</p>
}

export default function MapLayerApiForm({
  mode,
  initialData,
  submitting = false,
  onSubmitCreate,
  onSubmitUpdate,
}: MapLayerApiFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(createMapLayerApiSchema),
    mode: 'onChange',
    defaultValues:
      mode === 'edit' && initialData
        ? {
            category_id: Number(initialData.category_id),
            name: initialData.name,
            slug: initialData.slug,
            description: initialData.description ?? '',
            endpoint_url: initialData.endpoint_url,
            http_method: 'GET',
            status: initialData.status,
          }
        : defaultValues,
  })

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        category_id: Number(initialData.category_id),
        name: initialData.name,
        slug: initialData.slug,
        description: initialData.description ?? '',
        endpoint_url: initialData.endpoint_url,
        http_method: 'GET',
        status: initialData.status,
      })
      return
    }

    form.reset(defaultValues)
  }, [mode, initialData, form])

  const watched = form.watch()

  // Auto-generate endpoint_url from slug
  const slugValue = form.watch('slug')
  useEffect(() => {
    const trimmed = (slugValue ?? '').trim()
    const url = trimmed ? `/api/public/map/${trimmed}` : ''
    form.setValue('endpoint_url', url, { shouldValidate: true })
    form.setValue('http_method', 'GET', { shouldValidate: true })
  }, [slugValue, form])

  const changedPayload = useMemo(() => {
    if (mode !== 'edit' || !initialData) return {}
    const original: CreateMapLayerApiBody = {
      category_id: Number(initialData.category_id),
      name: initialData.name,
      slug: initialData.slug,
      description: initialData.description ?? undefined,
      endpoint_url: initialData.endpoint_url,
      http_method: initialData.http_method,
      status: initialData.status,
    }

    const current = normalizeMapLayerApiInput({
      category_id: Number(watched.category_id),
      name: watched.name,
      slug: watched.slug,
      description: watched.description ?? undefined,
      endpoint_url: watched.endpoint_url,
      http_method: watched.http_method,
      status: watched.status,
    })

    return buildUpdatePayload(original, current)
  }, [mode, initialData, watched])

  const hasChanges = Object.keys(changedPayload).length > 0
  const changedCount = Object.keys(changedPayload).length

  const submitDisabled = submitting || (mode === 'edit' && !hasChanges)

  const submitLabel = mode === 'create' ? 'Tạo API' : 'Cập nhật API'

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        const normalized = normalizeMapLayerApiInput(values)
        if (mode === 'create') {
          onSubmitCreate(normalized)
          return
        }

        onSubmitUpdate(changedPayload)
      })}
    >
      {/* ── Section 1: Thông tin chung ── */}
      <SectionHeader icon={Layers} title="Thông tin chung" />
      <Separator />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <CategorySelectField
            value={String(form.watch('category_id') || '')}
            onValueChange={(value) =>
              form.setValue('category_id', Number(value), {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            required
          />
          <FieldHint>Chọn danh mục nhóm cho API này.</FieldHint>
          <FieldError message={form.formState.errors.category_id?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Trạng thái</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) =>
              form.setValue('status', value as FormValues['status'], {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">
                <span className="flex items-center gap-2">
                  <span className="bg-muted-foreground inline-block h-2 w-2 rounded-full" />
                  Draft
                </span>
              </SelectItem>
              <SelectItem value="published">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                  Published
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldHint>
            <strong>Draft</strong> — chỉ admin nhìn thấy. <strong>Published</strong> — hiển thị công
            khai.
          </FieldHint>
          <FieldError message={form.formState.errors.status?.message} />
        </div>
      </div>

      {/* ── Section 2: Định danh API ── */}
      <SectionHeader icon={Globe} title="Định danh API" />
      <Separator />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Tên API <span className="text-destructive">*</span>
          </Label>
          <Input id="name" {...form.register('name')} placeholder="VD: Bản đồ quy hoạch đất" />
          <FieldHint>Tên hiển thị của API, tối thiểu 2 ký tự.</FieldHint>
          <FieldError message={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input id="slug" {...form.register('slug')} placeholder="VD: ban-do-quy-hoach" />
          <FieldHint>Đường dẫn URL-friendly, chỉ dùng chữ thường, số và dấu gạch ngang.</FieldHint>
          <FieldError message={form.formState.errors.slug?.message} />
        </div>
      </div>

      {/* ── Section 3: Endpoint ── */}
      <SectionHeader icon={Link2} title="Endpoint" />
      <Separator />

      <div className="bg-muted/50 space-y-3 rounded-lg border p-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs tracking-wider uppercase">
            Public Endpoint URL
          </Label>
          <div className="bg-background flex items-center gap-2 rounded-md border px-3 py-2">
            <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-semibold">
              GET
            </span>
            <code className="text-foreground flex-1 truncate text-sm">
              {form.watch('endpoint_url') || '/api/public/map/...'}
            </code>
          </div>
          <div className="flex items-start gap-1.5">
            <Info className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
            <FieldHint>
              Tự động tạo từ slug theo mẫu{' '}
              <code className="bg-muted rounded px-1 font-mono text-xs">/api/public/map/:slug</code>
              . Thay đổi slug sẽ cập nhật endpoint.
            </FieldHint>
          </div>
        </div>
      </div>

      {/* ── Section 4: Mô tả ── */}
      <SectionHeader icon={Settings2} title="Thông tin bổ sung" />
      <Separator />

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          rows={3}
          {...form.register('description')}
          placeholder="VD: API cung cấp dữ liệu lớp bản đồ quy hoạch sử dụng đất tỉnh Đắk Lắk..."
        />
        <FieldHint>Mô tả ngắn gọn mục đích, nội dung dữ liệu trả về (không bắt buộc).</FieldHint>
        <FieldError message={form.formState.errors.description?.message} />
      </div>

      {/* ── Footer ── */}
      <Separator />

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          {mode === 'edit' && !hasChanges && (
            <p className="text-muted-foreground italic">Chưa có thay đổi nào.</p>
          )}
          {mode === 'edit' && hasChanges && (
            <p className="text-primary font-medium">{changedCount} trường đã thay đổi</p>
          )}
        </div>
        <Button type="submit" disabled={submitDisabled} className="min-w-35">
          {submitting ? (
            'Đang xử lý...'
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {submitLabel}
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}
