export interface Culinary {
  id: string
  name: string
  category: string | null
  description: string | null
  recipe: string | null
  cover_image_url: string | null
  media_urls: string[]
  is_speciality: boolean
  rating_avg: string | null
  rating_count: number
  province_code: string | null
  province_name: string | null
  created_at: string
  updated_at?: string
}

export interface CulinaryListData {
  items: Culinary[]
  pagination: import('./index').Pagination
}

export interface CulinaryListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  is_speciality?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CulinaryFormBody {
  name: string
  category?: string
  description?: string
  recipe?: string
  cover_image_url?: string
  media_urls?: string[]
  is_speciality?: boolean
  province_code?: string
}
