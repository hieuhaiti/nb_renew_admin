export interface SpotCategory {
  id: number
  code: string
  name_vi: string
  name_en: string | null
  parent_id: number | null
  parent_name_vi: string | null
  icon_url: string | null
  color_hex: string | null
  sort_order: number
  is_active: boolean
  spot_count?: number
  created_at?: string
  updated_at?: string
}

export interface SpotCategoryTree extends SpotCategory {
  children: SpotCategoryTree[]
}

export interface SpotCategoryListData {
  items: SpotCategory[]
  pagination: import('./index').Pagination
}

export interface SpotCategoryListParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
  parent_id?: number | null
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface SpotCategoryFormBody {
  code?: string
  name_vi: string
  name_en?: string
  parent_id?: number | null
  icon_url?: string
  color_hex?: string
  sort_order?: number
  is_active?: boolean
}
