import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { userService, useApiQuery } from '@/service'
import type { ApiResponse, User } from '@/types/api'
import { parseLink } from '@/lib/utils'
import { formatDateTime } from '@/lib/date'

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
}

export default function UserDetailDialog({ open, onOpenChange, userId }: UserDetailDialogProps) {
  const dbQuery = useApiQuery(
    ['user', userId],
    () => userService.getById(userId!),
    { enabled: !!userId && open, staleTime: 0 },
    false,
    false
  )
  const rawData = (dbQuery.data as ApiResponse<User | { user: User }>)?.data
  const user =
    rawData && 'id' in rawData ? (rawData as User) : (rawData as { user?: User })?.user ?? null

  const isLocked = user?.locked_until && new Date(user.locked_until) > new Date() ? true : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogTitle>Chi tiết người dùng</DialogTitle>
        <DialogDescription>Thông tin chi tiết người dùng đã chọn</DialogDescription>

        {user ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">ID:</span>
              <span className="col-span-2 font-mono text-sm">{user.id}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Email:</span>
              <span className="col-span-2">{user.email}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Họ tên:</span>
              <span className="col-span-2">{user.full_name || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Điện thoại:</span>
              <span className="col-span-2">{user.phone || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Avatar:</span>
              <span className="col-span-2">
                {user.avatar_url ? (
                  <img
                    src={parseLink(user.avatar_url)}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full border object-cover"
                  />
                ) : (
                  '-'
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Vai trò:</span>
              <span className="col-span-2">{user.role?.name || `ID: ${user.role_id}` || '-'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Kích hoạt:</span>
              <span className="col-span-2">
                {user.is_active ? (
                  <Badge variant="default">Kích hoạt</Badge>
                ) : (
                  <Badge variant="secondary">Không kích hoạt</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Xác thực:</span>
              <span className="col-span-2">
                {user.is_verified ? (
                  <Badge variant="default">Đã xác thực</Badge>
                ) : (
                  <Badge variant="secondary">Chưa xác thực</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Trạng thái khóa:</span>
              <span className="col-span-2">
                {isLocked ? (
                  <Badge variant="destructive">Đã khóa đến {formatDateTime(user.locked_until!)}</Badge>
                ) : (
                  <Badge variant="outline">Bình thường</Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Đăng nhập lần cuối:</span>
              <span className="col-span-2">
                {user.last_login ? formatDateTime(user.last_login) : '-'}
              </span>
            </div>
            {user.is_deleted && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold">Đã xóa:</span>
                <span className="col-span-2">
                  <Badge variant="destructive">Đã xóa</Badge>
                  {user.deleted_at && (
                    <span className="text-muted-foreground ml-2 text-sm">
                      {formatDateTime(user.deleted_at)}
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Ngày tạo:</span>
              <span className="col-span-2">
                {user.created_at ? formatDateTime(user.created_at) : '-'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold">Cập nhật:</span>
              <span className="col-span-2">
                {user.updated_at ? formatDateTime(user.updated_at) : '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground py-8 text-center">Không có dữ liệu</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
