export interface Notification {
  id: number
  user_id?: string | null
  type: string
  title?: string | null
  title_vi?: string | null
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
  pagination: import('./index').Pagination
  unread_count?: number
}

export interface NotificationListParams {
  page?: number
  limit?: number
  unread_only?: boolean
  type?: string
  delivery_status?: string
}

export interface SendNotificationBody {
  type: string
  title_vi: string
  title?: string
  body_vi: string
  body?: string
  user_id?: string
  role_ids?: number[]
  send_all?: boolean
  target_lng?: number
  target_lat?: number
  target_radius_m?: number
  data?: Record<string, any>
}
