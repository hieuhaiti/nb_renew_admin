import type { JSX } from 'react'
import { useState } from 'react'
import { useApiQuery, useApiMutation, roleService } from '@/service'
import type { ApiResponse, Role } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '@/lib/date'

const roleSchema = z.object({
  name: z.string().min(2, 'Tên vai trò tối thiểu 2 ký tự').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
})
type RoleFormValues = z.infer<typeof roleSchema>

export default function RolePage(): JSX.Element {
  const [searchValue, setSearchValue] = useState('')

  const dbQuery = useApiQuery(['roles'], () => roleService.getAll(), {}, false, false)
  const roles = (dbQuery.data as ApiResponse<Role[]>)?.data ?? []
  const filtered = searchValue
    ? roles.filter(
        (r: Role) =>
          r.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchValue.toLowerCase())
      )
    : roles

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const createMutation = useApiMutation(
    (data: { name: string; description?: string }) => roleService.create(data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setEditRole(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: number; data: { name: string; description?: string } }) =>
      roleService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setEditRole(null)
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: number) => roleService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setRoleToDelete(null)
      },
    },
    true
  )

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema) as any,
    defaultValues: { name: '', description: '' },
  })

  function openAdd() {
    setEditRole(null)
    reset({ name: '', description: '' })
    setFormDialogOpen(true)
  }

  function openEdit(role: Role) {
    setEditRole(role)
    reset({ name: role.name, description: role.description || '' })
    setFormDialogOpen(true)
  }

  const handleFormSubmit: SubmitHandler<RoleFormValues> = (data) => {
    const payload = { name: data.name, ...(data.description?.trim() && { description: data.description }) }
    if (editRole) {
      updateMutation.mutate({ id: editRole.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <PageLayout title="Vai trò & phân quyền" description="Quản lý vai trò người dùng">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        filter={
          <Button variant="default" onClick={openAdd}>
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
                    {role.is_system ? (
                      <Badge variant="outline">Hệ thống</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {role.created_at ? formatDate(role.created_at) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(role)}
                        title="Chỉnh sửa"
                        disabled={role.is_system}
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRoleToDelete(role)
                          setDeleteDialogOpen(true)
                        }}
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

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>{editRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}</DialogTitle>
          <DialogDescription>
            {editRole ? 'Cập nhật thông tin vai trò' : 'Tạo vai trò người dùng mới'}
          </DialogDescription>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Tên vai trò <span className="text-destructive">*</span>
              </Label>
              <Input id="role-name" {...register('name')} placeholder="VD: Editor, Moderator..." />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Mô tả</Label>
              <Textarea id="role-desc" {...register('description')} placeholder="Mô tả quyền hạn của vai trò" rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormDialogOpen(false)} disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isSubmitting || createMutation.isPending || updateMutation.isPending ? 'Đang xử lý...' : editRole ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
