import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Culinary,
  CulinaryListData,
  CulinaryListParams,
  CulinaryFormBody,
} from '@/types/api'
import { serviceCulinaryPath } from '@/constant/serviceConstant'

export default {
  /** GET /culinary */
  getAll: (params?: CulinaryListParams) =>
    apiClient.get<ApiResponse<CulinaryListData>>(serviceCulinaryPath, params),

  /** GET /culinary/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Culinary>>(`${serviceCulinaryPath}/${id}`),

  /** POST /culinary */
  create: (data: CulinaryFormBody) =>
    apiClient.post<ApiResponse<Culinary>>(serviceCulinaryPath, data),

  /** PUT /culinary/:id */
  update: (id: string, data: CulinaryFormBody) =>
    apiClient.put<ApiResponse<Culinary>>(`${serviceCulinaryPath}/${id}`, data),

  /** DELETE /culinary/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceCulinaryPath}/${id}`),
}
