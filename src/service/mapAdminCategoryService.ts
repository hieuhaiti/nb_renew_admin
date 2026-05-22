import apiClient from './common/apiClient'
import type {
  ApiResponse,
  MapAdminCategory,
  MapAdminCategoryListData,
  MapAdminCategoryListParams,
} from '@/types/api'
import { serviceMapAdminCategoryPath } from '@/constant/serviceConstant'

export interface MapAdminCategoryFormBody {
  code: string
  name_vi: string
  name_en?: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

export default {
  /** GET /map-admin/categories */
  getAll: (params?: MapAdminCategoryListParams) =>
    apiClient.get<ApiResponse<MapAdminCategoryListData>>(serviceMapAdminCategoryPath, params),

  /** POST /map-admin/categories */
  create: (data: MapAdminCategoryFormBody) =>
    apiClient.post<ApiResponse<MapAdminCategory>>(serviceMapAdminCategoryPath, data),

  /** PATCH /map-admin/categories/:id */
  update: (id: number, data: Partial<MapAdminCategoryFormBody>) =>
    apiClient.patch<ApiResponse<MapAdminCategory>>(`${serviceMapAdminCategoryPath}/${id}`, data),

  /** DELETE /map-admin/categories/:id */
  delete: (id: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceMapAdminCategoryPath}/${id}`),
}
