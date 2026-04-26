import type { JSX } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import PageLayout from '@/layout/pageLayout'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Pen, ShieldCheck, Trash2 } from 'lucide-react'
import { mapLayerApiService, useApiMutation, useApiQuery } from '@/service'
import { useAuthStore } from '@/stores/common/useAuthStore'
import type { ApiResponse, MapLayerApi, MapLayerApiListData, Pagination } from '@/types/api'
import { formatDateTime } from '@/lib/date'
import { getMappedErrorMessage } from '@/validators/mapLayerApiValidators'
import { hasMapLayerApiPermission } from '@/components/map-layer-apis/permissionUtils'
import { StatusDotBadge } from '@/components/common/StatusDotBadge'
import { PUBLISHED_LABEL, PUBLISHED_CLASS, PUBLISHED_DOT } from '@/constant/newsConstant'
import ApiKeysTab from '@/components/map-layer-apis/ApiKeysTab'
import PermissionsTab from '@/components/map-layer-apis/PermissionsTab'
import CategorySelectField from '@/components/features/CategorySelectField'
import MapLayerApiDetailDialog from './MapLayerApiDetailDialog'
import MapLayerApiFormDialog from './MapLayerApiFormDialog'

const tabValues = ['apis', 'apikeys'] as const
type MapLayerApiTab = (typeof tabValues)[number]

function toValidTab(value: string | null, canShare: boolean): MapLayerApiTab {
  if (value === 'apikeys' && canShare) return 'apikeys'
  return 'apis'
}

function toValidApiId(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined
  return parsed
}

export default function MapLayerApiListPage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)

  const canCreate = hasMapLayerApiPermission(user, 'create')
  const canUpdate = hasMapLayerApiPermission(user, 'update')
  const canDelete = hasMapLayerApiPermission(user, 'delete')
  const canShare = hasMapLayerApiPermission(user, 'share')

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at' as const,
    sortOrder: 'DESC' as const,
    ...(searchValue.trim() && { search: searchValue.trim() }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(categoryFilter !== 'all' && { category_id: Number(categoryFilter) }),
  }

  const listQuery = useApiQuery(
    ['mapLayerApis', queryParams],
    () => mapLayerApiService.getAll(queryParams),
    {},
    false,
    false
  )

  const allApisQuery = useApiQuery(
    ['mapLayerApiAllForKeySelection'],
    () => mapLayerApiService.getAll({ page: 1, limit: 100, sortBy: 'id', sortOrder: 'ASC' }),
    {},
    false,
    false
  )

  const data = (listQuery.data as ApiResponse<MapLayerApiListData> | undefined)?.data
  const apis = data?.apis ?? []
  const availableApis =
    ((allApisQuery.data as ApiResponse<MapLayerApiListData> | undefined)?.data?.apis as
      | MapLayerApi[]
      | undefined) ?? []

  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedApiId, setSelectedApiId] = useState<number | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [apiToDelete, setApiToDelete] = useState<MapLayerApi | null>(null)
  const currentTab = toValidTab(searchParams.get('tab'), canShare)
  const currentKeyApiId = useMemo(() => toValidApiId(searchParams.get('keyApiId')), [searchParams])

  const deleteMutation = useApiMutation(
    (id: number) => mapLayerApiService.delete(id),
    {
      onSuccess: () => {
        toast.success('Xóa API thành công')
        listQuery.refetch()
        setDeleteDialogOpen(false)
        setApiToDelete(null)
      },
      onError: (error) => {
        toast.error(getMappedErrorMessage(error, 'Khong the xoa API.'))
      },
    },
    false
  )

  function openDetails(api: MapLayerApi) {
    if (api?.id) {
      setSelectedApiId(api.id)
      setDetailDialogOpen(true)
    }
  }

  function openAddDialog() {
    setSelectedApiId(null)
    setFormDialogOpen(true)
  }

  function openEditDialog(api: MapLayerApi) {
    setSelectedApiId(api.id)
    setFormDialogOpen(true)
  }

  function openDeleteDialog(api: MapLayerApi) {
    setApiToDelete(api)
    setDeleteDialogOpen(true)
  }

  function openPermissionDialog(api: MapLayerApi) {
    setSelectedApiId(api.id)
    setPermissionDialogOpen(true)
  }

  function handleTabChange(tab: string) {
    const nextTab = toValidTab(tab, canShare)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', nextTab)
    if (nextTab !== 'apikeys') nextParams.delete('keyApiId')
    setSearchParams(nextParams)
  }

  function handleDelete() {
    if (apiToDelete) deleteMutation.mutate(apiToDelete.id)
  }

  return (
    <PageLayout title="Quản lý Map Layer API" description="Danh sách API lớp bản đồ">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="apis">Danh sách API</TabsTrigger>
          {canShare && <TabsTrigger value="apikeys">API Keys</TabsTrigger>}
        </TabsList>

        <TabsContent value="apis">
          <ToolTableCustom
            searchValue={searchValue}
            setSearchValue={(value) => {
              setSearchValue(value)
              setCurrentPage(1)
            }}
            filter={
              <div className="flex flex-wrap items-center gap-2">
                <CategorySelectField
                  value={categoryFilter}
                  onValueChange={(value) => {
                    setCategoryFilter(value)
                    setCurrentPage(1)
                  }}
                  showLabel={false}
                  required={false}
                  includeAllOption
                  allOptionLabel="Tất cả danh mục"
                  placeholder="Danh mục"
                  containerClassName="w-[220px] space-y-0"
                />

                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as 'all' | 'draft' | 'published')
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={`${limit}`}
                  onValueChange={(v) => {
                    setLimit(parseInt(v, 10))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                {canCreate && <Button onClick={openAddDialog}>Thêm API</Button>}
                <Button variant="outline" onClick={() => navigate('/public/map-layer-apis')}>
                  Public Test
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
                  <TableHead>ID</TableHead>
                  <TableHead>Tên API</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  apis.map((api) => (
                    <TableRow
                      key={api.id}
                      className="hover:cursor-pointer"
                      onClick={() => openDetails(api)}
                    >
                      <TableCell>{api.id}</TableCell>
                      <TableCell>{api.name}</TableCell>
                      <TableCell>{api.category_name ?? '-'}</TableCell>
                      <TableCell className="uppercase">{api.http_method}</TableCell>
                      <TableCell>
                        <StatusDotBadge
                          label={PUBLISHED_LABEL[String(api.status === 'published')]}
                          badgeClass={PUBLISHED_CLASS[String(api.status === 'published')]}
                          dotClass={PUBLISHED_DOT[String(api.status === 'published')]}
                        />
                      </TableCell>
                      <TableCell>{api.created_at ? formatDateTime(api.created_at) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canShare && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openPermissionDialog(api)
                              }}
                              title="Phân quyền API"
                            >
                              <ShieldCheck className="size-4" />
                            </Button>
                          )}
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialog(api)
                              }}
                              title="Chỉnh sửa"
                            >
                              <Pen className="size-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(api)
                              }}
                              title="Xóa"
                            >
                              <Trash2 className="text-destructive size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>
        </TabsContent>

        {canShare && (
          <TabsContent value="apikeys">
            <div className="bg-card rounded-lg border p-4">
              <ApiKeysTab availableApis={availableApis} currentApiId={currentKeyApiId} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      <MapLayerApiDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        apiId={selectedApiId}
      />

      <MapLayerApiFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        apiId={selectedApiId}
        onSaved={() => {
          listQuery.refetch()
        }}
      />

      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogTitle>Phân quyền API</DialogTitle>
          <DialogDescription>Quản lý danh sách quyền truy cập API đã chọn</DialogDescription>
          {selectedApiId ? (
            <div className="mt-4">
              <PermissionsTab apiId={selectedApiId} />
            </div>
          ) : (
            <div className="mt-4">Không có dữ liệu</div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa API "{apiToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
