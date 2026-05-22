import type { Pagination } from './index'

export type ArSessionType = 'navigation' | 'info_overlay' | 'heritage' | 'gaming'

export interface ArSession {
  id: string
  user_id: string | null
  ar_type: ArSessionType
  spot_id: string | null
  lng: number | null
  lat: number | null
  duration_sec: number | null
  qr_scanned: boolean
  spots_viewed: number
  device_os: string | null
  app_version: string | null
  created_at: string
}

export interface ArSessionListData {
  sessions: ArSession[]
  pagination: Pagination
}

export interface ArSessionListParams {
  page?: number
  limit?: number
  spot_id?: string
}

export interface ArSessionStats {
  spot_id: string | null
  total_sessions: number
  avg_duration_sec: number | null
  total_spots_viewed: number
}

export interface ArSessionCreateBody {
  ar_type: ArSessionType
  spot_id?: string
  lng?: number
  lat?: number
  duration_sec?: number
  qr_scanned?: boolean
  spots_viewed?: number
  device_os?: string
  app_version?: string
}
