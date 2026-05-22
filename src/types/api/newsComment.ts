export interface NewsComment {
  id: string
  news_id: string
  user_id: number | null
  user?: {
    id: string | number
    full_name: string | null
    username?: string | null
    email?: string | null
    email_registered?: string | null
    avatar_url?: string | null
  } | null
  content: string
  user_name?: string
  user_email?: string
  is_approved: boolean
  parent_comment_id?: string | null
  replies?: NewsComment[]
  created_at: string
  updated_at?: string
}

export interface NewsCommentListData {
  comments: NewsComment[]
  pagination: import('./index').Pagination
}

export interface NewsCommentListParams {
  page?: number
  limit?: number
  is_approved?: boolean
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
