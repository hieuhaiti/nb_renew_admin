import apiClient from './common/apiClient'
import type {
  ApiResponse,
  CapacityState,
  CapacityCurrentData,
  CapacityGeoJSON,
  CapacityHistoryData,
  CapacityStats,
  CapacityAlternative,
  CapacityConfig,
  CapacityLogBody,
  CapacitySettingsBody,
  CapacityConfigBody,
} from '@/types/api'
import { serviceCapacityPath } from '@/constant/serviceConstant'

export default {
  // ─── Snapshot (REST) ──────────────────────────────────────────────────────

  /** GET /capacity/current — all spots' current capacity */
  getCurrent: () =>
    apiClient.get<ApiResponse<CapacityCurrentData>>(`${serviceCapacityPath}/current`),

  /** GET /capacity/current/geojson — GeoJSON for map rendering */
  getCurrentGeoJSON: () =>
    apiClient.get<ApiResponse<CapacityGeoJSON>>(`${serviceCapacityPath}/current/geojson`),

  // ─── Per-spot operations ──────────────────────────────────────────────────

  /** GET /capacity/spots/:spotId/history */
  getHistory: (spotId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<CapacityHistoryData>>(
      `${serviceCapacityPath}/spots/${spotId}/history`, params
    ),

  /** GET /capacity/spots/:spotId/stats */
  getStats: (spotId: string) =>
    apiClient.get<ApiResponse<CapacityStats>>(`${serviceCapacityPath}/spots/${spotId}/stats`),

  /** GET /capacity/spots/:spotId/alternatives */
  getAlternatives: (spotId: string) =>
    apiClient.get<ApiResponse<CapacityAlternative[]>>(
      `${serviceCapacityPath}/spots/${spotId}/alternatives`
    ),

  /** PATCH /capacity/spots/:spotId/settings */
  updateSettings: (spotId: string, data: CapacitySettingsBody) =>
    apiClient.patch<ApiResponse<CapacityState>>(
      `${serviceCapacityPath}/spots/${spotId}/settings`, data
    ),

  /** POST /capacity/spots/:spotId/log — admin/manager logs visitor count */
  log: (spotId: string, data: CapacityLogBody) =>
    apiClient.post<ApiResponse<CapacityState>>(
      `${serviceCapacityPath}/spots/${spotId}/log`, data
    ),

  // ─── Alert configs ────────────────────────────────────────────────────────

  /** GET /capacity/configs */
  getConfigs: () =>
    apiClient.get<ApiResponse<CapacityConfig[]>>(`${serviceCapacityPath}/configs`),

  /** POST /capacity/configs */
  saveConfig: (data: CapacityConfigBody) =>
    apiClient.post<ApiResponse<CapacityConfig>>(`${serviceCapacityPath}/configs`, data),
}
