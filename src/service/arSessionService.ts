import apiClient from './common/apiClient'
import type {
  ApiResponse,
  ArSession,
  ArSessionListData,
  ArSessionListParams,
  ArSessionStats,
  ArSessionCreateBody,
} from '@/types/api'
import { serviceArSessionPath } from '@/constant/serviceConstant'

// TODO: Admin UI for AR sessions not yet implemented — service available per Postman

export default {
  /** GET /ar-sessions/my */
  getMy: (params?: ArSessionListParams) =>
    apiClient.get<ApiResponse<ArSessionListData>>(`${serviceArSessionPath}/my`, params),

  /** GET /ar-sessions/stats */
  getStats: (params?: { spot_id?: string }) =>
    apiClient.get<ApiResponse<ArSessionStats>>(`${serviceArSessionPath}/stats`, params),

  /** GET /ar-sessions/spots/:spotId */
  getBySpot: (spotId: string) =>
    apiClient.get<ApiResponse<ArSessionListData>>(`${serviceArSessionPath}/spots/${spotId}`),

  /** GET /ar-sessions/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<ArSession>>(`${serviceArSessionPath}/${id}`),

  /** POST /ar-sessions */
  create: (data: ArSessionCreateBody) =>
    apiClient.post<ApiResponse<ArSession>>(serviceArSessionPath, data),
}
