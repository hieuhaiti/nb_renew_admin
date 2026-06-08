import type { JSX } from 'react'
import { statisticsService, useApiQuery } from '@/service'
import type { ApiResponse } from '@/types/api'
import type { StatisticsDataFile, StatisticsDataFilesPayload } from '@/service/statisticsService'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, FileBarChart2, RefreshCw } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import { toast } from 'react-toastify'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFormatLabel(format: string): string {
  return format.toUpperCase()
}

export default function StatisticsPage(): JSX.Element {
  const dbQuery = useApiQuery(
    ['statistics-data-files'],
    () => statisticsService.getDataFiles(),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const payload = (dbQuery.data as ApiResponse<StatisticsDataFilesPayload>)?.data
  const items: StatisticsDataFile[] = Array.isArray(payload?.files) ? payload.files : []
  const total = typeof payload?.total === 'number' ? payload.total : items.length

  async function handleDownload(item: StatisticsDataFile) {
    if (item.download_url) {
      window.open(item.download_url, '_blank')
      return
    }

    try {
      const res = await statisticsService.downloadFile(item.name)
      const url = (res as ApiResponse<{ download_url?: string }>)?.data?.download_url
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.warning('Không tìm thấy đường dẫn tải xuống')
      }
    } catch {
      toast.error('Không thể tải file, vui lòng thử lại')
    }
  }

  return (
    <PageLayout
      title="Dữ liệu thống kê"
      description="Tải xuống các file báo cáo và dữ liệu thống kê hệ thống"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{total > 0 ? `${total} file dữ liệu` : ''}</p>
        <Button
          variant="secondary"
          onClick={() => dbQuery.refetch()}
          disabled={dbQuery.isFetching}
          className="gap-1.5 px-3"
        >
          <RefreshCw className={`h-6 w-6 ${dbQuery.isFetching ? 'animate-spin' : ''}`} />
          {dbQuery.isFetching ? 'Đang tải...' : 'Tải lại'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Tên file</TableHead>
              <TableHead>Định dạng</TableHead>
              <TableHead className="w-24 text-right">Số dòng</TableHead>
              <TableHead className="w-32 text-right">Dung lượng</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-destructive py-8 text-center">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                  <FileBarChart2 className="text-muted-foreground/40 mx-auto mb-2 size-8" />
                  Không có file dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{item.title || item.name}</p>
                      <p className="text-muted-foreground text-xs">{item.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getFormatLabel(item.format)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {item.rows.toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right text-sm tabular-nums">
                    {formatFileSize(item.size_bytes)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.generated_at
                      ? formatDateTime(item.generated_at)
                      : item.last_modified
                        ? formatDateTime(item.last_modified)
                        : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(item)}
                      title="Tải xuống"
                    >
                      <Download className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageLayout>
  )
}
