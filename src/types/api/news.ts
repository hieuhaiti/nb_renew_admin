export interface News {
  id: string
  title: string
  slug: string
  summary: string | null
  content: string
  thumbnail_url: string | null
  author_name: string | null
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  tags: string[]
  view_count: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface NewsData {
  news: News
}

export interface NewsListData {
  items: News[]
  pagination: import('./index').Pagination
}

export interface NewsListParams {
  page?: number
  limit?: number
  is_published?: boolean
  is_featured?: boolean
  search?: string
  tag?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface NewsFormBody {
  title: string
  slug?: string
  author_name?: string
  summary?: string
  content: string
  thumbnail_url?: string
  is_published?: boolean
  is_featured?: boolean
  published_at?: string
  tags?: string[]
}
