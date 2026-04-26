export interface OcopProduct {
  id: string
  name_vi: string
  name_en: string | null
  category: string | null
  description_vi: string | null
  star_rating: number | null
  certification_no: string | null
  certified_at: string | null
  cover_image_url: string | null
  media_urls: string[]
  price_vnd: number | null
  unit: string | null
  shop_url: string | null
  latitude: number | null
  longitude: number | null
  producer_name: string | null
  province_code: string | null
  business_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OcopListData {
  products: OcopProduct[]
  pagination: import('./index').Pagination
}

export interface OcopListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  star_rating?: number
  province_code?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface OcopFormBody {
  name_vi: string
  name_en?: string
  category?: string
  description_vi?: string
  star_rating?: number
  certification_no?: string
  certified_at?: string
  cover_image_url?: string
  media_urls?: string[]
  price_vnd?: number
  unit?: string
  shop_url?: string
  lng?: number
  lat?: number
  producer_name?: string
  province_code?: string
  business_id?: string | null
  is_active?: boolean
}
