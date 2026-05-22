import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, governanceService, roleService } from '@/service'
import type {
  ApiResponse,
  GovernanceAdminDashboard,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Users, Building2, AlertTriangle, ShieldCheck, Plus, Activity } from 'lucide-react'
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

function normalizeRoles(data: unknown): { id: number; name: string }[] {
  if (Array.isArray(data)) return data as { id: number; name: string }[]
  if (!data || typeof data !== 'object') return []
  const r = data as Record<string, unknown>
  const candidates = [r.data, r.roles, r.items]
  for (const c of candidates) {
    if (Array.isArray(c)) return c as { id: number; name: string }[]
    if (c && typeof c === 'object') {
      const nested = c as Record<string, unknown>
      for (const key of ['data', 'roles', 'items']) {
        if (Array.isArray(nested[key])) return nested[key] as { id: number; name: string }[]
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
  const trafficItems: any[] = (() => {
    const d = trafficQuery.data?.data
    if (Array.isArray(d)) return d
    if (d && typeof d === 'object') {
      const r = d as Record<string, unknown>
      for (const key of ['data', 'items', 'traffic']) {
        if (Array.isArray(r[key])) return r[key] as any[]
      }
    }
    return []
  })()

  // ─── Permissions ────────────────────────────────────────────────────────────
  const [permSearch, setPermSearch] = useState('')
  const permQuery = useApiQuery(
    ['governance-admin-permissions', permSearch],
    () => governanceService.getPermissions({ search: permSearch || undefined, limit: 50 }),
    { staleTime: STALE_DEFAULT },
    false,
    false
  )
  const permissions = normalizePermissions(permQuery.data?.data)

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
    const list = r.permissions ?? r.items ?? r.data
    if (!Array.isArray(list)) return []
    return (list as GovernancePermission[]).map((p) => p.id)
  })()

  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([])

  function togglePermId(id: number) {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const setRolePermsMutation = useApiMutation(
    (data: { roleId: number; permission_ids: number[] }) =>
      governanceService.setRolePermissions(data.roleId, { permission_ids: data.permission_ids }),
    { onSuccess: () => rolePermsQuery.refetch() },
    true
  )

  return (
    <PageLayout title="Quản trị Admin" description="Tổng quan hệ thống, lưu lượng truy cập và phân quyền">
      <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="dashboard">Tổng quan</TabsTrigger>
          <TabsTrigger value="traffic">Lưu lượng</TabsTrigger>
          <TabsTrigger value="permissions">Quyền hạn</TabsTrigger>
          <TabsTrigger value="role-permissions">Phân quyền theo vai trò</TabsTrigger>
          <TabsTrigger value="enterprise">Doanh nghiệp</TabsTrigger>
        </TabsList>

        {/* ── Tab: Dashboard ── */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
              icon={<Building2 className="size-5" />}
              label="Doanh nghiệp"
              value={dashboard.total_businesses ?? '-'}
              colorClass="text-blue-600"
            />
            <StatCard
              icon={<AlertTriangle className="size-5" />}
              label="Phản ánh chờ xử lý"
              value={dashboard.pending_feedbacks ?? '-'}
              colorClass="text-warning"
            />
            <StatCard
              icon={<ShieldCheck className="size-5" />}
              label="Tổng vai trò"
              value={dashboard.total_roles ?? '-'}
              colorClass="text-purple-600"
            />
          </div>

          {dashboardQuery.isLoading && (
            <p className="text-muted-foreground text-sm">Đang tải tổng quan...</p>
          )}
          {dashboardQuery.isError && (
            <p className="text-destructive text-sm">Không thể tải dữ liệu tổng quan.</p>
          )}
        </TabsContent>

        {/* ── Tab: Traffic ── */}
        <TabsContent value="traffic" className="space-y-4">
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

          <ToolTableCustom
            searchValue=""
            setSearchValue={() => {}}
            dataUpdatedAt={trafficQuery.dataUpdatedAt}
            onRefresh={() => trafficQuery.refetch()}
            isRefreshing={trafficQuery.isFetching && !trafficQuery.isLoading}
            total={trafficItems.length}
          >
            <Table className="relative">
              <TableHeader className="sticky top-0 z-20">
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Lượt truy cập</TableHead>
                  <TableHead className="text-right">Phiên</TableHead>
                  <TableHead className="text-right">Trang xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trafficQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : trafficItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground text-center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  trafficItems.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="typo-table-cell">
                        {item.date ?? item.day ?? item.week ?? item.month ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {item.visitors?.toLocaleString('vi-VN') ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {item.sessions?.toLocaleString('vi-VN') ?? '-'}
                      </TableCell>
                      <TableCell className="typo-table-cell text-right">
                        {item.pageviews?.toLocaleString('vi-VN') ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ToolTableCustom>
        </TabsContent>

        {/* ── Tab: Permissions ── */}
        <TabsContent value="permissions" className="space-y-4">
          <ToolTableCustom
            searchValue={permSearch}
            setSearchValue={setPermSearch}
            dataUpdatedAt={permQuery.dataUpdatedAt}
            onRefresh={() => permQuery.refetch()}
            isRefreshing={permQuery.isFetching && !permQuery.isLoading}
            filter={
              <Button variant="default" onClick={() => { permForm.reset(); setPermDialogOpen(true) }}>
                <Plus className="mr-1 size-4" />
                Thêm quyền
              </Button>
            }
            total={permissions.length}
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
                    <TableCell colSpan={6} className="text-muted-foreground text-center">Đang tải...</TableCell>
                  </TableRow>
                ) : permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground text-center">Không có dữ liệu</TableCell>
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
                      <TableCell className="text-muted-foreground max-w-64 typo-table-cell">
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
                    <Input id="perm-resource" {...permForm.register('resource')} placeholder="vd: spots" />
                    {permForm.formState.errors.resource && (
                      <p className="text-destructive text-sm">{permForm.formState.errors.resource.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="perm-action">
                      Action <span className="text-destructive">*</span>
                    </Label>
                    <Input id="perm-action" {...permForm.register('action')} placeholder="vd: read" />
                    {permForm.formState.errors.action && (
                      <p className="text-destructive text-sm">{permForm.formState.errors.action.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-name-vi">
                    Tên tiếng Việt <span className="text-destructive">*</span>
                  </Label>
                  <Input id="perm-name-vi" {...permForm.register('name_vi')} placeholder="vd: Xem điểm tham quan" />
                  {permForm.formState.errors.name_vi && (
                    <p className="text-destructive text-sm">{permForm.formState.errors.name_vi.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perm-desc">Mô tả</Label>
                  <Textarea id="perm-desc" {...permForm.register('description')} placeholder="Mô tả chi tiết quyền hạn" rows={2} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setPermDialogOpen(false)}>Hủy</Button>
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
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && (
                <>
                  {rolePermsQuery.isLoading ? (
                    <p className="text-muted-foreground text-sm">Đang tải quyền vai trò...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="typo-label text-muted-foreground">
                        Đang gán: {selectedPermIds.length} quyền được chọn (hiện tại: {assignedPermIds.length})
                      </p>
                      <div className="border-border max-h-72 overflow-y-auto rounded-md border">
                        <Table>
                          <TableHeader className="sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-10"></TableHead>
                              <TableHead>Resource</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Tên</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissions.map((perm: GovernancePermission) => (
                              <TableRow
                                key={perm.id}
                                className="cursor-pointer"
                                onClick={() => togglePermId(perm.id)}
                              >
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    readOnly
                                    checked={
                                      selectedPermIds.length > 0
                                        ? selectedPermIds.includes(perm.id)
                                        : assignedPermIds.includes(perm.id)
                                    }
                                    className="accent-primary size-4"
                                  />
                                </TableCell>
                                <TableCell><Badge variant="outline">{perm.resource}</Badge></TableCell>
                                <TableCell><Badge variant="secondary">{perm.action}</Badge></TableCell>
                                <TableCell className="typo-table-cell">{perm.name_vi}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
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
                              permission_ids:
                                selectedPermIds.length > 0 ? selectedPermIds : assignedPermIds,
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
