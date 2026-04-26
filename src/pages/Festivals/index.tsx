import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, festivalService } from '@/service'
import type { ApiResponse, Festival, FestivalListData, FestivalFormBody, Pagination } from '@/types/api'
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
import { Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { parseLink } from '@/lib/utils'

const festivalSchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  name_en: z.string().max(255).optional().or(z.literal('')),
  festival_type: z.string().max(100).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  is_recurring: z.boolean(),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  website: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  location_name: z.string().max(255).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  is_published: z.boolean(),
})
type FestivalFormValues = z.infer<typeof festivalSchema>

export default function FestivalPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['festivals', queryParams],
    () => festivalService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<FestivalListData>)?.data
  const items = data?.festivals ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Festival | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Festival | null>(null)

  const createMutation = useApiMutation(
    (payload: FestivalFormBody) => festivalService.create(payload),
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
    (payload: { id: string; data: FestivalFormBody }) =>
      festivalService.update(payload.id, payload.data),
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
    (id: string) => festivalService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const defaultValues: FestivalFormValues = {
    name_vi: '',
    name_en: '',
    festival_type: '',
    description_vi: '',
    start_date: '',
    end_date: '',
    is_recurring: false,
    cover_image_url: '',
    website: '',
    location_name: '',
    province_code: '',
    is_published: false,
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FestivalFormValues>({
    resolver: zodResolver(festivalSchema) as any,
    defaultValues,
  })

  function openAdd() {
    setEditItem(null)
    reset(defaultValues)
    setFormDialogOpen(true)
  }

  function openEdit(item: Festival) {
    setEditItem(item)
    reset({
      name_vi: item.name_vi,
      name_en: item.name_en || '',
      festival_type: item.festival_type || '',
      description_vi: item.description_vi || '',
      start_date: item.start_date ? item.start_date.slice(0, 10) : '',
      end_date: item.end_date ? item.end_date.slice(0, 10) : '',
      is_recurring: item.is_recurring,
      cover_image_url: item.cover_image_url || '',
      website: item.website || '',
      location_name: item.location_name || '',
      province_code: item.province_code || '',
      is_published: item.is_published,
    })
    setFormDialogOpen(true)
  }

  const handleFormSubmit: SubmitHandler<FestivalFormValues> = (formData) => {
    const payload: FestivalFormBody = {
      name_vi: formData.name_vi,
      ...(formData.name_en?.trim() && { name_en: formData.name_en }),
      ...(formData.festival_type?.trim() && { festival_type: formData.festival_type }),
      ...(formData.description_vi?.trim() && { description_vi: formData.description_vi }),
      ...(formData.start_date?.trim() && { start_date: formData.start_date }),
      ...(formData.end_date?.trim() && { end_date: formData.end_date }),
      is_recurring: formData.is_recurring,
      ...(formData.cover_image_url?.trim() && { cover_image_url: formData.cover_image_url }),
      ...(formData.website?.trim() && { website: formData.website }),
      ...(formData.location_name?.trim() && { location_name: formData.location_name }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      is_published: formData.is_published,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <PageLayout title="Lễ hội & sự kiện" description="Quản lý danh mục lễ hội và sự kiện">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        filter={
          <div className="flex items-center gap-2">
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
              Thêm lễ hội
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
              <TableHead>Tên (VI)</TableHead>
              <TableHead className="w-36">Loại</TableHead>
              <TableHead className="w-32">Thời gian</TableHead>
              <TableHead className="w-24">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Festival) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.cover_image_url ? (
                      <img
                        src={parseLink(item.cover_image_url)}
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
                    {item.location_name && (
                      <p className="text-muted-foreground text-xs">{item.location_name}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.festival_type || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {item.start_date ? formatDate(item.start_date) : '-'}
                    {item.end_date && (
                      <span className="text-muted-foreground"> → {formatDate(item.end_date)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_published ? (
                      <Badge variant="default">Đã xuất bản</Badge>
                    ) : (
                      <Badge variant="outline">Nháp</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.created_at ? formatDate(item.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
        <DialogContent className="max-h-[80vh] max-w-lg overflow-y-auto">
          <DialogTitle>{editItem ? 'Chỉnh sửa lễ hội' : 'Thêm lễ hội mới'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Cập nhật thông tin lễ hội' : 'Thêm lễ hội hoặc sự kiện mới'}
          </DialogDescription>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name_vi">Tên (VI) <span className="text-destructive">*</span></Label>
              <Input id="name_vi" {...register('name_vi')} placeholder="Tên tiếng Việt" />
              {errors.name_vi && <p className="text-destructive text-sm">{errors.name_vi.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_en">Tên (EN)</Label>
                <Input id="name_en" {...register('name_en')} placeholder="English name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="festival_type">Loại lễ hội</Label>
                <Input id="festival_type" {...register('festival_type')} placeholder="VD: Truyền thống..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_vi">Mô tả</Label>
              <Textarea id="description_vi" {...register('description_vi')} rows={3} placeholder="Mô tả lễ hội" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Ngày bắt đầu</Label>
                <Input id="start_date" type="date" {...register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Ngày kết thúc</Label>
                <Input id="end_date" type="date" {...register('end_date')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_name">Địa điểm</Label>
              <Input id="location_name" {...register('location_name')} placeholder="Tên địa điểm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">URL ảnh bìa</Label>
              <Input id="cover_image_url" {...register('cover_image_url')} placeholder="https://..." />
              {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register('website')} placeholder="https://..." />
              {errors.website && <p className="text-destructive text-sm">{errors.website.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province_code">Mã tỉnh</Label>
                <Input id="province_code" {...register('province_code')} placeholder="Mã tỉnh" />
              </div>
              <div className="space-y-2">
                <Label>Định kỳ</Label>
                <Select
                  value={watch('is_recurring') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_recurring', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không</SelectItem>
                    <SelectItem value="true">Có</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Xuất bản</Label>
                <Select
                  value={watch('is_published') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_published', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Nháp</SelectItem>
                    <SelectItem value="true">Xuất bản</SelectItem>
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
