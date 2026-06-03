/** Server Joi: valid('polygon','line','point') — client must map GeoJSON types before sending */
export type GeometryType = 'point' | 'line' | 'polygon'

export interface MapLayer {
  id: number
  category_id: number
  category_name?: string
  code?: string
  name?: string
  name_vi?: string
  name_en?: string | null
  layer_type?: string
  source_url?: string
  style_json?: Record<string, any>
  min_zoom?: number | null
  max_zoom?: number | null
  is_default_visible?: boolean
  sort_order?: number
  status?: 'active' | 'inactive'
  geometry_type?: GeometryType
  geometry_data?: object | string
  properties?: Record<string, any>
  is_active?: boolean
  is_lost_forest?: boolean
  created_by?: number | string
  created_at: string
  updated_at: string
}

export interface MapLayerListData {
  items?: MapLayer[]
  mapLayers?: MapLayer[]
  pagination: import('./index').Pagination
}

export interface CreateMapLayerBody {
  category_id: number
  name: string
  /** Required by server; map GeoJSON types: LineString→line, Polygon→polygon, Point→point */
  geometry_type: GeometryType
  /** Required by server; pass object (JSON body) or stringified JSON (multipart) */
  geometry_data: object | string
  properties?: Record<string, any>
  is_active?: boolean
}

export interface CalculateLostAreaBody {
  points: Array<{ latitude: number; longitude: number }>
  auto_close_polygon?: boolean
}

export interface CalculateLostAreaResult {
  area_m2: number
  area_ha: number
  perimeter_m?: number
}

export interface MapLayerListParams {
  page?: number
  limit?: number
  is_active?: boolean
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  category_id?: number
  status?: 'active' | 'inactive' | string
  layer_type?: string
  geometry_type?: string
  slug?: string
}
