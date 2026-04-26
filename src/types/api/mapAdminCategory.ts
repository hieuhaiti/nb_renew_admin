export interface MapAdminCategory {
  id: number
  name: string
  description?: string | null
  icon_url?: string | null
  color?: string | null
  is_active: boolean
  sort_order?: number
  created_at: string
  updated_at: string
}

export interface MapAdminCategoryListData {
  categories: MapAdminCategory[]
  pagination: import('./index').Pagination
}

export interface MapAdminCategoryListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
