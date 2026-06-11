export type SpotStatus = 'active' | 'inactive' | 'pending' | 'closed'

export interface Spot {
  id: string
  name_vi: string
  name_en: string | null
  slug: string
  description_vi: string | null
  description_en: string | null
  category_id: number | null
  province_code: string | null
  ward_code: string | null
  address_vi: string | null
  address_en: string | null
  latitude: number | null
  longitude: number | null
  altitude_m: number | null
  opening_hours: Record<string, string> | null
  ticket_price_adult: number | string | null
  ticket_price_child: number | string | null
  ticket_currency: string | null
  phone: string | null
  email: string | null
  website: string | null
  max_capacity: number | null
  alert_threshold_pct: number | null
  rating_avg: number | string | null
  rating_count: number
  has_vr_360: boolean
  has_ar_support: boolean
  has_audio_guide: boolean
  qr_code_url: string | null
  status: SpotStatus
  is_featured: boolean
  primary_image?: string | null
  primary_image_url?: string | null
  created_at?: string
  updated_at?: string

  // Localized / joined fields returned by list & detail APIs (not present in create/update body)
  name?: string | null
  description?: string | null
  address?: string | null
  geojson?: { type: string; coordinates: number[] } | null
  category_name?: string | null
  category_parent_id?: number | null
  category_icon?: string | null
  category_parent_name?: string | null
  province_name?: string | null
  commune_name?: string | null
  created_by?: string | null
  current_visitor_count?: number | null
  current_capacity_pct?: number | null
  capacity_recorded_at?: string | null
}

export interface SpotListData {
  spots: Spot[]
  pagination: import('./index').Pagination
}

export interface SpotListParams {
  page?: number
  limit?: number
  search?: string
  category_id?: number
  province_code?: string
  district_id?: number
  status?: SpotStatus
  is_featured?: boolean
  rating_min?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  lang?: string
  capacity?: boolean
  has_vr?: boolean
}

export interface SpotFormBody {
  name_vi: string
  name_en?: string
  slug?: string
  description_vi?: string
  description_en?: string
  category_id?: number | null
  province_code?: string | null
  ward_code?: string | null
  address_vi?: string
  address_en?: string
  latitude?: number
  longitude?: number
  altitude_m?: number
  opening_hours?: Record<string, string>
  ticket_price_adult?: number
  ticket_price_child?: number
  ticket_currency?: string
  phone?: string
  email?: string
  website?: string
  max_capacity?: number
  alert_threshold_pct?: number
  has_vr_360?: boolean
  has_ar_support?: boolean
  has_audio_guide?: boolean
  status?: SpotStatus
  is_featured?: boolean
}
