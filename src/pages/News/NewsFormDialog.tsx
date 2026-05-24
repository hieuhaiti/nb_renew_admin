import { useEffect } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { newsService, useApiQuery } from '@/service'
import type { ApiResponse, News, NewsFormBody } from '@/types/api'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

const newsSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(500, 'Tiêu đề không được vượt quá 500 ký tự'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  slug: z
    .string()
    .max(500, 'Slug không được vượt quá 500 ký tự')
    .regex(/^[a-z0-9-]*$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
    .optional()
    .or(z.literal('')),
  author_name: z.string().max(255).optional().or(z.literal('')),
  summary: z.string().max(1000, 'Tóm tắt không được vượt quá 1000 ký tự').optional().or(z.literal('')),
  thumbnail_url: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  published_at: z.string().optional().or(z.literal('')),
})

type NewsFormValues = z.infer<typeof newsSchema>

interface NewsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newsId: string | null
  onSubmit: (data: NewsFormBody) => void
  isLoading?: boolean
}

export default function NewsFormDialog({
  open,
  onOpenChange,
  newsId,
  onSubmit,
  isLoading = false,
}: NewsFormDialogProps) {
  const dbQuery = useApiQuery(
    ['news', newsId],
    () => newsService.getByIdAdmin(newsId!),
    { enabled: !!newsId && open, staleTime: 0 },
    false,
    false
  )
  const news = (dbQuery.data as unknown as ApiResponse<News>)?.data ?? null
  const isEdit = !!news

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema) as any,
    defaultValues: {
      title: '',
      content: '',
      slug: '',
      author_name: '',
      summary: '',
      thumbnail_url: '',
      tags: '',
      is_published: false,
      is_featured: false,
      published_at: '',
    },
  })

  useEffect(() => {
    if (news) {
      const pad = (n: number) => String(n).padStart(2, '0')
      let pubAt = ''
      if (news.published_at) {
        const d = new Date(news.published_at)
        pubAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      reset({
        title: news.title,
        content: news.content,
        slug: news.slug || '',
        author_name: news.author_name || '',
        summary: news.summary || '',
        thumbnail_url: news.thumbnail_url || '',
        tags: (news.tags || []).join(','),
        is_published: news.is_published,
        is_featured: news.is_featured,
        published_at: pubAt,
      })
    } else {
      reset({
        title: '',
        content: '',
        slug: '',
        author_name: '',
        summary: '',
        thumbnail_url: '',
        tags: '',
        is_published: false,
        is_featured: false,
        published_at: '',
      })
    }
  }, [news, reset, open])

  const handleFormSubmit: SubmitHandler<NewsFormValues> = (data) => {
    const payload: NewsFormBody = {
      title: data.title,
      content: data.content,
      ...(data.slug?.trim() && { slug: data.slug.trim().toLowerCase() }),
      ...(data.author_name?.trim() && { author_name: data.author_name }),
      ...(data.summary?.trim() && { summary: data.summary }),
      ...(data.thumbnail_url?.trim() && { thumbnail_url: data.thumbnail_url }),
      is_published: data.is_published,
      is_featured: data.is_featured,
      ...(data.published_at?.trim() && {
        published_at: new Date(data.published_at).toISOString(),
      }),
      ...(data.tags?.trim() && {
        tags: data.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    }
    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>{isEdit ? 'Chỉnh sửa tin tức' : 'Thêm tin tức mới'}</DialogTitle>
        <DialogDescription>
          {isEdit ? 'Cập nhật thông tin bài viết' : 'Điền thông tin để tạo bài viết mới'}
        </DialogDescription>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Tiêu đề <span className="text-destructive">*</span>
            </Label>
            <Input id="title" {...register('title')} placeholder="Nhập tiêu đề bài viết" />
            {errors.title && <p className="text-destructive text-sm">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register('slug')} placeholder="tieu-de-bai-viet" />
              {errors.slug && <p className="text-destructive text-sm">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="author_name">Tác giả</Label>
              <Input id="author_name" {...register('author_name')} placeholder="Tên tác giả" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Tóm tắt</Label>
            <Textarea
              id="summary"
              {...register('summary')}
              placeholder="Nhập tóm tắt bài viết"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">
              Nội dung <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Nhập nội dung bài viết"
              rows={6}
            />
            {errors.content && <p className="text-destructive text-sm">{errors.content.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL ảnh đại diện</Label>
            <Input
              id="thumbnail_url"
              {...register('thumbnail_url')}
              placeholder="https://example.com/image.jpg"
            />
            {errors.thumbnail_url && (
              <p className="text-destructive text-sm">{errors.thumbnail_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
            <Input id="tags" {...register('tags')} placeholder="du-lich, van-hoa, am-thuc" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={watch('is_published') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_published', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Bản nháp</SelectItem>
                  <SelectItem value="true">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nổi bật</Label>
              <Select
                value={watch('is_featured') ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_featured', v === 'true')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Không</SelectItem>
                  <SelectItem value="true">Nổi bật</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="published_at">Ngày xuất bản</Label>
            <Input id="published_at" type="datetime-local" {...register('published_at')} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
