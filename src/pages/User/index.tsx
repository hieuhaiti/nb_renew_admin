import type { JSX } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useApiQuery, useApiMutation, userService, authService } from '@/service'
import type { ApiResponse, AuthMeData, User, Pagination, UserListData } from '@/types/api'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Lock, Pen, Plus, Trash2 } from 'lucide-react'
import PageLayout from '@/layout/pageLayout'
import { toast } from 'react-toastify'
import UserDetailDialog from './UserDetailDialog'
import UserFormDialog from './UserFormDialog'

export default function User(): JSX.Element {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [searchValue, setSearchValue] = useState<string>('')

  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
  }

  const dbQuery = useApiQuery(
    ['users', queryParams],
    () => userService.getAll(queryParams),
    {},
    false,
    false
  )

  const data = (dbQuery.data as ApiResponse<UserListData>)?.data
  const users = data?.users ?? []
  const pagination = (data?.pagination ?? {}) as Partial<Pagination>
  const lastTotalPagesRef = useRef<number | null>(null)
  if (pagination?.totalPages) lastTotalPagesRef.current = pagination.totalPages
  const totalPages = pagination?.totalPages ?? lastTotalPagesRef.current ?? 1
  const total = pagination?.total ?? 0

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const [userToLock, setUserToLock] = useState<User | null>(null)
  const [lockReason, setLockReason] = useState('')

  const currentUserQuery = useApiQuery(
    ['currentUser'],
    () => authService.getProfile(),
    {},
    false,
    false
  )
  const currentUser = (currentUserQuery.data as ApiResponse<AuthMeData>)?.data?.user ?? null

  const createMutation = useApiMutation(
    (payload: any) => userService.create(payload),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedUserId(null)
      },
    },
    true
  )

  const updateMutation = useApiMutation(
    (payload: { id: string; data: any }) => userService.update(payload.id, payload.data),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setFormDialogOpen(false)
        setSelectedUserId(null)
      },
    },
    true
  )

  const lockMutation = useApiMutation(
    (payload: { id: string; reason: string }) =>
      userService.lock(payload.id, { reason: payload.reason }),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setLockDialogOpen(false)
        setUserToLock(null)
        setLockReason('')
      },
    },
    true
  )

  const deleteMutation = useApiMutation(
    (id: string) => userService.delete(id),
    {
      onSuccess: () => {
        dbQuery.refetch()
        setDeleteDialogOpen(false)
        setUserToDelete(null)
      },
    },
    true
  )

  function openLockDialog(u: User) {
    if (currentUser && u.id === currentUser.id) {
      toast.warning('Bạn không thể khóa tài khoản của mình')
      return
    }
    setLockReason('')
    setUserToLock(u)
    setLockDialogOpen(true)
  }

  function openDeleteDialog(u: User) {
    if (currentUser && u.id === currentUser.id) {
      toast.warning('Bạn không thể xóa tài khoản của bạn')
      return
    }
    setUserToDelete(u)
    setDeleteDialogOpen(true)
  }

  return (
    <PageLayout title="Người dùng" description="Quản lý người dùng hệ thống">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v)
          setCurrentPage(1)
        }}
        filter={
          <div className="flex items-center gap-2">
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

            <Button
              variant="default"
              onClick={() => {
                setSelectedUserId(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-1 size-4" />
              Thêm người dùng
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
              <TableHead className="w-48">ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead className="w-32">Điện thoại</TableHead>
              <TableHead className="w-24">Vai trò</TableHead>
              <TableHead className="w-28 text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              users.map((u: User) => (
                <TableRow
                  className="hover:cursor-pointer"
                  key={u.id}
                  onClick={() => {
                    setSelectedUserId(u.id)
                    setDetailDialogOpen(true)
                  }}
                >
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-xs">{u.id}</span>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.full_name || '-'}</TableCell>
                  <TableCell>{u.phone || '-'}</TableCell>
                  <TableCell>{u.role?.name || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedUserId(u.id)
                          setFormDialogOpen(true)
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pen className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLockDialog(u)
                        }}
                        title="Khóa tài khoản"
                      >
                        <Lock className="text-muted-foreground size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteDialog(u)
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

      <UserDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        userId={selectedUserId}
      />

      <UserFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        userId={selectedUserId}
        onSubmit={(payload) => {
          if (selectedUserId) {
            updateMutation.mutate({ id: selectedUserId, data: payload })
          } else {
            createMutation.mutate(payload)
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Nhập lý do khóa tài khoản &quot;{userToLock?.full_name || userToLock?.email}&quot;:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              placeholder="Lý do khóa tài khoản..."
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                userToLock && lockMutation.mutate({ id: userToLock.id, reason: lockReason })
              }
              disabled={!lockReason.trim() || lockMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {lockMutation.isPending ? 'Đang khóa...' : 'Xác nhận khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng &quot;{userToDelete?.email}&quot;? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
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
