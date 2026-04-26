export interface Festival {
  id: string
  name_vi: string
  name_en: string | null
  festival_type: string | null
  description_vi: string | null
  start_date: string | null
  end_date: string | null
  is_recurring: boolean
  recurrence_rule: string | null
  latitude: number | null
  longitude: number | null
  cover_image_url: string | null
  website: string | null
  location_name: string | null
  province_code: string | null
  spot_id: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface FestivalListData {
  festivals: Festival[]
  pagination: import('./index').Pagination
}

export interface FestivalListParams {
  page?: number
  limit?: number
  search?: string
  festival_type?: string
  upcoming?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface FestivalFormBody {
  name_vi: string
  name_en?: string
  festival_type?: string
  description_vi?: string
  start_date?: string
  end_date?: string
  is_recurring?: boolean
  recurrence_rule?: string | null
  lng?: number
  lat?: number
  cover_image_url?: string
  website?: string
  location_name?: string
  province_code?: string
  spot_id?: string | null
  is_published?: boolean
}
