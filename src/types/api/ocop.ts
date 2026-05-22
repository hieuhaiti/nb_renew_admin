export interface OcopProduct {
  id: string
  name: string
  category: string | null
  description: string | null
  star_rating: number | null
  certification_no: string | null
  cover_image_url: string | null
  media_urls: string[]
  price_vnd: string | null
  unit: string | null
  shop_url: string | null
  producer_name: string | null
  province_code: string | null
  province_name: string | null
  business_id: string | null
  business_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  certified_at: string | null
  lat: number | null
  lng: number | null
}

export interface OcopListData {
  items: OcopProduct[]
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
  name: string
  category?: string
  description?: string
  star_rating?: number
  certification_no?: string
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
