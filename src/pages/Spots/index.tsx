import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, spotService } from '@/service'
import type { ApiResponse, Spot, SpotListData, SpotFormBody, SpotStatus, Pagination } from '@/types/api'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pen, Plus, Trash2, Star } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { parseLink } from '@/lib/utils'

const STATUS_LABEL: Record<SpotStatus, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  pending: 'Chờ duyệt',
  closed: 'Đã đóng',
}
const STATUS_CLASS: Record<SpotStatus, string> = {
  active: 'bg-success/10 text-success border-success/20',
  inactive: 'bg-muted/40 text-muted-foreground border-border',
  pending: 'bg-warning/10 text-warning border-warning/20',
  closed: 'bg-destructive/10 text-destructive border-destructive/20',
}
const STATUS_DOT: Record<SpotStatus, string> = {
  active: 'bg-success',
  inactive: 'bg-muted-foreground',
  pending: 'bg-warning',
  closed: 'bg-destructive',
}

const spotSchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  name_en: z.string().max(255).optional().or(z.literal('')),
  slug: z.string().max(255).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  address_vi: z.string().max(500).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  ticket_price_adult: z.coerce.number().min(0).optional(),
  ticket_price_child: z.coerce.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'closed']),
  is_featured: z.boolean(),
  has_vr_360: z.boolean(),
  has_audio_guide: z.boolean(),
})
type SpotFormValues = z.infer<typeof spotSchema>

export default function SpotPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(statusFilter !== 'all' && { status: statusFilter as SpotStatus }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['spots', queryParams],
    () => spotService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<SpotListData>)?.data
  const items = data?.spots ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Spot | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Spot | null>(null)

  const createMutation = useApiMutation(
    (payload: SpotFormBody) => spotService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setEditItem(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: Partial<SpotFormBody> }) =>
      spotService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setEditItem(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => spotService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const toggleFeaturedMutation = useApiMutation(
    (id: string) => spotService.toggleFeatured(id),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  const defaultValues: SpotFormValues = {
    name_vi: '',
    name_en: '',
    slug: '',
    description_vi: '',
    address_vi: '',
    province_code: '',
    latitude: undefined,
    longitude: undefined,
    phone: '',
    email: '',
    website: '',
    ticket_price_adult: undefined,
    ticket_price_child: undefined,
    status: 'active',
    is_featured: false,
    has_vr_360: false,
    has_audio_guide: false,
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SpotFormValues>({
    resolver: zodResolver(spotSchema) as any,
    defaultValues,
  })

  function openAdd() {
    setEditItem(null)
    reset(defaultValues)
    setFormDialogOpen(true)
  }

  function openEdit(item: Spot) {
    setEditItem(item)
    reset({
      name_vi: item.name_vi,
      name_en: item.name_en || '',
      slug: item.slug || '',
      description_vi: item.description_vi || '',
      address_vi: item.address_vi || '',
      province_code: item.province_code || '',
      latitude: item.latitude ?? undefined,
      longitude: item.longitude ?? undefined,
      phone: item.phone || '',
      email: item.email || '',
      website: item.website || '',
      ticket_price_adult: item.ticket_price_adult ?? undefined,
      ticket_price_child: item.ticket_price_child ?? undefined,
      status: item.status,
      is_featured: item.is_featured,
      has_vr_360: item.has_vr_360,
      has_audio_guide: item.has_audio_guide,
    })
    setFormDialogOpen(true)
  }

  const handleFormSubmit: SubmitHandler<SpotFormValues> = (formData) => {
    const payload: SpotFormBody = {
      name_vi: formData.name_vi,
      ...(formData.name_en?.trim() && { name_en: formData.name_en }),
      ...(formData.slug?.trim() && { slug: formData.slug }),
      ...(formData.description_vi?.trim() && { description_vi: formData.description_vi }),
      ...(formData.address_vi?.trim() && { address_vi: formData.address_vi }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      ...(formData.latitude != null && { latitude: formData.latitude }),
      ...(formData.longitude != null && { longitude: formData.longitude }),
      ...(formData.phone?.trim() && { phone: formData.phone }),
      ...(formData.email?.trim() && { email: formData.email }),
      ...(formData.website?.trim() && { website: formData.website }),
      ...(formData.ticket_price_adult != null && { ticket_price_adult: formData.ticket_price_adult }),
      ...(formData.ticket_price_child != null && { ticket_price_child: formData.ticket_price_child }),
      status: formData.status,
      is_featured: formData.is_featured,
      has_vr_360: formData.has_vr_360,
      has_audio_guide: formData.has_audio_guide,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <PageLayout title="Điểm tham quan" description="Quản lý điểm tham quan du lịch">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        filter={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="closed">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${limit}`}
              onValueChange={(v) => {
                setLimit(parseInt(v, 10))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" onClick={openAdd}>
              <Plus className="mr-1 size-4" />
              Thêm điểm
            </Button>
          </div>
        }
        total={total}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: (page: number) => setCurrentPage(page),
        }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-16">Ảnh</TableHead>
              <TableHead>Tên điểm</TableHead>
              <TableHead className="w-32">Địa chỉ</TableHead>
              <TableHead className="w-20">Đánh giá</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-20">Nổi bật</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Spot) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.primary_image_url ? (
                      <img
                        src={parseLink(item.primary_image_url)}
                        alt={item.name_vi}
                        className="h-10 w-10 rounded border object-cover"
                      />
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded border" />
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{item.name_vi}</p>
                    {item.name_en && (
                      <p className="text-muted-foreground text-xs">{item.name_en}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-32 text-sm">
                    <span className="line-clamp-2">{item.address_vi || '-'}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.rating_avg != null ? (
                      <span className="text-warning flex items-center gap-1">
                        <Star className="size-3" />
                        {item.rating_avg.toFixed(1)}
                        <span className="text-muted-foreground">({item.rating_count})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={STATUS_LABEL[item.status]}
                      badgeClass={STATUS_CLASS[item.status]}
                      dotClass={STATUS_DOT[item.status]}
                    />
                  </TableCell>
                  <TableCell>
                    {item.is_featured ? (
                      <Badge variant="default">Nổi bật</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.created_at ? formatDate(item.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFeaturedMutation.mutate(item.id)}
                        title={item.is_featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        <Star className={item.is_featured ? 'text-warning size-4' : 'size-4'} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)} title="Chỉnh sửa">
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setItemToDelete(item)
                          setDeleteDialogOpen(true)
                        }}
                        title="Xóa"
                      >
                        <Trash2 className="text-destructive size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{editItem ? 'Chỉnh sửa điểm tham quan' : 'Thêm điểm tham quan'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Cập nhật thông tin điểm tham quan' : 'Thêm điểm tham quan mới'}
          </DialogDescription>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spot_name_vi">Tên (VI) <span className="text-destructive">*</span></Label>
              <Input id="spot_name_vi" {...register('name_vi')} placeholder="Tên tiếng Việt" />
              {errors.name_vi && <p className="text-destructive text-sm">{errors.name_vi.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spot_name_en">Tên (EN)</Label>
                <Input id="spot_name_en" {...register('name_en')} placeholder="English name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_slug">Slug</Label>
                <Input id="spot_slug" {...register('slug')} placeholder="vd: hang-mua" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_description">Mô tả</Label>
              <Textarea id="spot_description" {...register('description_vi')} rows={3} placeholder="Mô tả điểm tham quan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spot_address">Địa chỉ</Label>
              <Input id="spot_address" {...register('address_vi')} placeholder="Địa chỉ tiếng Việt" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spot_province">Mã tỉnh</Label>
                <Input id="spot_province" {...register('province_code')} placeholder="Mã tỉnh" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_lat">Vĩ độ</Label>
                <Input id="spot_lat" type="number" step="any" {...register('latitude')} placeholder="20.123" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_lng">Kinh độ</Label>
                <Input id="spot_lng" type="number" step="any" {...register('longitude')} placeholder="106.123" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spot_phone">Điện thoại</Label>
                <Input id="spot_phone" {...register('phone')} placeholder="0123456789" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_email">Email</Label>
                <Input id="spot_email" type="email" {...register('email')} placeholder="contact@..." />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="spot_website">Website</Label>
                <Input id="spot_website" {...register('website')} placeholder="https://..." />
                {errors.website && <p className="text-destructive text-sm">{errors.website.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket_adult">Giá vé người lớn (VNĐ)</Label>
                <Input id="ticket_adult" type="number" min={0} {...register('ticket_price_adult')} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket_child">Giá vé trẻ em (VNĐ)</Label>
                <Input id="ticket_child" type="number" min={0} {...register('ticket_price_child')} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(v) => setValue('status', v as SpotStatus)}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nổi bật</Label>
                <Select
                  value={watch('is_featured') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_featured', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không</SelectItem>
                    <SelectItem value="true">Nổi bật</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>VR 360°</Label>
                <Select
                  value={watch('has_vr_360') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('has_vr_360', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không</SelectItem>
                    <SelectItem value="true">Có</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)} disabled={isPending}>Hủy</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang xử lý...' : editItem ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa &quot;{itemToDelete?.name_vi}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteMutation.mutate(itemToDelete.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
