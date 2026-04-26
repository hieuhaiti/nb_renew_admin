import apiClient from './common/apiClient'
import type { ApiResponse, Vlog, VlogListData, VlogListParams, VlogModerationBody } from '@/types/api'
import { serviceVlogPath } from '@/constant/serviceConstant'

export default {
  /** GET /vlogs/admin/all */
  getAllAdmin: (params?: VlogListParams) =>
    apiClient.get<ApiResponse<VlogListData>>(`${serviceVlogPath}/admin/all`, params),

  /** GET /vlogs/admin/:id */
  getByIdAdmin: (id: string) =>
    apiClient.get<ApiResponse<{ vlog: Vlog }>>(`${serviceVlogPath}/admin/${id}`),

  /** PATCH /vlogs/admin/:id/moderate */
  moderate: (id: string, data: VlogModerationBody) =>
    apiClient.patch<ApiResponse<Vlog>>(`${serviceVlogPath}/admin/${id}/moderate`, data),

  /** DELETE /vlogs/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceVlogPath}/${id}`),
}
