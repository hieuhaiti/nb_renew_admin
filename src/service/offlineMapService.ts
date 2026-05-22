import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceOfflineMapPath } from '@/constant/serviceConstant'

export interface OfflineMap {
  id: string
  user_id: string
  area_name: string
  province_code: string | null
  bounds: object
  zoom_min: number
  zoom_max: number
  status: 'pending' | 'ready' | 'error'
  file_size_mb: number | null
  created_at: string
}

export interface OfflineMapDownloadBody {
  area_name: string
  province_code?: string
  bounds: object
  zoom_min?: number
  zoom_max?: number
}

// TODO: Admin UI for offline maps not yet implemented — service available per Postman

export default {
  /** POST /offline/download */
  download: (data: OfflineMapDownloadBody) =>
    apiClient.post<ApiResponse<OfflineMap>>(serviceOfflineMapPath + '/download', data),

  /** GET /offline */
  getAll: () =>
    apiClient.get<ApiResponse<OfflineMap[]>>(serviceOfflineMapPath),

  /** GET /offline/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<OfflineMap>>(`${serviceOfflineMapPath}/${id}`),

  /** DELETE /offline/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceOfflineMapPath}/${id}`),
}
