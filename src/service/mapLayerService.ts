import apiClient from './common/apiClient'
import type { ApiResponse, MapLayer, MapLayerListData, MapLayerListParams } from '@/types/api'
import { serviceMapLayerPath } from '@/constant/serviceConstant'

export default {
  /** GET /map-admin/layers */
  getAll: (params?: MapLayerListParams) =>
    apiClient.get<ApiResponse<MapLayerListData>>(serviceMapLayerPath, params),

  /** PATCH /map-admin/layers/:id/toggle */
  toggle: (id: number) =>
    apiClient.patch<ApiResponse<MapLayer>>(`${serviceMapLayerPath}/${id}/toggle`),
}
