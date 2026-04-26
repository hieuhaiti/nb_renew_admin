import apiClient from './common/apiClient'
import type {
  ApiResponse,
  MapAdminCategory,
  MapAdminCategoryListData,
  MapAdminCategoryListParams,
} from '@/types/api'
import { serviceMapAdminCategoryPath } from '@/constant/serviceConstant'

export default {
  /** GET /map-admin/categories */
  getAll: (params?: MapAdminCategoryListParams) =>
    apiClient.get<ApiResponse<MapAdminCategoryListData>>(serviceMapAdminCategoryPath, params),
}
