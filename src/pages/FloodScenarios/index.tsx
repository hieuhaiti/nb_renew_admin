import { useState, useEffect } from 'react'
import { useApiQuery, useApiMutation, floodScenarioService } from '@/service'
import type { FloodScenario, FloodScenarioFormBody } from '@/types/api'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { Pen, Trash2, Plus } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { STALE_DEFAULT } from '@/constant/queryConstant'
import FloodScenarioFormDialog from './FloodScenarioFormDialog'
import FloodScenarioDetailDialog from './FloodScenarioDetailDialog'

function rainfallLabel(min: string, max: string | null) {
  const minN = parseFloat(min)
  if (max == null) return `≥ ${minN} mm`
  return `${minN} – ${parseFloat(max)} mm`
}

function tideLabel(min: string | null, max: string | null) {
  if (min == null && max == null) return '-'
  if (min == null) return `≤ ${parseFloat(max!)} m`
  if (max == null) return `≥ ${parseFloat(min)} m`
  return `${parseFloat(min)} – ${parseFloat(max)} m`
}

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Thủ công',
  AUTO: 'Tự động',
}

export default function FloodScenariosPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)
  const [searchValue, setSearchValue] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const queryParams = {
    page: currentPage,
    limit,
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['flood-scenarios', queryParams],
    () => floodScenarioService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false,
  )

  const items: FloodScenario[] = (dbQuery.data as any)?.data?.items ?? []
  const paginationMeta = (dbQuery.data as any)?.metadata?.pagination ?? (dbQuery.data as any)?.metadata
  const totalPages: number = paginationMeta?.totalPages ?? 1
  const total: number = paginationMeta?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const saveMutation = useApiMutation(
    (payload: { id: number | null; data: FloodScenarioFormBody }) =>
      payload.id
        ? floodScenarioService.update(payload.id, payload.data)
        : floodScenarioService.create(payload.data),
    {
      onSuccess: () => {
        setFormOpen(false)
        setSelectedId(null)
        dbQuery.refetch()
      },
    },
    true,
  )

  const deleteMutation = useApiMutation(
    (id: number) => floodScenarioService.delete(id),
    {
      onSuccess: () => {
        setDeleteId(null)
        dbQuery.refetch()
      },
    },
    true,
  )

  function openCreate() {
    setSelectedId(null)
    setFormOpen(true)
  }

  function openEdit(id: number) {
    setSelectedId(id)
    setFormOpen(true)
  }

  function openDetail(id: number) {
    setSelectedId(id)
    setDetailOpen(true)
  }

  return (
    <PageLayout title="Kịch bản ngập" description="Quản lý các kịch bản ngập úng theo mưa và triều cường">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Thêm kịch bản
          </Button>
        }
        total={total}
        pagination={{
          currentPage,
          totalPages,
          onPageChange: setCurrentPage,
        }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Mã</TableHead>
              <TableHead>Tên kịch bản</TableHead>
              <TableHead>Ngưỡng lượng mưa</TableHead>
              <TableHead>Ngưỡng triều cường</TableHead>
              <TableHead>Mưa hiện tại</TableHead>
              <TableHead>Triều hiện tại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-muted-foreground text-center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={10} className="text-destructive text-center">
                  Không thể tải danh sách kịch bản ngập.
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-muted-foreground text-center">
                  Chưa có kịch bản ngập nào.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(item.id)}
                >
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name_vi}</TableCell>
                  <TableCell className="text-sm">{rainfallLabel(item.min_rainfall, item.max_rainfall)}</TableCell>
                  <TableCell className="text-sm">{tideLabel(item.min_tide, item.max_tide)}</TableCell>
                  <TableCell className="text-sm">
                    {item.current_rainfall != null
                      ? `${parseFloat(item.current_rainfall)} mm`
                      : <span className="text-muted-foreground text-xs">-</span>}
                    {item.current_rainfall != null && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({SOURCE_LABEL[item.rainfall_source] ?? item.rainfall_source})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.current_tide != null
                      ? `${parseFloat(item.current_tide)} m`
                      : <span className="text-muted-foreground text-xs">-</span>}
                    {item.current_tide != null && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({SOURCE_LABEL[item.tide_source] ?? item.tide_source})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">Đang bật</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Tắt</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(item.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEdit(item.id) }}
                        title="Chỉnh sửa"
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}
                        title="Xóa"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ToolTableCustom>

      <FloodScenarioDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        scenarioId={selectedId}
        onEdit={() => {
          setDetailOpen(false)
          setFormOpen(true)
        }}
      />

      <FloodScenarioFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setSelectedId(null) }}
        scenarioId={selectedId}
        onSubmit={(data) => saveMutation.mutate({ id: selectedId, data })}
        isLoading={saveMutation.isPending}
      />

      <AlertDialog open={deleteId != null} onOpenChange={(v) => { if (!v) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này không thể hoàn tác. Kịch bản ngập sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId != null && deleteMutation.mutate(deleteId)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  )
}
