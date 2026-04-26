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
  ticket_price_adult: number | null
  ticket_price_child: number | null
  ticket_currency: string | null
  phone: string | null
  email: string | null
  website: string | null
  max_capacity: number | null
  alert_threshold_pct: number | null
  rating_avg: number | null
  rating_count: number
  has_vr_360: boolean
  has_ar_support: boolean
  has_audio_guide: boolean
  qr_code_url: string | null
  status: SpotStatus
  is_featured: boolean
  primary_image_url: string | null
  created_at: string
  updated_at: string
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
