import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Festival,
  FestivalListData,
  FestivalListParams,
  FestivalFormBody,
} from '@/types/api'
import { serviceFestivalPath } from '@/constant/serviceConstant'

export default {
  /** GET /festivals */
  getAll: (params?: FestivalListParams) =>
    apiClient.get<ApiResponse<FestivalListData>>(serviceFestivalPath, params),

  /** GET /festivals/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Festival>>(`${serviceFestivalPath}/${id}`),

  /** POST /festivals */
  create: (data: FestivalFormBody) =>
    apiClient.post<ApiResponse<Festival>>(serviceFestivalPath, data),

  /** PUT /festivals/:id */
  update: (id: string, data: FestivalFormBody) =>
    apiClient.put<ApiResponse<Festival>>(`${serviceFestivalPath}/${id}`, data),

  /** DELETE /festivals/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceFestivalPath}/${id}`),
}
