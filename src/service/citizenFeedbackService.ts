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
  /** GET /feedbacks */
  // TODO: Available in Postman but not used by admin UI yet
  getPublic: (params?: FeedbackListParams) =>
    apiClient.get<ApiResponse<CitizenFeedbackListData>>(serviceFeedbackPath, params),

  /** POST /feedbacks */
  // TODO: Available in Postman but not used by admin UI yet
  create: (data: Partial<CitizenFeedback>) =>
    apiClient.post<ApiResponse<CitizenFeedback>>(serviceFeedbackPath, data),

  /** GET /feedbacks/admin/all */
  getAll: (params?: FeedbackListParams) =>
    apiClient.get<ApiResponse<CitizenFeedbackListData>>(
      `${serviceFeedbackPath}/admin/all`,
      params
    ),

  /** GET /feedbacks/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}`),

  /** PUT /feedbacks/:id */
  // TODO: Available in Postman but not used by admin UI yet
  update: (id: string, data: Partial<CitizenFeedback>) =>
    apiClient.put<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}`, data),

  /** PATCH /feedbacks/:id/status */
  updateStatus: (id: string, data: UpdateFeedbackStatusBody) =>
    apiClient.patch<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}/status`, data),

  /** PATCH /feedbacks/:id/moderation */
  updateModeration: (id: string, data: UpdateModerationBody) =>
    apiClient.patch<ApiResponse<CitizenFeedback>>(`${serviceFeedbackPath}/${id}/moderation`, data),

  /** DELETE /feedbacks/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceFeedbackPath}/${id}`),
}
