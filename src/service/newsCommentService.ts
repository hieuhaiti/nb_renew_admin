import apiClient from './common/apiClient'
import type {
  ApiResponse,
  NewsComment,
  NewsCommentListData,
  NewsCommentListParams,
} from '@/types/api'
import { serviceNewsPath } from '@/constant/serviceConstant'

export default {
  /** GET /news/:newsId/comments */
  getByNewsId: (newsId: string, params?: NewsCommentListParams) =>
    apiClient.get<ApiResponse<NewsCommentListData>>(
      `${serviceNewsPath}/${newsId}/comments`,
      params
    ),

  /** POST /news/:newsId/comments */
  create: (
    newsId: string,
    data: { content: string; parent_comment_id?: string | null; user_name?: string; user_email?: string }
  ) => apiClient.post<ApiResponse<NewsComment>>(`${serviceNewsPath}/${newsId}/comments`, data),

  /** PUT /news/:newsId/comments/:commentId */
  update: (newsId: string, commentId: string, data: { content: string }) =>
    apiClient.put<ApiResponse<NewsComment>>(
      `${serviceNewsPath}/${newsId}/comments/${commentId}`,
      data
    ),

  /** DELETE /news/:newsId/comments/:commentId */
  delete: (newsId: string, commentId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceNewsPath}/${newsId}/comments/${commentId}`),

  /** PATCH /news/:newsId/comments/:commentId/approval */
  setApproval: (newsId: string, commentId: string, is_approved: boolean) =>
    apiClient.patch<ApiResponse<NewsComment>>(
      `${serviceNewsPath}/${newsId}/comments/${commentId}/approval`,
      { is_approved }
    ),
}
