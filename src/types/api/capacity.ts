import type { Pagination } from './index'

export type CapacityStatus = 'normal' | 'busy' | 'near_full' | 'overloaded' | 'closed'

export interface CapacityState {
  spot_id: string
  visitor_count: number
  max_capacity: number | null
  capacity_pct: string
  status: CapacityStatus
  recorded_at: string | null
  alert_threshold_pct: number | null
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
  id: number
  spot_id: string
  visitor_count: number
  max_capacity: number | null
  capacity_pct: string
  status: CapacityStatus
  data_source: string | null
  recorded_at: string
}

export interface CapacityHistoryData {
  history: CapacityHistoryEntry[]
  pagination: Pagination
}

export interface CapacityStats {
  spot_id: string
  avg_capacity_pct: string
  max_visitor_count: number
  total_records: number
  peak_hour?: string | null
}

export interface CapacityAlternative {
  spot_id: string
  name_vi: string
  capacity_pct: string
  status: CapacityStatus
  distance_km?: number | null
}

export interface CapacityConfig {
  id: number
  spot_id: string
  max_capacity: number
  alert_threshold_pct: number
  created_at: string
  updated_at: string
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
  alert_threshold_pct: number
  max_capacity: number
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
