import apiClient from './common/apiClient'
import type {
  ApiResponse,
  OcopProduct,
  OcopListData,
  OcopListParams,
  OcopFormBody,
} from '@/types/api'
import { serviceOcopPath } from '@/constant/serviceConstant'

export default {
  /** GET /ocop */
  getAll: (params?: OcopListParams) =>
    apiClient.get<ApiResponse<OcopListData>>(serviceOcopPath, params),

  /** GET /ocop/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<OcopProduct>>(`${serviceOcopPath}/${id}`),

  /** POST /ocop */
  create: (data: OcopFormBody) =>
    apiClient.post<ApiResponse<OcopProduct>>(serviceOcopPath, data),

  /** PUT /ocop/:id */
  update: (id: string, data: OcopFormBody) =>
    apiClient.put<ApiResponse<OcopProduct>>(`${serviceOcopPath}/${id}`, data),

  /** DELETE /ocop/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceOcopPath}/${id}`),
}
