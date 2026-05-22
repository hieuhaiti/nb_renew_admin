import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Vlog,
  VlogListData,
  VlogListParams,
  VlogModerationBody,
} from '@/types/api'
import { serviceVlogPath } from '@/constant/serviceConstant'

export default {
  // ─── Admin endpoints ──────────────────────────────────────────────────────

  /** GET /vlogs/admin/all */
  getAllAdmin: (params?: VlogListParams) =>
    apiClient.get<ApiResponse<VlogListData>>(`${serviceVlogPath}/admin/all`, params),

  /** GET /vlogs/admin/:id */
  getByIdAdmin: (id: string) =>
    apiClient.get<ApiResponse<{ vlog: Vlog }>>(`${serviceVlogPath}/admin/${id}`),

  /** PATCH /vlogs/admin/:id/moderate */
  moderate: (id: string, data: VlogModerationBody) =>
    apiClient.patch<ApiResponse<Vlog>>(`${serviceVlogPath}/admin/${id}/moderate`, data),

  /** POST /vlogs */
  // TODO: Available in Postman but not used by admin UI yet
  create: (data: Partial<Vlog>) =>
    apiClient.post<ApiResponse<Vlog>>(serviceVlogPath, data),

  /** PATCH /vlogs/:id */
  // TODO: Available in Postman but not used by admin UI yet
  update: (id: string, data: Partial<Vlog>) =>
    apiClient.patch<ApiResponse<Vlog>>(`${serviceVlogPath}/${id}`, data),

  /** DELETE /vlogs/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceVlogPath}/${id}`),

  // ─── Available in Postman, not yet used by admin UI ───────────────────────

  /** GET /vlogs — public list */
  // TODO: Available in Postman but not used by admin UI yet
  getAll: (params?: VlogListParams) =>
    apiClient.get<ApiResponse<VlogListData>>(serviceVlogPath, params),

  /** GET /vlogs/:id */
  // TODO: Available in Postman but not used by admin UI yet
  getById: (id: string) =>
    apiClient.get<ApiResponse<{ vlog: Vlog }>>(`${serviceVlogPath}/${id}`),

  /** GET /vlogs/:vlogId/comments */
  // TODO: Available in Postman but not used by admin UI yet
  getComments: (vlogId: string) =>
    apiClient.get<ApiResponse<object>>(`${serviceVlogPath}/${vlogId}/comments`),

  /** POST /vlogs/:vlogId/comments */
  // TODO: Available in Postman but not used by admin UI yet
  createComment: (vlogId: string, data: { content: string }) =>
    apiClient.post<ApiResponse<object>>(`${serviceVlogPath}/${vlogId}/comments`, data),

  /** DELETE /vlogs/:vlogId/comments/:commentId */
  // TODO: Available in Postman but not used by admin UI yet
  deleteComment: (vlogId: string, commentId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceVlogPath}/${vlogId}/comments/${commentId}`),

  /** PUT /vlogs/:id/like */
  // TODO: Available in Postman but not used by admin UI yet
  like: (id: string) => apiClient.put<ApiResponse<{}>>(`${serviceVlogPath}/${id}/like`),

  /** DELETE /vlogs/:id/like */
  // TODO: Available in Postman but not used by admin UI yet
  unlike: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceVlogPath}/${id}/like`),

  /** PUT /vlogs/:id/save */
  // TODO: Available in Postman but not used by admin UI yet
  save: (id: string) => apiClient.put<ApiResponse<{}>>(`${serviceVlogPath}/${id}/save`),

  /** DELETE /vlogs/:id/save */
  // TODO: Available in Postman but not used by admin UI yet
  unsave: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceVlogPath}/${id}/save`),

  /** GET /vlogs/user/saved */
  // TODO: Available in Postman but not used by admin UI yet
  getSaved: () => apiClient.get<ApiResponse<VlogListData>>(`${serviceVlogPath}/user/saved`),
}
