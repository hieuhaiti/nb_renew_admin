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

  /** GET /ocop/me — enterprise: my products */
  // TODO: Available in Postman but not used by admin UI yet
  getMe: (params?: { search?: string; category?: string }) =>
    apiClient.get<ApiResponse<OcopListData>>(`${serviceOcopPath}/me`, params),

  /** GET /ocop/geojson */
  getGeoJSON: () =>
    apiClient.get<ApiResponse<object>>(`${serviceOcopPath}/geojson`),

  /** GET /ocop/categories */
  getCategories: () =>
    apiClient.get<ApiResponse<string[]>>(`${serviceOcopPath}/categories`),

  /** GET /ocop/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<OcopProduct>>(`${serviceOcopPath}/${id}`),

  /** POST /ocop */
  create: (data: OcopFormBody) =>
    apiClient.post<ApiResponse<OcopProduct>>(serviceOcopPath, data),

  /** PATCH /ocop/:id */
  update: (id: string, data: Partial<OcopFormBody>) =>
    apiClient.patch<ApiResponse<OcopProduct>>(`${serviceOcopPath}/${id}`, data),

  /** DELETE /ocop/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceOcopPath}/${id}`),
}
