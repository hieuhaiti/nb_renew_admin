import apiClient from './common/apiClient'
import type {
  ApiResponse,
  SpotCategory,
  SpotCategoryTree,
  SpotCategoryListData,
  SpotCategoryListParams,
  SpotCategoryFormBody,
} from '@/types/api'
import { serviceSpotCategoryPath } from '@/constant/serviceConstant'

export default {
  /** GET /spot-categories */
  getAll: (params?: SpotCategoryListParams) =>
    apiClient.get<ApiResponse<SpotCategoryListData>>(serviceSpotCategoryPath, params),

  /** GET /spot-categories/tree */
  getTree: () =>
    apiClient.get<ApiResponse<SpotCategoryTree[]>>(`${serviceSpotCategoryPath}/tree`),

  /** GET /spot-categories/:id */
  getById: (id: number) =>
    apiClient.get<ApiResponse<SpotCategory>>(`${serviceSpotCategoryPath}/${id}`),

  /** POST /spot-categories */
  create: (data: SpotCategoryFormBody | FormData) =>
    apiClient.post<ApiResponse<SpotCategory>>(serviceSpotCategoryPath, data, data instanceof FormData),

  /** PUT /spot-categories/:id */
  update: (id: number, data: Partial<SpotCategoryFormBody> | FormData) =>
    apiClient.put<ApiResponse<SpotCategory>>(`${serviceSpotCategoryPath}/${id}`, data, data instanceof FormData),

  /** PATCH /spot-categories/:id/toggle */
  toggle: (id: number) =>
    apiClient.patch<ApiResponse<SpotCategory>>(`${serviceSpotCategoryPath}/${id}/toggle`),

  /** DELETE /spot-categories/:id */
  delete: (id: number) => apiClient.del<ApiResponse<{}>>(`${serviceSpotCategoryPath}/${id}`),
}
