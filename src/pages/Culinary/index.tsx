import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, culinaryService } from '@/service'
import type { ApiResponse, Culinary, CulinaryListData, CulinaryFormBody, Pagination } from '@/types/api'
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

const culinarySchema = z.object({
  name_vi: z.string().min(1, 'Tên tiếng Việt không được để trống').max(255),
  name_en: z.string().max(255).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  description_vi: z.string().optional().or(z.literal('')),
  cover_image_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  is_speciality: z.boolean(),
  province_code: z.string().max(10).optional().or(z.literal('')),
})
type CulinaryFormValues = z.infer<typeof culinarySchema>

export default function CulinaryPage(): JSX.Element {
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
    ['culinary', queryParams],
    () => culinaryService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<CulinaryListData>)?.data
  const items = data?.items ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Culinary | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Culinary | null>(null)

  const createMutation = useApiMutation(
    (payload: CulinaryFormBody) => culinaryService.create(payload),
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
    (payload: { id: string; data: CulinaryFormBody }) =>
      culinaryService.update(payload.id, payload.data),
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
    (id: string) => culinaryService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CulinaryFormValues>({
    resolver: zodResolver(culinarySchema) as any,
    defaultValues: {
      name_vi: '',
      name_en: '',
      category: '',
      description_vi: '',
      cover_image_url: '',
      is_speciality: false,
      province_code: '',
    },
  })

  function openAdd() {
    setEditItem(null)
    reset({ name_vi: '', name_en: '', category: '', description_vi: '', cover_image_url: '', is_speciality: false, province_code: '' })
    setFormDialogOpen(true)
  }

  function openEdit(item: Culinary) {
    setEditItem(item)
    reset({
      name_vi: item.name_vi,
      name_en: item.name_en || '',
      category: item.category || '',
      description_vi: item.description_vi || '',
      cover_image_url: item.cover_image_url || '',
      is_speciality: item.is_speciality,
      province_code: item.province_code || '',
    })
    setFormDialogOpen(true)
  }

  const handleFormSubmit: SubmitHandler<CulinaryFormValues> = (data) => {
    const payload: CulinaryFormBody = {
      name_vi: data.name_vi,
      ...(data.name_en?.trim() && { name_en: data.name_en }),
      ...(data.category?.trim() && { category: data.category }),
      ...(data.description_vi?.trim() && { description_vi: data.description_vi }),
      ...(data.cover_image_url?.trim() && { cover_image_url: data.cover_image_url }),
      is_speciality: data.is_speciality,
      ...(data.province_code?.trim() && { province_code: data.province_code }),
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <PageLayout title="Ẩm thực" description="Quản lý danh mục ẩm thực">
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
              Thêm ẩm thực
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
              <TableHead className="w-36">Phân loại</TableHead>
              <TableHead className="w-24">Đặc sản</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Culinary) => (
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category || '-'}</TableCell>
                  <TableCell>
                    {item.is_speciality ? (
                      <Badge variant="default">Đặc sản</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
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
          <DialogTitle>{editItem ? 'Chỉnh sửa ẩm thực' : 'Thêm ẩm thực mới'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Cập nhật thông tin' : 'Thêm món ẩm thực mới'}
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
                <Input id="category" {...register('category')} placeholder="VD: Món chính..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description_vi">Mô tả</Label>
              <Textarea id="description_vi" {...register('description_vi')} rows={3} placeholder="Mô tả về món ăn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">URL ảnh bìa</Label>
              <Input id="cover_image_url" {...register('cover_image_url')} placeholder="https://..." />
              {errors.cover_image_url && <p className="text-destructive text-sm">{errors.cover_image_url.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province_code">Tỉnh/Thành</Label>
                <Input id="province_code" {...register('province_code')} placeholder="Mã tỉnh" />
              </div>
              <div className="space-y-2">
                <Label>Đặc sản</Label>
                <Select
                  value={watch('is_speciality') ? 'true' : 'false'}
                  onValueChange={(v) => setValue('is_speciality', v === 'true')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không</SelectItem>
                    <SelectItem value="true">Đặc sản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)} disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : editItem ? 'Cập nhật' : 'Tạo mới'}
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
