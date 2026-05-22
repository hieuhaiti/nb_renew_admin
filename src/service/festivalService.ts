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

  /** GET /festivals/types */
  getTypes: () =>
    apiClient.get<ApiResponse<string[]>>(`${serviceFestivalPath}/types`),

  /** GET /festivals/calendar */
  getCalendar: (params?: {
    from?: string
    to?: string
    province_code?: string
    festival_type?: string
    lang?: string
  }) => apiClient.get<ApiResponse<Festival[]>>(`${serviceFestivalPath}/calendar`, params),

  /** POST /festivals */
  create: (data: FestivalFormBody) =>
    apiClient.post<ApiResponse<Festival>>(serviceFestivalPath, data),

  /** PATCH /festivals/:id */
  update: (id: string, data: Partial<FestivalFormBody>) =>
    apiClient.patch<ApiResponse<Festival>>(`${serviceFestivalPath}/${id}`, data),

  /** DELETE /festivals/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceFestivalPath}/${id}`),
}
