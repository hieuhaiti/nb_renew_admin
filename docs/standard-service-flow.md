# Standard Service Flow — Admin Portal

> Source of truth: `DuLichNinhBinh API.postman_collection.json` (base URL `http://localhost:5000/api/v1`)
>
> Pattern reference: `src/pages/User/` + `src/service/userService.ts` + `src/components/layout/UserMenu.tsx`

---

## A. Cấu trúc flow chuẩn

Thứ tự xây dựng một module mới từ API đến UI:

```
Postman Collection  →  Service layer  →  Type/interface  →  React Query (useApiQuery/useApiMutation)
      →  Page/Table list  →  Form/Dialog create/update  →  Action delete/toggle/status
      →  Loading / Error / Empty state  →  Toast notification
```

### 1. API source of truth

Trước khi viết bất kỳ dòng code nào, mở `DuLichNinhBinh API.postman_collection.json` và xác định:

- Method + path đầy đủ (ví dụ: `GET /api/v1/users`)
- Query parameters được hỗ trợ
- Request body structure (JSON hay formdata?)
- Response shape (xem Postman example response nếu có)

**Không tự bịa endpoint.** Nếu chưa có trong Postman → ghi `// TODO: confirm endpoint with backend` và để placeholder.

### 2. Service layer

Đặt file tại `src/service/<domain>Service.ts`. Cấu trúc chuẩn:

```ts
import apiClient from './common/apiClient'
import type { ApiResponse, MyEntity, MyEntityListData, MyListParams } from '@/types/api'
import { serviceMyEntityPath } from '@/constant/serviceConstant'

export default {
  /** GET /my-entity */
  getAll: (params?: MyListParams) =>
    apiClient.get<ApiResponse<MyEntityListData>>(serviceMyEntityPath, params),

  /** GET /my-entity/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<MyEntity>>(`${serviceMyEntityPath}/${id}`),

  /** POST /my-entity */
  create: (data: MyEntityCreateBody) =>
    apiClient.post<ApiResponse<MyEntity>>(serviceMyEntityPath, data),

  /** PUT /my-entity/:id */
  update: (id: string, data: MyEntityUpdateBody) =>
    apiClient.put<ApiResponse<MyEntity>>(`${serviceMyEntityPath}/${id}`, data),

  /** DELETE /my-entity/:id */
  delete: (id: string) =>
    apiClient.del<ApiResponse<{}>>(  `${serviceMyEntityPath}/${id}`),

  // Thêm các action đặc biệt nếu Postman có:
  // lock, unlock, publish, approve, reject, assignRole, ...
}
```

**Quy tắc bắt buộc:**

- Path constant phải khai báo trong `src/constant/serviceConstant.ts` (không hardcode string `/users` trong service)
- Mỗi method có JSDoc comment ghi rõ `/** METHOD /path */`
- Export `default { ... }` — không export named functions riêng lẻ
- Sau khi viết, export service qua `src/service/index.ts`

### 3. Type / Schema

Đặt type tại `src/types/api/<domain>.ts`. Ví dụ với User:

```ts
export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role_id: number
  role?: Role
  is_active: boolean
  is_verified: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UserListData {
  users: User[]
  pagination: Pagination
}

export interface UserListParams extends PaginationParams {
  search?: string
  role_id?: number
  is_active?: boolean
}

export type UserCreateBody = {
  email: string
  password: string
  full_name?: string
  phone?: string
  role_id: number
  is_active?: boolean
  is_verified?: boolean
}

export type UserUpdateBody = Partial<Omit<UserCreateBody, 'password'>> & {
  password?: string
}
```

**Quy tắc:**
- Field names phải khớp với response JSON từ backend (thường là `snake_case`)
- Dùng `| null` cho optional nullable fields, không dùng `?` khi backend luôn trả field đó
- Body type cho create/update phải khớp với Postman request body — snake_case field names

### 4. React Query — useApiQuery / useApiMutation

Dùng helper `useApiQuery` và `useApiMutation` từ `src/service` (wrap TanStack Query):

```ts
// List
const dbQuery = useApiQuery(
  ['entity', queryParams],
  () => entityService.getAll(queryParams),
  {},
  false,
  false
)

// Create
const createMutation = useApiMutation(
  (payload: EntityCreateBody) => entityService.create(payload),
  {
    onSuccess: () => {
      dbQuery.refetch()
      setFormDialogOpen(false)
    },
  },
  true  // showToast = true
)
```

**Quy tắc:**
- Query key phải include queryParams để cache invalidate khi filter/page thay đổi
- `staleTime: 0` cho data hay thay đổi (user, business, ...)
- `staleTime: 5 * 60 * 1000` cho reference data ít thay đổi (roles, categories, ...)
- Mutations luôn pass `true` cho `showToast` để tự động hiển thị thông báo
- Luôn gọi `refetch()` sau create/update/delete thành công

### 5. Page / Table list

Cấu trúc page danh sách (`src/pages/<Domain>/index.tsx`):

```tsx
export default function EntityPage(): JSX.Element {
  // 1. Filter state
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchValue, setSearchValue] = useState('')
  // ...other filters from Postman

  // 2. Query params — chỉ include params Postman có hỗ trợ
  const queryParams = {
    page: currentPage,
    limit,
    sortBy: 'created_at',
    sortOrder: 'DESC' as const,
    ...(searchValue && { search: searchValue }),
    // ...conditional other filters
  }

  // 3. Data fetch
  const dbQuery = useApiQuery(['entity', queryParams], () => entityService.getAll(queryParams), {})

  // 4. Dialog state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  // ...

  // 5. Mutations
  const createMutation = ...
  const updateMutation = ...
  const deleteMutation = ...

  return (
    <PageLayout title="..." description="...">
      <ToolTableCustom
        searchValue={searchValue}
        setSearchValue={(v) => { setSearchValue(v); setCurrentPage(1) }}
        filter={/* filters + limit selector + action button */}
        total={total}
        pagination={{ currentPage, totalPages, onPageChange: setCurrentPage }}
      >
        <Table>
          {/* Loading state */}
          {/* Empty state */}
          {/* Data rows */}
        </Table>
      </ToolTableCustom>

      {/* Dialogs */}
    </PageLayout>
  )
}
```

**Loading / Empty / Error state:**

```tsx
{dbQuery.isLoading ? (
  <TableRow>
    <TableCell colSpan={N} className="text-center py-8 text-muted-foreground">
      Đang tải...
    </TableCell>
  </TableRow>
) : dbQuery.isError ? (
  <TableRow>
    <TableCell colSpan={N} className="text-center py-8 text-destructive">
      Đã xảy ra lỗi, vui lòng thử lại
    </TableCell>
  </TableRow>
) : items.length === 0 ? (
  <TableRow>
    <TableCell colSpan={N} className="text-muted-foreground text-center">
      Không có dữ liệu
    </TableCell>
  </TableRow>
) : (
  items.map((item) => <TableRow key={item.id}>...</TableRow>)
)}
```

### 6. Form / Dialog create + update

```tsx
// Schema riêng cho create vs update
const createSchema = z.object({ ... })
const updateSchema = createSchema.extend({ password: z.string().optional() })

export default function EntityFormDialog({ open, onOpenChange, entityId, onSubmit }) {
  const isEdit = !!entityId

  // Fetch existing entity để prefill (chỉ khi edit)
  const dbQuery = useApiQuery(
    ['entity', entityId],
    () => entityService.getById(entityId!),
    { enabled: !!entityId && open, staleTime: 0 },
    false, false
  )

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(isEdit ? updateSchema : createSchema),
    })

  // Reset form khi data hoặc open thay đổi
  useEffect(() => {
    if (entity) reset({ ...entityToFormValues(entity) })
    else reset(defaultValues)
  }, [entity, reset, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>...</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          {/* Fields */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 7. Action delete / toggle / status

Dùng `AlertDialog` cho mọi action destructive:

```tsx
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
      <AlertDialogDescription>
        Bạn có chắc chắn muốn xóa "{itemToDelete?.name}"? Hành động này không thể hoàn tác.
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
```

### 8. Toast / Notification

Dùng `react-toastify` via `toast` import:

```ts
import { toast } from 'react-toastify'

toast.success('Tạo thành công')
toast.error('Đã xảy ra lỗi')
toast.warning('Bạn không thể thực hiện thao tác này')
```

Mutations với `showToast = true` tự động hiển thị toast từ apiClient. Dùng `toast.warning()` thủ công cho validation/guard logic trong component.

### 9. Status Badge

Dùng `StatusDotBadge` cho boolean/enum fields trong table. Không render plain text:

```tsx
<StatusDotBadge
  label={ENTITY_STATUS_LABEL[item.status] ?? item.status}
  badgeClass={ENTITY_STATUS_CLASS[item.status] ?? 'bg-muted text-muted-foreground border-border'}
  dotClass={ENTITY_STATUS_DOT[item.status] ?? 'bg-muted-foreground'}
/>
```

---

## B. Quy ước service

### Quy tắc bắt buộc

1. **Không hardcode endpoint string trong service** — dùng constant từ `serviceConstant.ts`
2. **Tách function rõ ràng**: `getAll`, `getById`, `create`, `update`, `delete`, thêm action đặc biệt nếu API có
3. **Method + path + body + query phải khớp chính xác Postman Collection**
4. **Field names trong request body phải dùng snake_case** (theo backend convention) — không camelCase
5. **Không giữ service function không còn trong Postman** — xóa hoặc đánh dấu `// DEPRECATED` nếu có code phụ thuộc
6. **Response format**: giữ đúng `ApiResponse<T>` wrapper hiện tại của dự án

### Field naming chuẩn (quan trọng)

Backend API sử dụng **snake_case** cho tất cả field names. Service/type phải phản ánh đúng:

```ts
// Đúng
{ current_password: string, new_password: string, confirm_password: string }
{ refresh_token: string }
{ role_id: number, is_active: boolean }

// Sai
{ currentPassword: string, newPassword: string }
{ refreshToken: string }
```

### Lỗi đã phát hiện trong authService hiện tại (cần sửa)

| Method | Vấn đề | Sửa thành |
|---|---|---|
| `refreshToken()` | body gửi `{ refreshToken }` (camelCase) | `{ refresh_token }` |
| `changePassword()` | body gửi `currentPassword`, `newPassword`, `confirmPassword` | `current_password`, `new_password`, `confirm_password` |
| `logout()` | body gửi `{ refreshToken? }` | `{ refresh_token? }` |
| `updateProfile()` | body gửi JSON — Postman dùng **formdata** với file upload cho `avatar` | Xem xét chuyển sang formdata nếu cần upload avatar file |

### Endpoints chưa có trong authService (so Postman)

| Endpoint | Method | Ghi chú |
|---|---|---|
| `POST /auth/forgot-password` | POST | Chưa implement |
| `POST /auth/reset-password` | POST | Chưa implement |
| `POST /auth/verify-email/send` | POST | Chưa implement |
| `GET /auth/verify-email/:token` | GET | Chưa implement |
| `GET /auth/2fa/status` | GET | Chưa implement |
| `POST /auth/2fa/setup` | POST | Chưa implement |
| `POST /auth/2fa/enable` | POST | Chưa implement |
| `POST /auth/2fa/disable` | POST | Chưa implement |
| `POST /auth/2fa/verify-login` | POST | Chưa implement |

---

## C. Quy ước UI hiển thị dữ liệu

### Table / List page

- Dùng `ToolTableCustom` làm wrapper — có sẵn search, pagination, filter slot, total count
- Bên trong dùng shadcn `Table / TableHeader / TableBody / TableRow / TableHead / TableCell`
- Sticky `TableHeader` với `className="sticky top-0 z-20"`
- Mỗi row có thể click để mở detail dialog
- Action buttons (edit/delete/lock/...) trong cột cuối, `text-right`, dùng `e.stopPropagation()`

### Loading / Error / Empty state (bắt buộc có đủ 3)

```tsx
// Trong TableBody:
{dbQuery.isLoading && (
  <TableRow><TableCell colSpan={N} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
)}
{dbQuery.isError && (
  <TableRow><TableCell colSpan={N} className="text-center py-8 text-destructive">Đã xảy ra lỗi, vui lòng thử lại</TableCell></TableRow>
)}
{!dbQuery.isLoading && !dbQuery.isError && items.length === 0 && (
  <TableRow><TableCell colSpan={N} className="text-muted-foreground text-center">Không có dữ liệu</TableCell></TableRow>
)}
```

### Màu sắc / Font chữ

- **Không hardcode**: `#ffffff`, `#000000`, `text-[#0b66c3]`, `bg-[#eef7ff]`, `style={{ color: '...' }}`
- **Dùng token**: `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, ...
- **Typography**: dùng semantic class từ `src/styles/index.css` (`typo-body`, `typo-table-cell`, `typo-label`, ...)

### Status / Boolean fields

- Không render `true/false`, `active/inactive` dạng plain text
- Dùng `StatusDotBadge` với label map và color map được define trong constants file

---

## D. Rule dropdown / select — KHÔNG được hardcode ID

> **Đây là rule quan trọng nhất. Vi phạm rule này sẽ gây lỗi nghiêm trọng khi dữ liệu thay đổi.**

### Nguyên tắc

Các trường dạng dropdown/select/combobox **tuyệt đối không được hardcode ID**. Nếu API yêu cầu gửi:

- `category_id`, `spot_category_id`
- `province_id`, `district_id`
- `role_id`
- `type_id`, `business_type_id`
- `parent_id`, `tourism_point_id`
- ...bất kỳ `*_id` nào

Thì UI **phải**:

1. **Gọi API danh sách** tương ứng để lấy options
2. **Hiển thị label/name/title/code** dễ hiểu cho người dùng chọn
3. **Khi submit** mới gửi `id` hoặc `value` tương ứng về backend
4. **Không bắt người dùng nhập hoặc chọn ID thô**
5. **Không hardcode sẵn** danh sách items trong component
6. Nếu Postman Collection có API lấy danh mục/options thì **phải dùng API đó**
7. Nếu chưa tìm thấy API options trong Postman → ghi `{/* TODO: cần API lấy options */}` và dừng lại, không tự bịa data

### Ví dụ đúng

```tsx
// role_id dropdown — gọi GET /roles để lấy options
const rolesQuery = useApiQuery(['roles'], () => roleService.getAll(), { staleTime: 5 * 60 * 1000 }, false, false)
const roles = rolesQuery.data?.data ?? []

<Select value={watch('role_id')?.toString()} onValueChange={(v) => setValue('role_id', parseInt(v))}>
  <SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger>
  <SelectContent>
    {roles.map((role) => (
      <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

```tsx
// category_id dropdown — gọi GET /spot-categories để lấy options
const categoriesQuery = useApiQuery(['spot-categories'], () => spotCategoryService.getAll(), { staleTime: 5 * 60 * 1000 })
const categories = categoriesQuery.data?.data ?? []

<Select value={watch('category_id')?.toString()} onValueChange={(v) => setValue('category_id', parseInt(v))}>
  <SelectContent>
    {categories.map((cat) => (
      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Ví dụ sai — KHÔNG làm

```tsx
// SAIIII: hardcode role options
<Select>
  <SelectItem value="1">Admin</SelectItem>
  <SelectItem value="2">User</SelectItem>
  <SelectItem value="3">Editor</SelectItem>
</Select>

// SAIIII: hardcode province_id
<Select>
  <SelectItem value="64">Ninh Bình</SelectItem>
  <SelectItem value="1">Hà Nội</SelectItem>
</Select>
```

### Mapping filter matrix

| Field gửi API | API lấy options | Field hiển thị |
|---|---|---|
| `role_id` | `GET /roles` | `role.name` |
| `category_id` | `GET /spot-categories` | `category.name` |
| `spot_id` | `GET /spots` (paginated) | `spot.name` |
| `business_id` | `GET /businesses` (paginated) | `business.name` |
| `user_id` | `GET /users` (paginated) | `user.email` hoặc `user.full_name` |
| `province_code` | TODO: cần API danh sách tỉnh | — |
| `district_id` | TODO: cần API danh sách huyện | — |

---

## E. Checklist khi tạo service / page mới

Trước khi mở PR, kiểm tra toàn bộ checklist:

### API & Service

- [ ] Đã kiểm tra endpoint trong `DuLichNinhBinh API.postman_collection.json`?
- [ ] Method + path + query params + request body đúng chính xác với Postman?
- [ ] Request body field names dùng `snake_case` (không camelCase)?
- [ ] Path constant đã thêm vào `src/constant/serviceConstant.ts`?
- [ ] Service đã export qua `src/service/index.ts`?
- [ ] Không có service function stale (không còn trong Postman)?

### Type / Schema

- [ ] Type/interface đã tạo trong `src/types/api/`?
- [ ] Field names khớp với JSON response từ backend (snake_case)?
- [ ] Body type cho create/update khớp Postman request body?

### Page / UI

- [ ] Page dùng `PageLayout` wrapper?
- [ ] Dùng `ToolTableCustom` cho list + pagination?
- [ ] Có đủ Loading / Error / Empty state trong table?
- [ ] Status/boolean fields hiển thị bằng `StatusDotBadge`, không plain text?
- [ ] Không hardcode màu/font — dùng token và semantic typography class?

### Dropdown / Select

- [ ] Tất cả `*_id` fields trong form đều gọi API để lấy options?
- [ ] Không hardcode bất kỳ ID hay danh sách cố định nào trong component?
- [ ] Nếu chưa có API options → đã ghi TODO?

### Actions & UX

- [ ] Create/update/delete mutations đều refetch data sau khi thành công?
- [ ] Delete/destructive actions có AlertDialog confirm?
- [ ] Toast notification hiển thị khi thành công/thất bại?
- [ ] Action buttons trên table row có `e.stopPropagation()` để không trigger row click?

### Filter

- [ ] Chỉ implement filter UI cho params có trong Postman matrix?
- [ ] Mọi filter/search/limit thay đổi đều reset `currentPage` về 1?
- [ ] Không gửi `undefined` hoặc empty string lên API?

---

## F. User / Auth flow hiện tại (reference)

Đây là flow của module User/Auth — dùng làm mẫu tham chiếu.

### Files

| File | Vai trò |
|---|---|
| `src/components/layout/UserMenu.tsx` | Dropdown menu header: hiển thị tên user, navigate profile/change-password, logout |
| `src/stores/common/useAuthStore.ts` | Zustand store: user state, isAuthenticated, isAdmin, loginSuccess, fetchProfile, logout, initialize |
| `src/service/authService.ts` | Auth API: login, refreshToken, getProfile, updateProfile, changePassword, logout |
| `src/service/userService.ts` | User management API: getAll, getById, create, update, lock, unlock, batchDelete, assignRole, delete |
| `src/pages/User/index.tsx` | User list page: table, search, CRUD, lock, delete dialogs |
| `src/pages/User/UserFormDialog.tsx` | Create/edit user dialog: form với role dropdown gọi API |
| `src/pages/User/UserDetailDialog.tsx` | User detail readonly dialog |
| `src/service/common/apiClient.ts` | HTTP client: auto token refresh, error handling, toast |

### Flow đăng nhập

```
LoginPage → authService.login() → useAuthStore.loginSuccess() (save tokens)
         → useAuthStore.fetchProfile() → authService.getProfile()
         → validate isAdmin → redirect /dashboard
```

### Flow logout

```
UserMenu.handleLogout() → authService.logout() → useAuthStore.logout() (clear tokens)
                       → navigate('/login')
// Nếu API lỗi: vẫn clear tokens và redirect (security first)
```

### Flow User CRUD

```
User/index.tsx → userService.getAll(queryParams) [React Query]
              → UserFormDialog → userService.create() / userService.update()
              → AlertDialog confirm → userService.delete()
              → AlertDialog confirm + reason input → userService.lock()
              → dbQuery.refetch() sau mỗi mutation thành công
```

### Self-action guard

Trang User kiểm tra `currentUser.id` trước khi cho phép lock/delete:

```ts
if (currentUser && u.id === currentUser.id) {
  toast.warning('Bạn không thể khóa/xóa tài khoản của mình')
  return
}
```
