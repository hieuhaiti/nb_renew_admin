import { useEffect, useRef, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import isEqual from 'react-fast-compare'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Plus, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { tourService, spotService, useApiQuery } from '@/service'
import type { ApiResponse, Tour, TourFormBody, TourStatus, TourStop } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import useDeepEffect from '@/hooks/useDeepEffect'
import { useDebounce } from '@/hooks/useDebounce'
import { STALE_REF } from '@/constant/queryConstant'

// ── Schema ────────────────────────────────────────────────────────────────────

const tourSchema = z.object({
  name: z.string().min(1, 'Tên tour không được để trống').max(255),
  slug: z.string().min(1, 'Slug không được để trống').max(255),
  province_code: z.string().max(10).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  duration_days: z.coerce.number().int().min(1, 'Số ngày phải ≥ 1'),
  price_from_vnd: z.coerce.number().min(0).optional().nullable(),
  max_guests: z.coerce.number().int().min(1).optional().nullable(),
  start_location_vi: z.string().max(255).optional().or(z.literal('')),
  end_location_vi: z.string().max(255).optional().or(z.literal('')),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'inactive', 'archived', 'published']),
  is_featured: z.boolean(),
  includes: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
})
type TourFormValues = z.infer<typeof tourSchema>

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

const defaultValues: TourFormValues = {
  name: '',
  slug: '',
  province_code: '',
  description_vi: '',
  duration_days: 1,
  price_from_vnd: null,
  max_guests: null,
  start_location_vi: '',
  end_location_vi: '',
  cover_image_url: '',
  status: 'draft',
  is_featured: false,
  includes: [],
  excludes: [],
}

// ── SortableStopItem ──────────────────────────────────────────────────────────

interface SortableStopItemProps {
  stop: TourStop
  isFirst: boolean
  isLast: boolean
  onDelete: (stop: TourStop) => void
  isDeleting: boolean
}

function SortableStopItem({ stop, isFirst, isLast, onDelete, isDeleting }: SortableStopItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  let cardClass = 'border-border bg-card'
  if (isFirst) cardClass = 'border-rose-200 bg-rose-50/40'
  else if (isLast) cardClass = 'border-emerald-200 bg-emerald-50/40'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-1.5 flex items-center gap-2 rounded border p-2 ${cardClass}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="typo-caption shrink-0 rounded bg-muted px-1 font-mono text-muted-foreground">
            {stop.stop_order}
          </span>
          <span className="typo-body-sm truncate font-medium">{stop.title_vi || '—'}</span>
        </div>
        {stop.planned_duration_min != null && (
          <span className="typo-caption text-muted-foreground">{stop.planned_duration_min} phút</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(stop)}
        disabled={isDeleting}
        className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
        title="Xóa điểm dừng"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  )
}

// ── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  items: string[]
  placeholder: string
  onAdd: (value: string) => void
  onRemove: (index: number) => void
}

function TagInput({ items, placeholder, onAdd, onRemove }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const commit = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInputValue('')
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1"
        >
          <span className="typo-body-sm flex-1">{item}</span>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder={placeholder}
          className="h-8"
        />
        <Button type="button" variant="outline" size="sm" onClick={commit} className="shrink-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface TourFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourId: string | null
  onSubmit: (data: TourFormBody | Partial<TourFormBody>) => void
  isLoading?: boolean
}

export default function TourFormDialog({
  open,
  onOpenChange,
  tourId,
  onSubmit,
  isLoading = false,
}: TourFormDialogProps) {
  // ── Tour data ─────────────────────────────────────────────────────────────
  const dbQuery = useApiQuery(
    ['tour', tourId],
    () => tourService.getById(tourId!),
    { enabled: !!tourId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<Tour | { tour: Tour }>)?.data
  const tour =
    rawData && 'id' in rawData ? (rawData as Tour) : (rawData as { tour?: Tour })?.tour ?? null
  const isEdit = !!tour

  // ── Stops state ───────────────────────────────────────────────────────────
  const stopsData: TourStop[] = tour?.stops
    ? [...tour.stops].sort((a, b) =>
        a.day_number !== b.day_number ? a.day_number - b.day_number : a.stop_order - b.stop_order
      )
    : []
  const hasStops = isEdit && stopsData.length > 0

  const [stops, setStops] = useState<TourStop[]>([])
  // Tracks the last-committed server order (updated on initial sync + add/delete)
  const serverOrderRef = useRef<{ id: string; stop_order: number; day_number: number }[]>([])

  useDeepEffect(() => {
    if (stopsData.length > 0) {
      setStops((prev) => (isEqual(prev, stopsData) ? prev : stopsData))
      serverOrderRef.current = stopsData.map((s) => ({
        id: s.id,
        stop_order: s.stop_order,
        day_number: s.day_number,
      }))
    } else {
      setStops((prev) => (prev.length === 0 ? prev : []))
      serverOrderRef.current = []
    }
  }, [stopsData])

  useEffect(() => {
    if (!open) {
      setStops([])
      serverOrderRef.current = []
    }
  }, [open])

  // ── Per-day grouping ──────────────────────────────────────────────────────
  const days = Array.from(new Set(stops.map((s) => s.day_number))).sort((a, b) => a - b)
  const stopsByDay = days.reduce<Record<number, TourStop[]>>((acc, day) => {
    acc[day] = stops
      .filter((s) => s.day_number === day)
      .sort((a, b) => a.stop_order - b.stop_order)
    return acc
  }, {})

  // ── DnD ───────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEndForDay(day: number, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setStops((items) => {
      const dayItems = items
        .filter((s) => s.day_number === day)
        .sort((a, b) => a.stop_order - b.stop_order)
      const rest = items.filter((s) => s.day_number !== day)
      const oldIdx = dayItems.findIndex((s) => s.id === active.id)
      const newIdx = dayItems.findIndex((s) => s.id === over.id)
      const reordered = arrayMove(dayItems, oldIdx, newIdx).map((s, i) => ({
        ...s,
        stop_order: i + 1,
      }))
      return [...rest, ...reordered]
    })
  }

  // ── Delete stop ───────────────────────────────────────────────────────────
  const [deletingStopId, setDeletingStopId] = useState<string | null>(null)

  const handleDeleteStop = async (stop: TourStop) => {
    if (!tourId) return
    setDeletingStopId(stop.id)
    try {
      await tourService.deleteStop(tourId, stop.id)
      setStops((prev) => {
        const remaining = prev.filter((s) => s.id !== stop.id)
        // Recalculate stop_order within the affected day
        const dayItems = remaining
          .filter((s) => s.day_number === stop.day_number)
          .sort((a, b) => a.stop_order - b.stop_order)
          .map((s, i) => ({ ...s, stop_order: i + 1 }))
        const others = remaining.filter((s) => s.day_number !== stop.day_number)
        return [...others, ...dayItems]
      })
      serverOrderRef.current = serverOrderRef.current.filter((s) => s.id !== stop.id)
      toast.success('Đã xóa điểm dừng')
    } catch {
      toast.error('Xóa điểm dừng thất bại')
    } finally {
      setDeletingStopId(null)
    }
  }

  // ── Add stop ──────────────────────────────────────────────────────────────
  const [addingToDay, setAddingToDay] = useState<number | null>(null)
  const [newStopSpotId, setNewStopSpotId] = useState('')
  const [newStopTitleVi, setNewStopTitleVi] = useState('')
  const [newStopDuration, setNewStopDuration] = useState('')
  const [spotSearch, setSpotSearch] = useState('')
  const [isSubmittingStop, setIsSubmittingStop] = useState(false)

  const debouncedSpotSearch = useDebounce(spotSearch.trim(), 500)

  const spotsQuery = useApiQuery(
    ['spots', 'for-stop', debouncedSpotSearch],
    () =>
      spotService.getAll({
        search: debouncedSpotSearch || undefined,
        limit: 40,
        sortBy: 'name_vi',
        sortOrder: 'ASC',
      }),
    { enabled: addingToDay !== null && !!tourId, staleTime: STALE_REF },
    false,
    false
  )
  const spotOptions: { id: string; name_vi?: string | null; name?: string }[] =
    (spotsQuery.data as any)?.data?.spots ?? []

  const openAddForm = (day: number) => {
    setAddingToDay(day)
    setNewStopSpotId('')
    setNewStopTitleVi('')
    setNewStopDuration('')
    setSpotSearch('')
  }

  const handleAddStop = async (day: number) => {
    if (!tourId) return
    const hasTitle = newStopTitleVi.trim()
    if (!newStopSpotId && !hasTitle) {
      toast.error('Nhập tên điểm dừng hoặc chọn điểm tham quan')
      return
    }
    const dayStops = stopsByDay[day] ?? []
    const nextOrder = dayStops.length > 0 ? Math.max(...dayStops.map((s) => s.stop_order)) + 1 : 1

    setIsSubmittingStop(true)
    try {
      const res = await tourService.addStop(tourId, {
        day_number: day,
        stop_order: nextOrder,
        spot_id: newStopSpotId || null,
        title_vi: hasTitle ? newStopTitleVi.trim() : undefined,
        planned_duration_min: newStopDuration ? parseInt(newStopDuration) : undefined,
      })
      const newStop = (res as ApiResponse<TourStop>)?.data
      if (newStop) {
        setStops((prev) => [...prev, newStop])
        serverOrderRef.current = [
          ...serverOrderRef.current,
          { id: newStop.id, stop_order: newStop.stop_order, day_number: newStop.day_number },
        ]
      }
      setAddingToDay(null)
      toast.success('Đã thêm điểm dừng')
    } catch {
      toast.error('Thêm điểm dừng thất bại')
    } finally {
      setIsSubmittingStop(false)
    }
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema) as any,
    defaultValues,
  })

  useEffect(() => {
    if (tour) {
      reset({
        name: tour.name,
        slug: tour.slug,
        province_code: tour.province_code ?? '',
        description_vi: tour.description_vi ?? '',
        duration_days: tour.duration_days,
        price_from_vnd: tour.price_from_vnd != null ? parseFloat(tour.price_from_vnd) : null,
        max_guests: tour.max_guests ?? null,
        start_location_vi: tour.start_location_vi ?? '',
        end_location_vi: tour.end_location_vi ?? '',
        cover_image_url: tour.cover_image_url ?? '',
        status: tour.status,
        is_featured: tour.is_featured,
        includes: tour.includes ?? [],
        excludes: tour.excludes ?? [],
      })
    } else {
      reset(defaultValues)
    }
  }, [tour, reset, open])

  // ── includes / excludes helpers ───────────────────────────────────────────
  const addTag = (field: 'includes' | 'excludes', value: string) => {
    setValue(field, [...(watch(field) ?? []), value])
  }
  const removeTag = (field: 'includes' | 'excludes', idx: number) => {
    setValue(
      field,
      (watch(field) ?? []).filter((_, i) => i !== idx)
    )
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit: SubmitHandler<TourFormValues> = (values) => {
    const body: TourFormBody = {
      name: values.name,
      slug: values.slug,
      ...(values.province_code && { province_code: values.province_code }),
      ...(values.description_vi && { description_vi: values.description_vi }),
      duration_days: values.duration_days,
      ...(values.price_from_vnd != null && { price_from_vnd: values.price_from_vnd }),
      ...(values.max_guests != null && { max_guests: values.max_guests }),
      ...(values.start_location_vi && { start_location_vi: values.start_location_vi }),
      ...(values.end_location_vi && { end_location_vi: values.end_location_vi }),
      ...(values.cover_image_url &&
        (!isEdit || values.cover_image_url !== (tour?.cover_image_url ?? '')) && {
          cover_image_url: values.cover_image_url,
        }),
      status: values.status,
      is_featured: values.is_featured,
      includes: values.includes ?? [],
      excludes: values.excludes ?? [],
    }
    onSubmit(body)

    // Fire-and-forget stop reorder for stops whose position changed since last server sync
    if (isEdit && tourId && stops.length > 0) {
      stops.forEach((stop) => {
        const server = serverOrderRef.current.find((s) => s.id === stop.id)
        if (!server || server.stop_order !== stop.stop_order || server.day_number !== stop.day_number) {
          tourService.updateStop(tourId, stop.id, {
            stop_order: stop.stop_order,
            day_number: stop.day_number,
          })
        }
      })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto transition-all ${hasStops ? 'max-w-7xl' : 'max-w-2xl'}`}
      >
        <DialogTitle>{isEdit ? 'Cập nhật tour' : 'Thêm tour mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Chỉnh sửa thông tin tour du lịch' : 'Điền thông tin để tạo tour mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="pt-2">
          <div className="flex gap-6">
            {/* ── Form fields ─────────────────────────────────────────────── */}
            <div className={`${hasStops ? 'w-[60%]' : 'w-full'} space-y-4`}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tour_name">
                    Tên tour <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tour_name"
                    {...register('name')}
                    placeholder="Khám phá Tràng An..."
                    onChange={(e) => {
                      register('name').onChange(e)
                      if (!isEdit) setValue('slug', slugify(e.target.value))
                    }}
                  />
                  {errors.name && (
                    <p className="text-destructive text-xs">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tour_slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input id="tour_slug" {...register('slug')} placeholder="kham-pha-trang-an" />
                  {errors.slug && (
                    <p className="text-destructive text-xs">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tour_days">
                    Số ngày <span className="text-destructive">*</span>
                  </Label>
                  <Input id="tour_days" type="number" min={1} {...register('duration_days')} />
                  {errors.duration_days && (
                    <p className="text-destructive text-xs">{errors.duration_days.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tour_price">Giá từ (VND)</Label>
                  <Input
                    id="tour_price"
                    type="number"
                    min={0}
                    {...register('price_from_vnd')}
                    placeholder="500000"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tour_guests">Số khách tối đa</Label>
                  <Input
                    id="tour_guests"
                    type="number"
                    min={1}
                    {...register('max_guests')}
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tour_start">Điểm xuất phát</Label>
                  <Input
                    id="tour_start"
                    {...register('start_location_vi')}
                    placeholder="Ninh Bình"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tour_end">Điểm kết thúc</Label>
                  <Input
                    id="tour_end"
                    {...register('end_location_vi')}
                    placeholder="Ninh Bình"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tour_province">Mã tỉnh</Label>
                  <Input id="tour_province" {...register('province_code')} placeholder="37" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tour_status">Trạng thái</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(v) => setValue('status', v as TourStatus)}
                  >
                    <SelectTrigger id="tour_status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Nháp</SelectItem>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive">Tạm dừng</SelectItem>
                      <SelectItem value="archived">Lưu trữ</SelectItem>
                      <SelectItem value="published">Đã xuất bản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tour_cover">URL ảnh bìa</Label>
                <Input id="tour_cover" {...register('cover_image_url')} placeholder="https://..." />
                {errors.cover_image_url && (
                  <p className="text-destructive text-xs">{errors.cover_image_url.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="tour_desc">Mô tả</Label>
                <Textarea
                  id="tour_desc"
                  {...register('description_vi')}
                  rows={3}
                  placeholder="Mô tả tour..."
                />
              </div>

              {/* Bao gồm / Không bao gồm */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Bao gồm</Label>
                  <TagInput
                    items={watch('includes') ?? []}
                    placeholder="Vé tham quan, nhấn Enter..."
                    onAdd={(v) => addTag('includes', v)}
                    onRemove={(i) => removeTag('includes', i)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Không bao gồm</Label>
                  <TagInput
                    items={watch('excludes') ?? []}
                    placeholder="Chi phí cá nhân, nhấn Enter..."
                    onAdd={(v) => addTag('excludes', v)}
                    onRemove={(i) => removeTag('excludes', i)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="tour_featured"
                  checked={watch('is_featured')}
                  onCheckedChange={(checked) => setValue('is_featured', !!checked)}
                />
                <Label htmlFor="tour_featured" className="cursor-pointer">
                  Tour nổi bật
                </Label>
              </div>
            </div>

            {/* ── Stops panel ─────────────────────────────────────────────── */}
            {hasStops && (
              <div className="flex w-[40%] flex-col border-l pl-4">
                <div className="typo-section-title mb-0.5">
                  Điểm dừng{' '}
                  <span className="typo-meta font-normal text-muted-foreground">
                    ({stops.length})
                  </span>
                </div>
                <p className="typo-caption mb-3 text-muted-foreground">
                  Kéo thả để sắp xếp trong ngày
                </p>

                <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
                  {days.map((day) => {
                    const dayStops = stopsByDay[day] ?? []
                    const isFirstDay = day === days[0]
                    const isLastDay = day === days[days.length - 1]
                    const isOpenAdd = addingToDay === day

                    return (
                      <div key={day}>
                        {/* Day header */}
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="typo-caption rounded bg-primary px-2 py-0.5 font-semibold text-primary-foreground">
                              Ngày {day}
                            </span>
                            <span className="typo-caption text-muted-foreground">
                              {dayStops.length} điểm
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => (isOpenAdd ? setAddingToDay(null) : openAddForm(day))}
                            className="flex items-center gap-1 typo-caption text-muted-foreground hover:text-foreground"
                          >
                            {isOpenAdd ? (
                              <X className="h-3.5 w-3.5" />
                            ) : (
                              <Plus className="h-3.5 w-3.5" />
                            )}
                            {isOpenAdd ? 'Đóng' : 'Thêm'}
                          </button>
                        </div>

                        {/* Sortable list for this day */}
                        <DndContext
                          id={`day-${day}`}
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleDragEndForDay(day, e)}
                        >
                          <SortableContext
                            items={dayStops.map((s) => s.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {dayStops.map((stop, idx) => (
                              <SortableStopItem
                                key={stop.id}
                                stop={stop}
                                isFirst={isFirstDay && idx === 0}
                                isLast={isLastDay && idx === dayStops.length - 1}
                                onDelete={handleDeleteStop}
                                isDeleting={deletingStopId === stop.id}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>

                        {dayStops.length === 0 && (
                          <p className="typo-caption py-2 text-center text-muted-foreground">
                            Chưa có điểm dừng
                          </p>
                        )}

                        {/* Inline add form */}
                        {isOpenAdd && (
                          <div className="mt-1.5 space-y-2 rounded border border-dashed border-primary/40 bg-primary/5 p-3">
                            {/* Spot search */}
                            <div className="space-y-1">
                              <Label className="typo-caption">Điểm tham quan (tùy chọn)</Label>
                              <Input
                                value={spotSearch}
                                onChange={(e) => {
                                  setSpotSearch(e.target.value)
                                  if (!e.target.value) setNewStopSpotId('')
                                }}
                                placeholder="Tìm tên điểm TQ..."
                                className="h-8"
                              />
                              {debouncedSpotSearch && !newStopSpotId && spotOptions.length > 0 && (
                                <div className="max-h-32 overflow-y-auto rounded border border-border bg-popover shadow-sm">
                                  {spotOptions.map((spot) => (
                                    <button
                                      type="button"
                                      key={spot.id}
                                      onClick={() => {
                                        setNewStopSpotId(spot.id)
                                        setSpotSearch(spot.name_vi || spot.name || '')
                                      }}
                                      className="typo-body-sm w-full px-3 py-1.5 text-left hover:bg-muted"
                                    >
                                      {spot.name_vi || spot.name || spot.id}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {newStopSpotId && (
                                <p className="typo-caption text-primary">✓ Đã chọn điểm tham quan</p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <Label className="typo-caption">Tên điểm dừng</Label>
                              <Input
                                value={newStopTitleVi}
                                onChange={(e) => setNewStopTitleVi(e.target.value)}
                                placeholder={
                                  newStopSpotId
                                    ? 'Bỏ trống để dùng tên điểm TQ'
                                    : 'Bắt buộc nếu không chọn điểm TQ'
                                }
                                className="h-8"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="typo-caption">Thời gian (phút)</Label>
                              <Input
                                type="number"
                                min={1}
                                value={newStopDuration}
                                onChange={(e) => setNewStopDuration(e.target.value)}
                                placeholder="60"
                                className="h-8"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAddStop(day)}
                                disabled={
                                  isSubmittingStop || (!newStopSpotId && !newStopTitleVi.trim())
                                }
                              >
                                {isSubmittingStop ? 'Đang thêm...' : 'Thêm'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setAddingToDay(null)}
                              >
                                Hủy
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
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
