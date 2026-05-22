import apiClient from './common/apiClient'
import type { ApiResponse, GpsTrack, GpsStartBody, GpsSyncBody, GpsEndBody } from '@/types/api'
import { serviceGpsPath } from '@/constant/serviceConstant'

// TODO: Admin UI for GPS tracking not yet implemented — service available per Postman

export default {
  /** POST /gps/start */
  start: (data: GpsStartBody) =>
    apiClient.post<ApiResponse<GpsTrack>>(serviceGpsPath + '/start', data),

  /** POST /gps/:trackId/sync */
  sync: (trackId: string, data: GpsSyncBody) =>
    apiClient.post<ApiResponse<GpsTrack>>(`${serviceGpsPath}/${trackId}/sync`, data),

  /** PATCH /gps/:trackId/end */
  end: (trackId: string, data?: GpsEndBody) =>
    apiClient.patch<ApiResponse<GpsTrack>>(`${serviceGpsPath}/${trackId}/end`, data ?? {}),
}
