export interface Culinary {
  id: string
  name_vi: string
  name_en: string | null
  category: string | null
  description_vi: string | null
  recipe_vi: string | null
  cover_image_url: string | null
  media_urls: string[]
  is_speciality: boolean
  province_code: string | null
  created_at: string
  updated_at: string
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
  name_vi: string
  name_en?: string
  category?: string
  description_vi?: string
  recipe_vi?: string
  cover_image_url?: string
  media_urls?: string[]
  is_speciality?: boolean
  province_code?: string
}
