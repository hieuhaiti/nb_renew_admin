import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Notification,
  NotificationListData,
  NotificationListParams,
  SendNotificationBody,
} from '@/types/api'
import { serviceNotificationPath } from '@/constant/serviceConstant'

export default {
  /** POST /notifications (Admin send push notification) */
  send: (data: SendNotificationBody) =>
    apiClient.post<ApiResponse<{}>>(`${serviceNotificationPath}`, data),

  /** GET /notifications/me */
  getMy: (params?: NotificationListParams) =>
    apiClient.get<ApiResponse<NotificationListData>>(`${serviceNotificationPath}/me`, params),

  /** GET /notifications/unread-count */
  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>(`${serviceNotificationPath}/unread-count`),

  /** PATCH /notifications/read-all */
  markAllAsRead: () =>
    apiClient.patch<ApiResponse<{ updated_count: number }>>(`${serviceNotificationPath}/read-all`),

  /** PATCH /notifications/:id/read */
  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<{ notification: Notification }>>(
      `${serviceNotificationPath}/${id}/read`
    ),

  /** DELETE /notifications/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceNotificationPath}/${id}`),

  /** DELETE /notifications */
  deleteAll: () =>
    apiClient.del<ApiResponse<{ deleted_count: number }>>(`${serviceNotificationPath}`),
}
