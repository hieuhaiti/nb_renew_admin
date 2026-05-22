export interface GpsPoint {
  lat: number
  lng: number
  altitude_m?: number | null
  speed_kmh?: number | null
  accuracy_m?: number | null
  battery_pct?: number | null
  recorded_at: string
}

export interface GpsTrack {
  id: string
  user_id: string
  track_type: string
  is_active: boolean
  total_distance_m: number | null
  started_at: string
  ended_at: string | null
}

export interface GpsStartBody {
  track_type: string
}

export interface GpsSyncBody {
  points: GpsPoint[]
}

export interface GpsEndBody {
  total_distance_m?: number
  geom_line?: object
}
