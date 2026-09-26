import type { Pagination } from './index'

// Embedded layer object returned inside scenario response (camelCase from layer serializer)
export interface FloodScenarioLayer {
  id: string
  code: string
  nameVi: string
  category: string
  categoryName: string
  geometryType: string
  storageKind: string
  geoserverLayer: string
  styleName: string | null
  minZoom: number
  maxZoom: number
  legend: Record<string, any> | null
  isPublic: boolean
  isEnableDefault: boolean
}

// API response uses snake_case for scenario fields, numbers are returned as strings from PG NUMERIC
export interface FloodScenario {
  id: number
  code: string
  name_vi: string
  min_rainfall: string        // PG NUMERIC → string
  max_rainfall: string | null
  min_tide: string | null
  max_tide: string | null
  layer_code: string
  description: string | null
  is_active: boolean
  current_rainfall: string | null
  rainfall_source: 'MANUAL' | 'AUTO'
  current_tide: string | null
  tide_source: 'MANUAL' | 'AUTO'
  created_at: string
  updated_at: string
  layer?: FloodScenarioLayer
}

export interface FloodScenarioListData {
  items: FloodScenario[]
}

export interface FloodScenarioListParams {
  page?: number
  limit?: number
  search?: string
  activeOnly?: boolean
}

// Request body uses camelCase (Joi validator accepts camelCase)
export interface FloodScenarioFormBody {
  code: string
  nameVi: string
  minRainfall?: number
  maxRainfall?: number | null
  minTide?: number | null
  maxTide?: number | null
  layerCode: string
  description?: string | null
  isActive?: boolean
  currentRainfall?: number | null
  rainfallSource?: 'MANUAL' | 'AUTO'
  currentTide?: number | null
  tideSource?: 'MANUAL' | 'AUTO'
}

export interface FloodScenarioMetadata {
  pagination: Pagination
}
