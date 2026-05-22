import apiClient from './common/apiClient'
import type { ApiResponse, MapLayer, MapLayerListData, MapLayerListParams } from '@/types/api'
import { serviceMapLayerPath } from '@/constant/serviceConstant'

export interface MapLayerFormBody {
  category_id: number
  code: string
  name_vi: string
  name_en?: string
  layer_type: string
  source_url: string
  style_json?: Record<string, any>
  min_zoom?: number
  max_zoom?: number
  is_default_visible?: boolean
  sort_order?: number
  status?: 'active' | 'inactive'
}

export default {
  /** GET /map-admin/layers */
  getAll: (params?: MapLayerListParams) =>
    apiClient.get<ApiResponse<MapLayerListData>>(serviceMapLayerPath, params),

  /** POST /map-admin/layers */
  create: (data: MapLayerFormBody) =>
    apiClient.post<ApiResponse<MapLayer>>(serviceMapLayerPath, data),

  /** PATCH /map-admin/layers/:id */
  update: (id: number, data: Partial<MapLayerFormBody>) =>
    apiClient.patch<ApiResponse<MapLayer>>(`${serviceMapLayerPath}/${id}`, data),

  /** DELETE /map-admin/layers/:id */
  delete: (id: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceMapLayerPath}/${id}`),

  /** PATCH /map-admin/layers/:id/toggle */
  toggle: (id: number) =>
    apiClient.patch<ApiResponse<MapLayer>>(`${serviceMapLayerPath}/${id}/toggle`),
}
