import apiClient from './common/apiClient'
import type {
  ApiResponse,
  CitizenFeedback,
  CitizenFeedbackListData,
  FeedbackListParams,
  UpdateFeedbackStatusBody,
  UpdateModerationBody,
} from '@/types/api'
import { serviceFeedbackPath } from '@/constant/serviceConstant'

export default {
  /** GET /feedbacks/admin/all (admin — all feedbacks) */
  getAll: (params?: FeedbackListParams) =>
    apiClient.get<ApiResponse<CitizenFeedbackListData>>(
      `${serviceFeedbackPath}/admin/all`,
      params
    ),

  /** GET /feedbacks/:id */
  getById: (id: number) =>
    apiClient.get<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}`),

  /** PATCH /feedbacks/:id/status */
  updateStatus: (id: number, data: UpdateFeedbackStatusBody) =>
    apiClient.patch<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}/status`, data),

  /** PATCH /feedbacks/:id/moderation */
  updateModeration: (id: number, data: UpdateModerationBody) =>
    apiClient.patch<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}/moderation`, data),

  /** DELETE /feedbacks/:id */
  delete: (id: number) => apiClient.del<ApiResponse<{}>>(`${serviceFeedbackPath}/${id}`),
}
