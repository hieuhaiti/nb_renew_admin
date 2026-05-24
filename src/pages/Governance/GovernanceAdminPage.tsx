import type { JSX } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useApiQuery, useApiMutation, governanceService, roleService } from '@/service'
import type {
  ApiResponse,
  GovernanceAdminDashboard,
  GovernanceTrafficData,
  GovernancePermission,
  GovernancePermissionCreateBody,
} from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import ToolTableCustom from '@/components/features/ToolTableCustom'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Users,
  FileText,
  ShieldCheck,
  Plus,
  Activity,
  Utensils,
  PartyPopper,
  Package,
  BookOpen,
  Eye,
  TrendingUp,
  MapPin,
  Layers,
  Globe,
} from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import BusinessEnterpriseView from './BusinessEnterpriseView'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/date'
import { STALE_DEFAULT, STALE_REF } from '@/constant/queryConstant'

const permissionSchema = z.object({
  resource: z.string().min(1, 'Bắt buộc'),
  action: z.string().min(1, 'Bắt buộc'),
  name_vi: z.string().min(2, 'Tối thiểu 2 ký tự').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
})
type PermissionFormValues = z.infer<typeof permissionSchema>

function StatCard({
  icon,
  label,
  value,
  colorClass = 'text-primary',
}: {
  icon: JSX.Element
  label: string
  value: string | number
  colorClass?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`bg-muted rounded-full p-3 ${colorClass}`}>{icon}</div>
        <div>
          <p className="typo-label text-muted-foreground">{label}</p>
          <p className="typo-table-cell text-2xl font-bold">{value ?? '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function normalizePermissions(data: unknown): GovernancePermission[] {
  if (!data || typeof data !== 'object') return []
  const r = data as Record<string, unknown>
  const candidates = [r.data, r.permissions, r.items]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as GovernancePermission[]
    if (c && typeof c === 'object') {
      const nested = c as Record<string, unknown>
      for (const key of ['data', 'permissions', 'items']) {
        if (Array.isArray(nested[key])) return nested[key] as GovernancePermission[]
      }
    }
  }
  return []
}

function normalizeRoles(data: unknown): { id: number; name_vi: string; code: string }[] {
  if (Array.isArray(data)) return data as { id: number; name_vi: string; code: string }[]
  if (!data || typeof data !== 'object') return []
  const r = data as Record<string, unknown>
  const candidates = [r.data, r.roles, r.items]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as { id: number; name_vi: string; code: string }[]
    if (c && typeof c === 'object') {
      const nested = c as Record<string, unknown>
      for (const key of ['data', 'roles', 'items']) {
        if (Array.isArray(nested[key]))
          return nested[key] as { id: number; name_vi: string; code: string }[]
      }
    }
  }
  return []
}

export default function GovernanceAdminPage(): JSX.Element {
  // ─── Dashboard ──────────────────────────────────────────────────────────────
  const dashboardQuery = useApiQuery<ApiResponse<GovernanceAdminDashboard>>(
    ['governance-admin-dashboard'],
    () => governanceService.getDashboard(),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const dashboard = (dashboardQuery.data?.data ?? {}) as GovernanceAdminDashboard

  // ─── Traffic ────────────────────────────────────────────────────────────────
  const [trafficDays, setTrafficDays] = useState('30')
  const trafficQuery = useApiQuery(
    ['governance-admin-traffic', trafficDays],
    () => governanceService.getTraffic({ days: Number(trafficDays), group_by: 'day' }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const trafficData: GovernanceTrafficData = (() => {
    const d = trafficQuery.data?.data as Record<string, unknown> | undefined
    return {
      time_series: Array.isArray(d?.time_series)
        ? (d!.time_series as Record<string, unknown>[])
        : [],
      top_sources: Array.isArray(d?.top_sources)
        ? (d!.top_sources as Record<string, unknown>[])
        : [],
      top_actions: Array.isArray(d?.top_actions)
        ? (d!.top_actions as GovernanceTrafficData['top_actions'])
        : [],
    }
  })()

  // ─── Permissions ────────────────────────────────────────────────────────────
  const PERM_LIMIT = 50
  const [permSearch, setPermSearch] = useState('')
  const [permPage, setPermPage] = useState(1)
  const permQuery = useApiQuery(
    ['governance-admin-permissions', permSearch, permPage],
    () =>
      governanceService.getPermissions({
        search: permSearch || undefined,
        limit: PERM_LIMIT,
        page: permPage,
      }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const permPagination = (permQuery.data?.data as Record<string, unknown> | undefined)
    ?.pagination as { total: number; totalPages: number; page: number } | undefined
  const permissions = normalizePermissions(permQuery.data?.data)

  // Fetch all permissions (no search, high limit) for role-permission assignment checkboxes
  const allPermsQuery = useApiQuery(
    ['governance-admin-permissions-all'],
    () => governanceService.getPermissions({ limit: 100 }),
    { staleTime: STALE_REF },
    false,
    false
  )
  const allPermissions = normalizePermissions(allPermsQuery.data?.data)

  function handlePermSearchChange(value: string) {
    setPermSearch(value)
    setPermPage(1)
  }

  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const createPermMutation = useApiMutation(
    (data: GovernancePermissionCreateBody) => governanceService.createPermission(data),
    {
      onSuccess: () => {
        permQuery.refetch()
        setPermDialogOpen(false)
        permForm.reset()
      },
    },
    true
  )
  const permForm = useForm<PermissionFormValues>({
    resolver: zodResolver(permissionSchema) as any,
    defaultValues: { resource: '', action: '', name_vi: '', description: '' },
  })
  const handlePermSubmit: SubmitHandler<PermissionFormValues> = (data) => {
    createPermMutation.mutate({
      resource: data.resource,
      action: data.action,
      name_vi: data.name_vi,
      ...(data.description?.trim() && { description: data.description }),
    })
  }

  // ─── Role permissions ───────────────────────────────────────────────────────
  const rolesQuery = useApiQuery(
    ['roles-for-governance'],
    () => roleService.getAll(),
    { staleTime: STALE_REF },
    false,
    false
  )
  const roles = normalizeRoles(rolesQuery.data)

  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const rolePermsQuery = useApiQuery(
    ['governance-role-perms', selectedRoleId],
    () => governanceService.getRolePermissions(Number(selectedRoleId)),
    { staleTime: STALE_DEFAULT, enabled: !!selectedRoleId },
    false,
    false
  )
  const assignedPermIds: number[] = (() => {
    const d = rolePermsQuery.data?.data
    if (!d || typeof d !== 'object') return []
    const r = d as Record<string, unknown>
    const list = r.items ?? r.permissions ?? r.data
    if (!Array.isArray(list)) return []
    return (list as Array<{ permission_id?: number; id?: number }>)
      .map((p) => p.permission_id ?? p.id ?? 0)
      .filter(Boolean) as number[]
  })()

  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])

  useEffect(() => {
    if (rolePermsQuery.dataUpdatedAt) {
      setSelectedPermIds(assignedPermIds)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolePermsQuery.dataUpdatedAt])

  const permsByResource = useMemo(() => {
    const map = new Map<string, GovernancePermission[]>()
    for (const p of allPermissions) {
      const group = map.get(p.resource) ?? []
      group.push(p)
      map.set(p.resource, group)
    }
    return map
  }, [allPermissions])

  function togglePermId(id: number) {
    setSelectedPermIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleResourceGroup(perms: GovernancePermission[], allChecked: boolean) {
    const ids = perms.map((p) => p.id)
    setSelectedPermIds((prev) =>
      allChecked ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])]
    )
  }

  const setRolePermsMutation = useApiMutation(
    (data: { roleId: number; permission_ids: number[] }) =>
      governanceService.setRolePermissions(data.roleId, { permission_ids: data.permission_ids }),
    { onSuccess: () => rolePermsQuery.refetch() },
    true
  )

  return (
    <PageLayout
      title="Quản trị Admin"
      description="Tổng quan hệ thống, lưu lượng truy cập và phân quyền"
    >
      <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
          <TabsTrigger value="traffic">Lưu lượng</TabsTrigger>
          <TabsTrigger value="permissions">Quyền hạn</TabsTrigger>
          <TabsTrigger value="role-permissions">Phân quyền theo vai trò</TabsTrigger>
          <TabsTrigger value="enterprise">Doanh nghiệp</TabsTrigger>
        </TabsList>

        {/* ── Tab: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardQuery.isLoading && (
            <p className="text-muted-foreground text-sm">Đang tải tổng quan...</p>
          )}
          {dashboardQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu tổng quan.</p>
          )}

          <div className="space-y-2">
            <p className="typo-label text-muted-foreground px-1">Người dùng</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={<Users className="size-5" />}
                label="Tổng người dùng"
                value={dashboard.total_users ?? '-'}
              />
              <StatCard
                icon={<Activity className="size-5" />}
                label="Đang hoạt động"
                value={dashboard.active_users ?? '-'}
                colorClass="text-success"
              />
              <StatCard
                icon={<ShieldCheck className="size-5" />}
                label="Tổng quyền hạn"
                value={dashboard.total_permissions ?? '-'}
                colorClass="text-purple-600"
              />
              <StatCard
                icon={<BookOpen className="size-5" />}
                label="Audit logs (kỳ)"
                value={dashboard.audit_logs_in_range ?? '-'}
                colorClass="text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="typo-label text-muted-foreground px-1">Nội dung</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={<FileText className="size-5" />}
                label="Tin tức"
                value={dashboard.total_news ?? '-'}
                colorClass="text-blue-600"
              />
              <StatCard
                icon={<Utensils className="size-5" />}
                label="Ẩm thực"
                value={dashboard.total_cuisine_items ?? '-'}
                colorClass="text-orange-500"
              />
              <StatCard
                icon={<PartyPopper className="size-5" />}
                label="Lễ hội"
                value={dashboard.total_festivals ?? '-'}
                colorClass="text-pink-600"
              />
              <StatCard
                icon={<Package className="size-5" />}
                label="Sản phẩm OCOP"
                value={dashboard.total_ocop_products ?? '-'}
                colorClass="text-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="typo-label text-muted-foreground px-1">Bản đồ</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={<MapPin className="size-5" />}
                label="Danh mục bản đồ"
                value={dashboard.total_map_categories ?? '-'}
                colorClass="text-cyan-600"
              />
              <StatCard
                icon={<Layers className="size-5" />}
                label="Lớp bản đồ"
                value={dashboard.total_map_layers ?? '-'}
                colorClass="text-cyan-600"
              />
              <StatCard
                icon={<Globe className="size-5" />}
                label="API bản đồ"
                value={dashboard.total_map_apis ?? '-'}
                colorClass="text-cyan-600"
              />
              <StatCard
                icon={<Eye className="size-5" />}
                label="Lượt truy cập (kỳ)"
                value={dashboard.visits_in_range ?? '-'}
                colorClass="text-indigo-500"
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Traffic ── */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Số ngày</Label>
              <Select value={trafficDays} onValueChange={setTrafficDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="14">14 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="60">60 ngày</SelectItem>
                  <SelectItem value="90">90 ngày</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => trafficQuery.refetch()}
              disabled={trafficQuery.isFetching}
            >
              {trafficQuery.isFetching ? 'Đang tải...' : 'Làm mới'}
            </Button>
          </div>

          {trafficQuery.isLoading ? (
            <p className="text-muted-foreground text-sm">Đang tải dữ liệu...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Top Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" />
                    Top hành động
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {trafficData.top_actions.length === 0 ? (
                    <p className="text-muted-foreground px-6 pb-4 text-sm">Không có dữ liệu</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Hành động</TableHead>
                          <TableHead className="text-right">Lượt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trafficData.top_actions.map((item, idx) => {
                          const [resource, action] = item.action.split('.')
                          return (
                            <TableRow key={item.action}>
                              <TableCell className="text-muted-foreground typo-table-cell w-8">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="typo-table-cell">
                                <span className="flex items-center gap-2">
                                  <Badge variant="outline">{resource}</Badge>
                                  <Badge variant="secondary">{action}</Badge>
                                </span>
                              </TableCell>
                              <TableCell className="typo-table-cell text-right font-medium">
                                {Number(item.count).toLocaleString('vi-VN')}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Top Sources */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="size-4" />
                    Top nguồn truy cập
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {trafficData.top_sources.length === 0 ? (
                    <p className="text-muted-foreground px-6 pb-4 text-sm">Không có dữ liệu</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nguồn</TableHead>
                          <TableHead className="text-right">Lượt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trafficData.top_sources.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="typo-table-cell">
                              {String(item.source ?? item.name ?? '-')}
                            </TableCell>
                            <TableCell className="typo-table-cell text-right font-medium">
                              {Number(item.count ?? item.visits ?? 0).toLocaleString('vi-VN')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Time Series */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="size-4" />
                    Chuỗi thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {trafficData.time_series.length === 0 ? (
                    <p className="text-muted-foreground px-6 pb-4 text-sm">Không có dữ liệu</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead className="text-right">Lượt truy cập</TableHead>
                          <TableHead className="text-right">Phiên</TableHead>
                          <TableHead className="text-right">Trang xem</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trafficData.time_series.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="typo-table-cell">
                              {String(item.date ?? item.day ?? item.week ?? item.month ?? '-')}
                            </TableCell>
                            <TableCell className="typo-table-cell text-right">
                              {item.visitors != null
                                ? Number(item.visitors).toLocaleString('vi-VN')
                                : '-'}
                            </TableCell>
                            <TableCell className="typo-table-cell text-right">
                              {item.sessions != null
                                ? Number(item.sessions).toLocaleString('vi-VN')
                                : '-'}
                            </TableCell>
                            <TableCell className="typo-table-cell text-right">
                              {item.pageviews != null
                                ? Number(item.pageviews).toLocaleString('vi-VN')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Permissions ── */}
        <TabsContent value="permissions" className="space-y-4">
          <ToolTableCustom
            searchValue={permSearch}
            setSearchValue={handlePermSearchChange}
            dataUpdatedAt={permQuery.dataUpdatedAt}
            onRefresh={() => permQuery.refetch()}
            isRefreshing={permQuery.isFetching && !permQuery.isLoading}
            filter={
              <Button
                variant="default"
                onClick={() => {
                  permForm.reset()
                  setPermDialogOpen(true)
                }}
              >
                <Plus className="mr-1 size-4" />
                Thêm quyền
              </Button>
            }
            total={permPagination?.total ?? permissions.length}
            pagination={
              permPagination && permPagination.totalPages > 1
                ? {
                    currentPage: permPage,
                    totalPages: permPagination.totalPages,
                    onPageChange: setPermPage,
                  }
                : undefined
            }
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Tên (VI)</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="w-32">Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((perm: GovernancePermission) => (
                    <TableRow key={perm.id}>
                      <TableCell className="typo-table-cell">{perm.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{perm.resource}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{perm.action}</Badge>
                      </TableCell>
                      <TableCell className="typo-table-cell font-medium">{perm.name_vi}</TableCell>
                      <TableCell className="text-muted-foreground typo-table-cell max-w-64">
                        <span className="line-clamp-1">{perm.description || '-'}</span>
                      </TableCell>
                      <TableCell className="typo-table-cell">
                        {perm.created_at ? formatDate(perm.created_at) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>

          <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogTitle>Thêm quyền mới</DialogTitle>
              <DialogDescription>Tạo quyền hạn mới cho hệ thống</DialogDescription>
              <form onSubmit={permForm.handleSubmit(handlePermSubmit)} className="mt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="perm-resource">
                      Resource <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="perm-resource"
                      {...permForm.register('resource')}
                      placeholder="vd: spots"
                    />
                    {permForm.formState.errors.resource && (
                      <p className="text-destructive text-sm">
                        {permForm.formState.errors.resource.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-action">
                      Action <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="perm-action"
                      {...permForm.register('action')}
                      placeholder="vd: read"
                    />
                    {permForm.formState.errors.action && (
                      <p className="text-destructive text-sm">
                        {permForm.formState.errors.action.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-name-vi">
                    Tên tiếng Việt <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="perm-name-vi"
                    {...permForm.register('name_vi')}
                    placeholder="vd: Xem điểm tham quan"
                  />
                  {permForm.formState.errors.name_vi && (
                    <p className="text-destructive text-sm">
                      {permForm.formState.errors.name_vi.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-desc">Mô tả</Label>
                  <Textarea
                    id="perm-desc"
                    {...permForm.register('description')}
                    placeholder="Mô tả chi tiết quyền hạn"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPermDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button type="submit" disabled={createPermMutation.isPending}>
                    {createPermMutation.isPending ? 'Đang tạo...' : 'Tạo mới'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Tab: Role Permissions ── */}
        <TabsContent value="role-permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="typo-section-title">Gán quyền theo vai trò</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Label className="shrink-0">Chọn vai trò</Label>
                <Select
                  value={selectedRoleId}
                  onValueChange={(v) => {
                    setSelectedRoleId(v)
                    setSelectedPermIds([])
                  }}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="-- Chọn vai trò --" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name_vi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && (
                <>
                  {rolePermsQuery.isLoading || allPermsQuery.isLoading ? (
                    <p className="text-muted-foreground text-sm">Đang tải quyền vai trò...</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="typo-label text-muted-foreground">
                          Đã chọn{' '}
                          <span className="text-foreground font-medium">
                            {selectedPermIds.length}
                          </span>{' '}
                          / {allPermissions.length} quyền
                          {assignedPermIds.length > 0 && (
                            <span className="ml-2 opacity-60">
                              (đang gán: {assignedPermIds.length})
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPermIds(allPermissions.map((p) => p.id))}
                          >
                            Chọn tất cả
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedPermIds([])}>
                            Bỏ chọn tất cả
                          </Button>
                        </div>
                      </div>

                      <div className="border-border max-h-96 overflow-y-auto rounded-md border">
                        <Table>
                          <TableBody>
                            {Array.from(permsByResource.entries()).map(([resource, perms]) => {
                              const allChecked = perms.every((p) => selectedPermIds.includes(p.id))
                              const someChecked = perms.some((p) => selectedPermIds.includes(p.id))
                              return (
                                <>
                                  <TableRow
                                    key={`group-${resource}`}
                                    className="bg-muted/40 hover:bg-muted/60 cursor-pointer"
                                    onClick={() => toggleResourceGroup(perms, allChecked)}
                                  >
                                    <TableCell className="w-10">
                                      <input
                                        type="checkbox"
                                        readOnly
                                        checked={allChecked}
                                        ref={(el) => {
                                          if (el) el.indeterminate = !allChecked && someChecked
                                        }}
                                        className="accent-primary size-4"
                                      />
                                    </TableCell>
                                    <TableCell colSpan={3}>
                                      <span className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono">
                                          {resource}
                                        </Badge>
                                        <span className="text-muted-foreground text-xs">
                                          {perms.length} quyền
                                        </span>
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                  {perms.map((perm) => (
                                    <TableRow
                                      key={perm.id}
                                      className="cursor-pointer"
                                      onClick={() => togglePermId(perm.id)}
                                    >
                                      <TableCell className="w-10">
                                        <input
                                          type="checkbox"
                                          readOnly
                                          checked={selectedPermIds.includes(perm.id)}
                                          className="accent-primary size-4"
                                        />
                                      </TableCell>
                                      <TableCell className="w-32 pl-6">
                                        <Badge variant="secondary">{perm.action}</Badge>
                                      </TableCell>
                                      <TableCell colSpan={2} className="typo-table-cell">
                                        {perm.name_vi}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedPermIds(assignedPermIds)}
                        >
                          Đặt lại
                        </Button>
                        <Button
                          onClick={() =>
                            setRolePermsMutation.mutate({
                              roleId: Number(selectedRoleId),
                              permission_ids: selectedPermIds,
                            })
                          }
                          disabled={setRolePermsMutation.isPending}
                        >
                          {setRolePermsMutation.isPending ? 'Đang lưu...' : 'Lưu phân quyền'}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Doanh nghiệp ── */}
        <TabsContent value="enterprise">
          <BusinessEnterpriseView />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
