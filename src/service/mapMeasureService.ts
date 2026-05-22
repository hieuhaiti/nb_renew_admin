import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceMapMeasurePath } from '@/constant/serviceConstant'

export interface MapMeasureBody {
  coordinates: number[][]
  unit?: 'km' | 'm' | 'miles'
}

export interface MapMeasureResult {
  value: number
  unit: string
}

// TODO: Admin UI for map measurement not yet implemented — service available per Postman

export default {
  /** POST /map/measure/distance */
  measureDistance: (data: MapMeasureBody) =>
    apiClient.post<ApiResponse<MapMeasureResult>>(`${serviceMapMeasurePath}/distance`, data),

  /** POST /map/measure/area */
  measureArea: (data: MapMeasureBody) =>
    apiClient.post<ApiResponse<MapMeasureResult>>(`${serviceMapMeasurePath}/area`, data),
}
