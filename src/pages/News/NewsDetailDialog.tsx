import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { newsService, useApiQuery } from '@/service'
import type { ApiResponse, News } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { UserText } from '@/components/common/UserText'
import { formatDateTime } from '@/lib/date'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { Eye, Pen, Star } from 'lucide-react'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm font-semibold">{label}:</span>
      <span className="col-span-2 text-sm">{children}</span>
    </div>
  )
}

interface NewsDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newsId: string | null
  onEdit?: () => void
}

export default function NewsDetailDialog({ open, onOpenChange, newsId, onEdit }: NewsDetailDialogProps) {
  const openLightbox = useLightboxStore((s) => s.open)
  const dbQuery = useApiQuery(
    ['news', newsId],
    () => newsService.getByIdAdmin(newsId!),
    { enabled: !!newsId && open, staleTime: 0 },
    false,
    false
  )
  const news = (dbQuery.data as unknown as ApiResponse<News>)?.data ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] max-w-3xl overflow-y-auto"
        actions={
          onEdit && (
            <button
              onClick={onEdit}
              title="Chỉnh sửa"
              className="hover:text-primary rounded-sm opacity-70 transition-opacity hover:scale-105 hover:opacity-100 focus:outline-none"
            >
              <Pen className="h-5 w-5" />
              <span className="sr-only">Chỉnh sửa</span>
            </button>
          )
        }
      >
        <DialogTitle>Chi tiết tin tức</DialogTitle>
        <DialogDescription>Thông tin chi tiết bài viết đã chọn</DialogDescription>

        {dbQuery.isLoading ? (
          <div className="text-muted-foreground py-8 text-center">Đang tải...</div>
        ) : !news ? (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        ) : (
          <div className="mt-2 space-y-3">
            {news.thumbnail_url && (
              <img
                src={parseLink(news.thumbnail_url)}
                alt={news.title}
                className="h-40 w-full cursor-zoom-in rounded-md border object-cover"
                onClick={() => openLightbox(parseLink(news.thumbnail_url!))}
              />
            )}

            {/* Core info */}
            <Row label="ID">
              <span className="font-mono text-xs">{news.id}</span>
            </Row>
            <Row label="Tiêu đề">
              <span className="font-medium">{news.title}</span>
            </Row>
            <Row label="Slug">
              <span className="font-mono text-xs">{news.slug || '-'}</span>
            </Row>
            {news.author_name && <Row label="Tác giả">{news.author_name}</Row>}
            {news.summary && (
              <Row label="Tóm tắt">
                <span className="text-muted-foreground">{news.summary}</span>
              </Row>
            )}

            {/* Status & settings */}
            <div className="border-t pt-3 space-y-3">
              <Row label="Trạng thái">
                <StatusDotBadge
                  label={news.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                  badgeClass={
                    news.is_published
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }
                  dotClass={news.is_published ? 'bg-success' : 'bg-muted-foreground'}
                />
              </Row>
              <Row label="Nổi bật">
                {news.is_featured ? (
                  <span className="flex items-center gap-1">
                    <Star className="text-warning size-4 fill-current" />
                    <span>Nổi bật</span>
                  </span>
                ) : (
                  <Badge variant="outline">Không</Badge>
                )}
              </Row>
              {news.published_at && (
                <Row label="Ngày xuất bản">{formatDateTime(news.published_at)}</Row>
              )}
              <Row label="Lượt xem">
                <span className="flex items-center gap-1">
                  <Eye className="text-muted-foreground size-4" />
                  <span>{news.view_count ?? 0}</span>
                </span>
              </Row>
            </div>

            {/* Tags */}
            {news.tags && news.tags.length > 0 && (
              <div className="border-t pt-3">
                <Row label="Tags">
                  <div className="flex flex-wrap gap-1">
                    {news.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Row>
              </div>
            )}

            {/* Content */}
            <div className="border-t pt-3">
              <Row label="Nội dung">
                <div
                  className="prose prose-sm max-h-56 overflow-y-auto rounded border p-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              </Row>
            </div>

            {/* Timestamps */}
            <div className="border-t pt-3 space-y-3">
              <Row label="Ngày tạo">{news.created_at ? formatDateTime(news.created_at) : '-'}</Row>
              {news.created_by && (
                <Row label="Tạo bởi">
                  <UserText userId={news.created_by} />
                </Row>
              )}
              <Row label="Cập nhật">{news.updated_at ? formatDateTime(news.updated_at) : '-'}</Row>
              {news.updated_by && (
                <Row label="Cập nhật bởi">
                  <UserText userId={news.updated_by} />
                </Row>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
