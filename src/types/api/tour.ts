import type { Pagination } from './index'

export type TourStatus = 'draft' | 'active' | 'inactive' | 'archived' | 'published'

export interface TourStop {
  id: string
  tour_id?: string
  day_number: number
  stop_order: number
  spot_id: string | null
  business_id?: string | null
  title_vi: string | null
  description_vi: string | null
  planned_duration_min: number | null
  geom?: { type: string; coordinates: [number, number] } | null
  lng?: number | null
  lat?: number | null
  created_at?: string
  updated_at?: string
}

export interface Tour {
  id: string
  name: string
  slug: string
  province_code: string | null
  province_name: string
  description_vi: string | null
  duration_days: number
  price_from_vnd: string | null
  max_guests: number | null
  includes: string[] | null
  excludes: string[] | null
  start_location_vi: string | null
  end_location_vi: string | null
  cover_image_url: string | null
  rating_avg: string | null
  rating_count: number
  status: TourStatus
  is_featured: boolean
  business_id: string | null
  business_name: string | null
  published_at: string | null
  stops?: TourStop[]
  created_at: string
  updated_at: string
}

export interface TourListData {
  tours: Tour[]
  pagination: Pagination
}

export interface TourListParams {
  page?: number
  limit?: number
  search?: string
  status?: TourStatus
  province_code?: string
  is_featured?: boolean
  duration_days?: number
  price_min?: number
  price_max?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface TourFormBody {
  name: string
  slug: string
  province_code?: string
  description_vi?: string
  duration_days: number
  price_from_vnd?: number
  max_guests?: number
  includes?: string[]
  excludes?: string[]
  start_location_vi?: string
  end_location_vi?: string
  cover_image_url?: string
  status?: TourStatus
  is_featured?: boolean
}

export interface TourStopFormBody {
  day_number: number
  stop_order: number
  spot_id?: string | null
  title_vi?: string
  description_vi?: string
  planned_duration_min?: number
  lng?: number
  lat?: number
}
