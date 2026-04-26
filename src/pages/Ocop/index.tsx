import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, ocopService } from '@/service'
import type { ApiResponse, OcopProduct, OcopListData, OcopFormBody, Pagination } from '@/types/api'
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

const STAR_LABELS: Record<number, string> = { 1: '⭐', 2: '⭐⭐', 3: '⭐⭐⭐', 4: '⭐⭐⭐⭐', 5: '⭐⭐⭐⭐⭐' }

const ocopSchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  name_en: z.string().max(255).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  star_rating: z.coerce.number().min(1).max(5).optional(),
  certification_no: z.string().max(100).optional().or(z.literal('')),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  price_vnd: z.coerce.number().min(0).optional(),
  unit: z.string().max(50).optional().or(z.literal('')),
  shop_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  producer_name: z.string().max(255).optional().or(z.literal('')),
  province_code: z.string().max(10).optional().or(z.literal('')),
  is_active: z.boolean(),
})
type OcopFormValues = z.infer<typeof ocopSchema>

export default function OcopPage(): JSX.Element {
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
    ['ocop', queryParams],
    () => ocopService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<OcopListData>)?.data
  const items = data?.products ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<OcopProduct | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<OcopProduct | null>(null)

  const createMutation = useApiMutation(
    (payload: OcopFormBody) => ocopService.create(payload),
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
    (payload: { id: string; data: OcopFormBody }) =>
      ocopService.update(payload.id, payload.data),
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
    (id: string) => ocopService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const defaultValues: OcopFormValues = {
    name_vi: '',
    name_en: '',
    category: '',
    description_vi: '',
    star_rating: undefined,
    certification_no: '',
    cover_image_url: '',
    price_vnd: undefined,
    unit: '',
    shop_url: '',
    producer_name: '',
    province_code: '',
    is_active: true,
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OcopFormValues>({
    resolver: zodResolver(ocopSchema) as any,
    defaultValues,
  })

  function openAdd() {
    setEditItem(null)
    reset(defaultValues)
    setFormDialogOpen(true)
  }

  function openEdit(item: OcopProduct) {
    setEditItem(item)
    reset({
      name_vi: item.name_vi,
      name_en: item.name_en || '',
      category: item.category || '',
      description_vi: item.description_vi || '',
      star_rating: item.star_rating ?? undefined,
      certification_no: item.certification_no || '',
      cover_image_url: item.cover_image_url || '',
      price_vnd: item.price_vnd ?? undefined,
      unit: item.unit || '',
      shop_url: item.shop_url || '',
      producer_name: item.producer_name || '',
      province_code: item.province_code || '',
      is_active: item.is_active,
    })
    setFormDialogOpen(true)
  }

  const handleFormSubmit: SubmitHandler<OcopFormValues> = (formData) => {
    const payload: OcopFormBody = {
      name_vi: formData.name_vi,
      ...(formData.name_en?.trim() && { name_en: formData.name_en }),
      ...(formData.category?.trim() && { category: formData.category }),
      ...(formData.description_vi?.trim() && { description_vi: formData.description_vi }),
      ...(formData.star_rating != null && { star_rating: formData.star_rating }),
      ...(formData.certification_no?.trim() && { certification_no: formData.certification_no }),
      ...(formData.cover_image_url?.trim() && { cover_image_url: formData.cover_image_url }),
      ...(formData.price_vnd != null && { price_vnd: formData.price_vnd }),
      ...(formData.unit?.trim() && { unit: formData.unit }),
      ...(formData.shop_url?.trim() && { shop_url: formData.shop_url }),
      ...(formData.producer_name?.trim() && { producer_name: formData.producer_name }),
      ...(formData.province_code?.trim() && { province_code: formData.province_code }),
      is_active: formData.is_active,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <PageLayout title="Sản phẩm OCOP" description="Quản lý sản phẩm OCOP">
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
              Thêm sản phẩm
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
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead className="w-28">Phân loại</TableHead>
              <TableHead className="w-24">Sao OCOP</TableHead>
              <TableHead className="w-36">Nhà sản xuất</TableHead>
              <TableHead className="w-20">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
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
              items.map((item: OcopProduct) => (
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
                    {item.price_vnd != null && (
                      <p className="text-muted-foreground text-xs">
                        {item.price_vnd.toLocaleString('vi-VN')}đ{item.unit ? `/${item.unit}` : ''}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category || '-'}</TableCell>
                  <TableCell className="text-warning text-sm">
                    {item.star_rating != null ? STAR_LABELS[item.star_rating] : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.producer_name || '-'}
                  </TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <Badge variant="default">Hoạt động</Badge>
                    ) : (
                      <Badge variant="outline">Ẩn</Badge>
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
          <DialogTitle>{editItem ? 'Chỉnh sửa sản phẩm OCOP' : 'Thêm sản phẩm OCOP'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Cập nhật thông tin sản phẩm' : 'Thêm sản phẩm OCOP mới'}
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
                <Label htmlFor="category">Phân loại</Label>
                <Input id="category" {...register('category')} placeholder="Loại sản phẩm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_vi">Mô tả</Label>
              <Textarea id="description_vi" {...register('description_vi')} rows={3} placeholder="Mô tả sản phẩm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="producer_name">Nhà sản xuất</Label>
                <Input id="producer_name" {...register('producer_name')} placeholder="Tên nhà sản xuất" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification_no">Số chứng nhận</Label>
                <Input id="certification_no" {...register('certification_no')} placeholder="Mã chứng nhận OCOP" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_vnd">Giá (VNĐ)</Label>
                <Input id="price_vnd" type="number" min={0} {...register('price_vnd')} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Đơn vị</Label>
                <Input id="unit" {...register('unit')} placeholder="VD: kg, hộp..." />
              </div>
              <div className="space-y-2">
                <Label>Sao OCOP</Label>
                <Select
                  value={watch('star_rating') != null ? `${watch('star_rating')}` : ''}
                  onValueChange={(v) => setValue('star_rating', v ? parseInt(v, 10) : undefined)}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 sao</SelectItem>
                    <SelectItem value="2">2 sao</SelectItem>
                    <SelectItem value="3">3 sao</SelectItem>
                    <SelectItem value="4">4 sao</SelectItem>
                    <SelectItem value="5">5 sao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">URL ảnh bìa</Label>
              <Input id="cover_image_url" {...register('cover_image_url')} placeholder="https://..." />
              {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop_url">URL cửa hàng</Label>
              <Input id="shop_url" {...register('shop_url')} placeholder="https://..." />
              {errors.shop_url && <p className="text-destructive text-sm">{errors.shop_url.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province_code">Mã tỉnh</Label>
                <Input id="province_code" {...register('province_code')} placeholder="Mã tỉnh" />
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={watch('is_active') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_active', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Ẩn</SelectItem>
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
