export interface MapAdminCategory {
  id: number
  code?: string
  name?: string
  name_vi?: string
  name_en?: string | null
  description?: string | null
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at?: string
}

export interface MapAdminCategoryListData {
  items?: MapAdminCategory[]
  categories?: MapAdminCategory[]
  pagination: import('./index').Pagination
}

export interface MapAdminCategoryListParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
