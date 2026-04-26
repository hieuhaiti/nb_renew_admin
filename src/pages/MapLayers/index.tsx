import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { mapLayerService, useApiMutation, useApiQuery } from '@/service'
import type { ApiResponse, MapLayer, MapLayerListData, Pagination } from '@/types/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, EyeOff } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'

const ACTIVE_LABEL: Record<string, string> = {
  true: 'Hoạt động',
  false: 'Ngừng',
}
const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted text-muted-foreground border-border',
}
const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

export default function MapLayerPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [geometryFilter, setGeometryFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    ...(statusFilter !== 'all' && { is_active: statusFilter === 'true' }),
    ...(geometryFilter !== 'all' && { geometry_type: geometryFilter }),
  }

  const dbQuery = useApiQuery(
    ['mapLayers', queryParams],
    () => mapLayerService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<MapLayerListData>)?.data
  const layers = data?.mapLayers ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const toggleMutation = useApiMutation(
    (id: number) => mapLayerService.toggle(id),
    { onSuccess: () => dbQuery.refetch() },
    true
  )

  return (
    <PageLayout title="Lớp bản đồ" description="Quản lý lớp dữ liệu bản đồ">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(value) => {
          setSearchValue(value)
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
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={geometryFilter}
              onValueChange={(v) => {
                setGeometryFilter(v)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi hình học</SelectItem>
                <SelectItem value="point">Point</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
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
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên lớp</TableHead>
              <TableHead className="w-32">Danh mục</TableHead>
              <TableHead className="w-24">Kiểu hình học</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-20 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              layers.map((layer: MapLayer) => (
                <TableRow key={layer.id}>
                  <TableCell>{layer.id}</TableCell>
                  <TableCell className="max-w-64 font-medium">
                    <span className="line-clamp-2">{layer.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{layer.category_name || '-'}</TableCell>
                  <TableCell className="uppercase">{layer.geometry_type || '-'}</TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(layer.is_active)]}
                      badgeClass={ACTIVE_CLASS[String(layer.is_active)]}
                      dotClass={ACTIVE_DOT[String(layer.is_active)]}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {layer.created_at ? formatDate(layer.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMutation.mutate(layer.id)}
                      title={layer.is_active ? 'Ngừng hoạt động' : 'Kích hoạt'}
                    >
                      {layer.is_active ? (
                        <EyeOff className="text-muted-foreground size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>
    </PageLayout>
  )
}
