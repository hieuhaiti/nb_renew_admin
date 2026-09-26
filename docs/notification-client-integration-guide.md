# Huong dan tich hop Notification cho giao dien client

Tai lieu nay tom tat cach tich hop notification tu service den UI cho ung dung client, dua tren luong hien co cua admin:

- Type: `src/types/api/notification.ts`
- Service: `src/service/notificationService.ts`
- Realtime hook: `src/hooks/useNotificationWebSocket.ts`
- UI mau: `src/components/layout/NotificationMenu.tsx`

Admin va client dung chung endpoint `/notifications`, chung response contract va chung logic realtime. Phia client chi can bo phan gui thong bao admin neu khong co quyen tao notification.

## 1. Dieu kien can co

Client can co cac nen tang giong admin:

- `VITE_API_BASE_URL`: base URL cua REST API.
- `VITE_WS_URL`: URL WebSocket notification.
- Access token luu trong token manager/local auth store.
- API client co gan header `Authorization: Bearer <access_token>`.
- Query layer de refetch data sau khi co WebSocket message, vi du TanStack Query hoac wrapper `useApiQuery`.

WebSocket khong can parse payload de cap nhat UI truc tiep. Logic hien tai chi dung moi message nhu mot tin hieu de refetch `/notifications/me`.

## 2. Shared type nen dung lai

Tao file type o client, vi du `src/types/api/notification.ts`:

```ts
export interface Notification {
  id: string
  user_id?: string | null
  type: string
  title?: string | null
  title_vi?: string | null
  message?: string | null
  body?: string | null
  body_vi?: string | null
  payload?: Record<string, any> | null
  is_read: boolean
  delivery_status?: string | null
  created_at: string
  read_at?: string | null
}

export interface NotificationListData {
  notifications: Notification[]
  pagination: Pagination
  unread_count?: number
}

export interface NotificationListParams {
  page?: number
  limit?: number
  unread_only?: boolean
  type?: string
  delivery_status?: string
}
```

Neu client da co `ApiResponse<T>` va `Pagination`, dung lai contract chung:

```ts
export interface ApiResponse<T = any> {
  message: string
  status: number
  data?: T
  errors?: string[]
  options?: Record<string, any>
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
```

## 3. Service dung chung endpoint

Client nen tao service rieng nhung giu path va method giong admin:

```ts
const serviceNotificationPath = '/notifications'

export const notificationService = {
  getMy: (params?: NotificationListParams) =>
    apiClient.get<ApiResponse<NotificationListData>>(
      `${serviceNotificationPath}/me`,
      params
    ),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>(
      `${serviceNotificationPath}/unread-count`
    ),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<{ updated_count: number }>>(
      `${serviceNotificationPath}/read-all`
    ),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<{ notification: Notification }>>(
      `${serviceNotificationPath}/${id}/read`
    ),

  delete: (id: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceNotificationPath}/${id}`),

  deleteAll: () =>
    apiClient.del<ApiResponse<{ deleted_count: number }>>(
      serviceNotificationPath
    ),
}
```

Endpoint admin-only co the khong dua vao client:

```ts
// POST /notifications
// Chi dung cho admin gui push notification.
send: (data: SendNotificationBody) =>
  apiClient.post<ApiResponse<{}>>('/notifications', data)
```

## 4. WebSocket hook

Client dung chung logic WebSocket:

```ts
type UseNotificationWebSocketOptions = {
  enabled?: boolean
  onMessage: () => void
}

const WS_BASE_URL = import.meta.env.VITE_WS_URL || ''

function buildNotificationSocketUrl(token?: string) {
  if (!WS_BASE_URL) return ''

  let url: URL
  try {
    url = new URL(WS_BASE_URL)
  } catch {
    return ''
  }

  if (token) {
    url.searchParams.set('token', token)
  }

  return url.toString()
}
```

Hook nen:

- Lay access token hien tai va gan vao query param `token`.
- Tu reconnect khi socket close.
- Reset reconnect attempt khi `onopen`.
- Goi `onMessage` khi nhan bat ky socket message nao.
- Debounce/refetch guard khoang `500ms` de tranh refetch qua day.
- Dong socket va clear timer khi component unmount.

Pseudo flow:

```ts
useNotificationWebSocket({
  enabled: Boolean(accessToken),
  onMessage: () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] })
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
  },
})
```

Neu token co the thay doi sau login/refresh, client nen build lai `socketUrl` theo dependency `accessToken` thay vi memo rong. Ban admin hien tai lay token mot lan khi hook mount.

## 5. Luong UI de hien thi menu thong bao

UI client co the copy luong cua `NotificationMenu`:

1. Query danh sach notification:

```ts
const params: NotificationListParams = { page: 1, limit: 10 }

const query = useQuery({
  queryKey: ['notifications', 'me', params.page, params.limit],
  queryFn: () => notificationService.getMy(params),
  refetchOnWindowFocus: false,
})
```

2. Khi WebSocket co message thi refetch:

```ts
useNotificationWebSocket({
  onMessage: () => query.refetch(),
})
```

3. Khi mo dropdown/menu thi refetch them mot lan de du lieu moi:

```ts
useEffect(() => {
  if (open) query.refetch()
}, [open, query.refetch])
```

4. Lay unread count tu API truoc, fallback bang cach dem local:

```ts
const data = query.data?.data
const notifications = data?.notifications ?? []
const unreadCount = Number.isFinite(Number(data?.unread_count))
  ? Math.max(0, Number(data?.unread_count))
  : Math.max(0, notifications.filter((item) => !item.is_read).length)
```

5. Khi user click notification chua doc, goi mark-as-read roi refetch:

```ts
const markAsRead = useMutation({
  mutationFn: (id: string) => notificationService.markAsRead(id),
  onSuccess: () => query.refetch(),
})
```

6. Nut "Danh dau da doc tat ca" goi endpoint read-all:

```ts
const markAllAsRead = useMutation({
  mutationFn: () => notificationService.markAllAsRead(),
  onSuccess: () => query.refetch(),
})
```

## 6. Mapping text hien thi

Nen uu tien noi dung tieng Viet truoc, fallback sang field khong hau to:

```ts
function getPrimaryText(notification: Notification) {
  return notification.title_vi || notification.title || 'Thong bao'
}

function getSecondaryText(notification: Notification) {
  const primary = notification.title_vi || notification.title
  if (primary) return notification.body_vi || notification.body || ''
  return ''
}
```

De client phu hop ngu canh nguoi dung, co the doi fallback theo ngon ngu app:

- `vi`: uu tien `title_vi`, `body_vi`.
- ngon ngu khac: uu tien `title`, `body`, fallback sang tieng Viet.

## 7. Hanh vi UI nen giu

Menu notification phia client nen co cac state toi thieu:

- Badge dem so notification chua doc, hien `9+` neu lon hon 9.
- Loading state khi dang tai lan dau.
- Empty state khi khong co notification.
- Item chua doc co visual state rieng, vi du background nhe va dot indicator.
- Click item chua doc thi mark-as-read.
- Nut mark-all-as-read chi hien khi `unreadCount > 0`.
- Hien thoi gian `created_at` bang helper date cua client.

Neu notification co dieu huong trong `payload`, xu ly sau khi mark-as-read:

```ts
function getNotificationHref(notification: Notification) {
  return notification.payload?.url || notification.payload?.path || null
}
```

Nen uu tien mark-as-read truoc, sau do navigate. Neu mark-as-read loi, van co the navigate neu day la hanh vi mong muon cua client.

## 8. Query key de dong bo cache

Neu client co nhieu noi hien notification, nen dung query key nhat quan:

```ts
['notifications', 'me', page, limit]
['notifications', 'unread-count']
```

Sau cac mutation sau nen invalidate/refetch:

- `markAsRead`
- `markAllAsRead`
- `delete`
- `deleteAll`
- WebSocket `message`

Vi API `/notifications/me` da tra ve `unread_count`, client co the chi dung mot query cho dropdown. Neu header chi can badge va khong can danh sach, dung `/notifications/unread-count`.

## 9. Checklist tich hop nhanh

- Copy type `Notification`, `NotificationListData`, `NotificationListParams`.
- Tao `notificationService` voi path `/notifications`.
- Them `VITE_WS_URL` vao env client.
- Tao `useNotificationWebSocket` va gan access token vao query param `token`.
- Gan hook vao layout/header component da authenticated.
- Query `/notifications/me?page=1&limit=10` de render menu.
- Refetch khi socket message, khi mo menu, va sau mutation.
- Mark read bang `PATCH /notifications/:id/read`.
- Mark all read bang `PATCH /notifications/read-all`.
- Khong copy `send` sang client neu client khong co chuc nang admin.

## 10. Cac loi de gap

- `VITE_WS_URL` rong hoac sai protocol: hook se khong ket noi. Dung `ws://` hoac `wss://`.
- Token het han: REST API co the refresh token, nhung socket da mo co the van dung token cu. Nen remount/rebuild socket khi access token thay doi.
- Refetch qua nhieu: giu guard `500ms` trong WebSocket message handler.
- UI dem unread sai: uu tien `data.unread_count`; chi fallback dem local khi API khong tra field nay.
- Khac biet role admin/client: endpoint xem notification cua minh la `/notifications/me`, khong dung endpoint admin `POST /notifications`.
