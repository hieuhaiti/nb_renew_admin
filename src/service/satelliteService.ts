import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceSatellitePath } from '@/constant/serviceConstant'

export interface SatelliteBaseBody {
  geometry: object
  startDate: string
  endDate: string
  collection?: string
  cloudCover?: number
}

export interface SatelliteNDVIBody extends SatelliteBaseBody {
  ndviMinThresh?: number
}

export interface SatelliteCompareBody {
  geometry: object
  startDate1: string
  endDate1: string
  startDate2: string
  endDate2: string
  collection?: string
  cloudCover?: number
}

export interface SatelliteImageResult {
  url: string
  bounds?: number[]
  metadata?: Record<string, unknown>
}

// TODO: Admin UI for satellite imagery not yet fully implemented — service available per Postman

export default {
  /** POST /satellite/rgb */
  getRGB: (data: SatelliteBaseBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/rgb`, data),

  /** POST /satellite/ndvi */
  getNDVI: (data: SatelliteNDVIBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/ndvi`, data),

  /** POST /satellite/heat-map */
  getHeatMap: (data: SatelliteBaseBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/heat-map`, data),

  /** POST /satellite/classified */
  getClassified: (data: SatelliteBaseBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/classified`, data),

  /** POST /satellite/compare */
  compare: (data: SatelliteCompareBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/compare`, data),

  /** POST /satellite/change */
  detectChange: (data: SatelliteCompareBody) =>
    apiClient.post<ApiResponse<SatelliteImageResult>>(`${serviceSatellitePath}/change`, data),
}
