import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, roleService } from '@/service'
import type { Role } from '@/types/api'
import { Button } from '@/components/ui/button'
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
import { Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { formatDate } from '@/lib/date'
import { STALE_REF } from '@/constant/queryConstant'
import RoleFormDialog from './RoleFormDialog'

function normalizeRoleItem(item: unknown): Role | null {
  if (!item || typeof item !== 'object') return null

  const record = item as Record<string, unknown>
  const nameVi = typeof record.name_vi === 'string' ? record.name_vi : ''
  const nameEn = typeof record.name_en === 'string' ? record.name_en : ''
  const name =
    typeof record.name === 'string' && record.name.trim()
      ? record.name
      : nameVi || nameEn || (typeof record.code === 'string' ? record.code : '')

  const id = typeof record.id === 'number' ? record.id : Number(record.id)
  if (!Number.isFinite(id)) return null

  return {
    ...(record as Role),
    id,
    name,
    description:
      typeof record.description === 'string'
        ? record.description
        : record.description == null
          ? null
          : String(record.description),
  }
}

function normalizeRoles(data: unknown): Role[] {
  const toList = (items: unknown[]): Role[] =>
    items.map(normalizeRoleItem).filter((r): r is Role => r !== null)

  if (Array.isArray(data)) return toList(data)
  if (!data || typeof data !== 'object') return []

  const record = data as Record<string, unknown>
  for (const key of ['data', 'roles', 'items']) {
    const val = record[key]
    if (Array.isArray(val)) return toList(val)
    if (val && typeof val === 'object') {
      const nested = val as Record<string, unknown>
      for (const nkey of ['data', 'roles', 'items']) {
        if (Array.isArray(nested[nkey])) return toList(nested[nkey] as unknown[])
      }
    }
  }
  return []
}

export default function RolePage(): JSX.Element {
  const [searchValue, setSearchValue] = useState('')

  const dbQuery = useApiQuery(['roles'], () => roleService.getAll(), { staleTime: STALE_REF }, false, false)
  const roles = normalizeRoles(dbQuery.data)
  const filtered = searchValue
    ? roles.filter(
        (r: Role) =>
          r.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : roles

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const createMutation = useApiMutation(
    (data: { name: string; description?: string }) => roleService.create(data),
    {
      onSuccess: () => { dbQuery.refetch(); setFormDialogOpen(false); setSelectedRole(null) },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: { name: string; description?: string } }) =>
      roleService.update(payload.id, payload.data),
    {
      onSuccess: () => { dbQuery.refetch(); setFormDialogOpen(false); setSelectedRole(null) },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => roleService.delete(id),
    {
      onSuccess: () => { dbQuery.refetch(); setDeleteDialogOpen(false); setRoleToDelete(null) },
    },
    true
  )

  return (
    <PageLayout title="Vai trò & phân quyền" description="Quản lý vai trò người dùng">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        dataUpdatedAt={dbQuery.dataUpdatedAt}
        onRefresh={() => dbQuery.refetch()}
        isRefreshing={dbQuery.isFetching && !dbQuery.isLoading}
        filter={
          <Button variant="default" onClick={() => { setSelectedRole(null); setFormDialogOpen(true) }}>
            <Plus className="mr-1 size-4" />
            Thêm vai trò
          </Button>
        }
        total={filtered.length}
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 z-20">
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Tên vai trò</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead className="w-24">Hệ thống</TableHead>
              <TableHead className="w-32">Ngày tạo</TableHead>
              <TableHead className="w-24 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((role: Role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.id}</TableCell>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-64">
                    <span className="line-clamp-1">{role.description || '-'}</span>
                  </TableCell>
                  <TableCell>
                    {role.is_system
                      ? <Badge variant="outline">Hệ thống</Badge>
                      : <span className="text-muted-foreground text-sm">-</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {role.created_at ? formatDate(role.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedRole(role); setFormDialogOpen(true) }}
                        title="Chỉnh sửa"
                        disabled={role.is_system}
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setRoleToDelete(role); setDeleteDialogOpen(true) }}
                        title="Xóa"
                        disabled={role.is_system}
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

      <RoleFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        role={selectedRole}
        onSubmit={(payload) => {
          if (selectedRole) {
            updateMutation.mutate({ id: selectedRole.id, data: payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa vai trò &quot;{roleToDelete?.name}&quot;? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => roleToDelete && deleteMutation.mutate(roleToDelete.id)}
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
