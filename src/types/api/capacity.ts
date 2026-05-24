import type { Pagination } from './index'

export type CapacityStatus = 'normal' | 'busy' | 'near_full' | 'overloaded' | 'closed' | 'moderate'

export interface CapacityState {
  spot_id: string
  name_vi?: string | null
  visitor_count: number | null
  max_capacity: number | null
  capacity_pct: string | null
  status: CapacityStatus | null
  recorded_at: string | null
  alert_threshold_pct: number | null
}

export interface CapacityCurrentData {
  capacity: CapacityState[]
}

export interface CapacityGeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: CapacityState & {
    name_vi?: string
    name_en?: string | null
  }
}

export interface CapacityGeoJSON {
  type: 'FeatureCollection'
  features: CapacityGeoJSONFeature[]
}

export interface CapacityHistoryEntry {
  id: string
  spot_id: string
  visitor_count: number | null
  capacity_pct: string | null
  status: CapacityStatus | null
  data_source: string | null
  recorded_at: string
}

export interface CapacityHistoryData {
  logs: CapacityHistoryEntry[]
  pagination: Pagination
}

export interface CapacityStatsPeriod {
  period: string
  avg_visitors: number
  max_visitors: number
  avg_capacity_pct: string
  max_capacity_pct: string
  record_count: string
}

export interface CapacityStatsData {
  stats: CapacityStatsPeriod[]
}

export interface CapacityAlternative {
  id: string
  name_vi: string
  address_vi: string | null
  max_capacity: number | null
  rating_avg: string | null
  ticket_price_adult: string | null
  distance_km: string | null
  visitor_count: number | null
  capacity_pct: string | null
  capacity_status: CapacityStatus | null
  geojson: { type: string; coordinates: [number, number] } | null
}

export interface CapacityAlternativesData {
  alternatives: CapacityAlternative[]
  total: number
}

export interface CapacityConfig {
  id: number
  spot_id: string
  province_code: string | null
  threshold_busy: number
  threshold_near: number
  threshold_over: number
  notify_roles: string[] | null
  is_active: boolean
  updated_by: string
  updated_at: string
}

export interface CapacityConfigsData {
  configs: CapacityConfig[]
}

export interface CapacityLogBody {
  visitor_count: number
  max_capacity?: number
  data_source?: string
}

export interface CapacitySettingsBody {
  max_capacity: number
  alert_threshold_pct: number
}

export interface CapacityConfigBody {
  spot_id: string
  threshold_busy: number
  threshold_near: number
  threshold_over: number
}

// Realtime event payloads from SSE / WebSocket
export interface CapacityUpdatePayload {
  type: 'capacity_update'
  spot_id: string
  visitor_count: number
  capacity_pct: string
  status: CapacityStatus
  recorded_at: string
}

export interface CapacityAlertPayload {
  type: 'capacity_alert'
  spot_id: string
  status: 'near_full' | 'overloaded'
  capacity_pct: string
  visitor_count: number
  recorded_at: string
}

export type CapacityRealtimePayload = CapacityUpdatePayload | CapacityAlertPayload

export interface CapacitySSEMessage {
  event: string
  data: CapacityRealtimePayload
  timestamp: string
}

export interface CapacityWSMessage {
  event: 'capacity_update' | 'capacity_alert'
  data: CapacityRealtimePayload
  timestamp: string
}
