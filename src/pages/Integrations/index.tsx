import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, integrationService } from '@/service'
import type {
  ApiResponse,
  Integration,
  IntegrationListData,
  IntegrationFormBody,
  IntegrationType,
  IntegrationAuthType,
  IntegrationLog,
  IntegrationLogListData,
  Pagination,
} from '@/types/api'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import { Pen, Plus, Trash2, RefreshCw, ScrollText } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDateTime } from '@/lib/date'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { STALE_DEFAULT, STALE_HOT } from '@/constant/queryConstant'

const INTEGRATION_TYPE_LABEL: Record<IntegrationType, string> = {
  data_sync: 'Đồng bộ dữ liệu',
  booking: 'Đặt chỗ',
  payment: 'Thanh toán',
  notification: 'Thông báo',
  analytics: 'Phân tích',
}

const AUTH_TYPE_LABEL: Record<IntegrationAuthType, string> = {
  api_key: 'API Key',
  oauth2: 'OAuth 2.0',
  basic: 'Basic Auth',
  none: 'Không xác thực',
}

const ACTIVE_LABEL: Record<string, string> = { true: 'Đang hoạt động', false: 'Tắt' }
const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/20',
  false: 'bg-muted/40 text-muted-foreground border-border',
}
const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

const LOG_STATUS_LABEL: Record<string, string> = { success: 'Thành công', error: 'Lỗi' }
const LOG_STATUS_CLASS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
}
const LOG_STATUS_DOT: Record<string, string> = {
  success: 'bg-success',
  error: 'bg-destructive',
}

const integrationSchema = z.object({
  provider_code: z.string().min(1, 'Mã nhà cung cấp không được để trống').max(50),
  provider_name: z.string().min(1, 'Tên nhà cung cấp không được để trống').max(255),
  integration_type: z.enum(['data_sync', 'booking', 'payment', 'notification', 'analytics']),
  base_url: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  auth_type: z.enum(['api_key', 'oauth2', 'basic', 'none']),
  webhook_secret: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean(),
})
type IntegrationFormValues = z.infer<typeof integrationSchema>

export default function IntegrationPage(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(activeFilter !== 'all' && { is_active: activeFilter === 'true' }),
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['integrations', queryParams],
    () => integrationService.getAll(queryParams),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<IntegrationListData>)?.data
  const items = data?.integrations ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = Math.max(1, pagination?.totalPages ?? lastTotalPagesRef.current ?? 1)
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Integration | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Integration | null>(null)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [logsIntegrationId, setLogsIntegrationId] = useState<number | null>(null)
  const [syncingId, setSyncingId] = useState<number | null>(null)

  const defaultValues: IntegrationFormValues = {
    provider_code: '',
    provider_name: '',
    integration_type: 'data_sync',
    base_url: '',
    auth_type: 'api_key',
    webhook_secret: '',
    is_active: true,
  }

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<IntegrationFormValues>({ resolver: zodResolver(integrationSchema), defaultValues })

  function openCreate() {
    setEditItem(null)
    reset(defaultValues)
    setFormDialogOpen(true)
  }

  function openEdit(item: Integration) {
    setEditItem(item)
    reset({
      provider_code: item.provider_code,
      provider_name: item.provider_name,
      integration_type: item.integration_type,
      base_url: item.base_url ?? '',
      auth_type: item.auth_type,
      webhook_secret: '',
      is_active: item.is_active,
    })
    setFormDialogOpen(true)
  }

  const createMutation = useApiMutation(
    (payload: IntegrationFormBody) => integrationService.create(payload),
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
    (payload: { id: number; data: Partial<IntegrationFormBody> }) =>
      integrationService.update(payload.id, payload.data),
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
    (id: number) => integrationService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      },
    },
    true
  )

  const syncMutation = useApiMutation(
    (id: number) => integrationService.sync(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setSyncingId(null)
      },
    },
    true
  )

  const onSubmit: SubmitHandler<IntegrationFormValues> = (values) => {
    const body: IntegrationFormBody = {
      provider_code: values.provider_code,
      provider_name: values.provider_name,
      integration_type: values.integration_type,
      auth_type: values.auth_type,
      ...(values.base_url && { base_url: values.base_url }),
      ...(values.webhook_secret && { webhook_secret: values.webhook_secret }),
      is_active: values.is_active,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: body })
    } else {
      createMutation.mutate(body)
    }
  }

  // Logs query
  const logsQuery = useApiQuery(
    ['integration-logs', logsIntegrationId],
    () => integrationService.getLogs(logsIntegrationId!),
    { staleTime: STALE_HOT, enabled: logsIntegrationId != null && logsDialogOpen },
    false,
    false
  )
  const logs: IntegrationLog[] = (logsQuery.data as ApiResponse<IntegrationLogListData>)?.data?.logs ?? []
  const activeLogsIntegration = items.find((i) => i.id === logsIntegrationId)

  const isMutating = createMutation.isPending || updateMutation.isPending
  const isEdit = !!editItem

  return (
    <PageLayout
      title="Tích hợp bên thứ 3"
      description="Quản lý các tích hợp dịch vụ bên ngoài"
    >
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => { setSearchValue(v); setCurrentPage(1) }}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <div className="flex items-center gap-2">
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Tắt</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${limit}`}
              onValueChange={(v) => { setLimit(parseInt(v, 10)); setCurrentPage(1) }}
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
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 size-4" />
              Thêm tích hợp
            </Button>
          </div>
        }
        total={total}
        pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="w-36">Loại tích hợp</TableHead>
              <TableHead className="w-28">Xác thực</TableHead>
              <TableHead className="w-32">Trạng thái</TableHead>
              <TableHead className="w-36">Đồng bộ lần cuối</TableHead>
              <TableHead className="w-32 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : dbQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-destructive">
                  Đã xảy ra lỗi, vui lòng thử lại
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              items.map((item: Integration) => (
                <TableRow key={item.id} className="cursor-pointer" onClick={() => openEdit(item)}>
                  <TableCell>
                    <p className="font-medium">{item.provider_name}</p>
                    <p className="text-muted-foreground text-xs">{item.provider_code}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {INTEGRATION_TYPE_LABEL[item.integration_type] ?? item.integration_type}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {AUTH_TYPE_LABEL[item.auth_type] ?? item.auth_type}
                  </TableCell>
                  <TableCell>
                    <StatusDotBadge
                      label={ACTIVE_LABEL[String(item.is_active)]}
                      badgeClass={ACTIVE_CLASS[String(item.is_active)]}
                      dotClass={ACTIVE_DOT[String(item.is_active)]}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(item.last_synced_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setLogsIntegrationId(item.id)
                          setLogsDialogOpen(true)
                        }}
                        title="Xem nhật ký"
                      >
                        <ScrollText className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSyncingId(item.id)
                          syncMutation.mutate(item.id)
                        }}
                        title="Đồng bộ ngay"
                        disabled={syncMutation.isPending && syncingId === item.id}
                      >
                        <RefreshCw className={`size-4 ${syncMutation.isPending && syncingId === item.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openEdit(item) }}
                        title="Chỉnh sửa"
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
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

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) { setFormDialogOpen(false); setEditItem(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{isEdit ? 'Cập nhật tích hợp' : 'Thêm tích hợp mới'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Chỉnh sửa thông tin tích hợp dịch vụ bên ngoài' : 'Điền thông tin tích hợp dịch vụ bên ngoài'}
          </DialogDescription>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="provider_code">Mã nhà cung cấp <span className="text-destructive">*</span></Label>
                <Input id="provider_code" {...register('provider_code')} placeholder="google_maps" />
                {errors.provider_code && <p className="text-destructive text-xs">{errors.provider_code.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="provider_name">Tên nhà cung cấp <span className="text-destructive">*</span></Label>
                <Input id="provider_name" {...register('provider_name')} placeholder="Google Maps" />
                {errors.provider_name && <p className="text-destructive text-xs">{errors.provider_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="integration_type">Loại tích hợp</Label>
                <Select
                  value={watch('integration_type')}
                  onValueChange={(v) => setValue('integration_type', v as IntegrationType)}
                >
                  <SelectTrigger id="integration_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(INTEGRATION_TYPE_LABEL) as [IntegrationType, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="auth_type">Phương thức xác thực</Label>
                <Select
                  value={watch('auth_type')}
                  onValueChange={(v) => setValue('auth_type', v as IntegrationAuthType)}
                >
                  <SelectTrigger id="auth_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(AUTH_TYPE_LABEL) as [IntegrationAuthType, string][]).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="base_url">Base URL</Label>
              <Input id="base_url" {...register('base_url')} placeholder="https://api.example.com" />
              {errors.base_url && <p className="text-destructive text-xs">{errors.base_url.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="webhook_secret">Webhook Secret {isEdit && <span className="text-muted-foreground">(để trống giữ nguyên)</span>}</Label>
              <Input id="webhook_secret" {...register('webhook_secret')} type="password" placeholder="••••••••" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', !!checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">Kích hoạt tích hợp</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogTitle>Nhật ký tích hợp</DialogTitle>
          <DialogDescription>{activeLogsIntegration?.provider_name}</DialogDescription>
          <div className="flex-1 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Sự kiện</TableHead>
                  <TableHead className="w-24">Trạng thái</TableHead>
                  <TableHead>Thông điệp</TableHead>
                  <TableHead className="w-36">Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">Không có nhật ký</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm font-medium">{log.event}</TableCell>
                      <TableCell>
                        <StatusDotBadge
                          label={LOG_STATUS_LABEL[log.status] ?? log.status}
                          badgeClass={LOG_STATUS_CLASS[log.status] ?? 'bg-muted/40 text-muted-foreground border-border'}
                          dotClass={LOG_STATUS_DOT[log.status] ?? 'bg-muted-foreground'}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-64 truncate">
                        {log.message ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tích hợp &quot;{itemToDelete?.provider_name}&quot;? Hành động này không thể hoàn tác.
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
