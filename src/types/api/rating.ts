export type RatingStatus = 'pending' | 'published' | 'rejected'

export interface Rating {
  id: string
  spot_id: string | null
  business_id: string | null
  user_id: number | null
  stars: number
  title: string | null
  content: string | null
  pros: string | null
  cons: string | null
  visit_date: string | null
  photo_urls: string[]
  status: RatingStatus
  helpful_count: number
  reply_text: string | null
  replied_at: string | null
  replied_by: string | null
  created_at: string
  updated_at: string
  user?: {
    id: string | number
    full_name: string | null
    username?: string | null
    email?: string | null
    email_registered?: string | null
    avatar_url?: string | null
  }
}

export interface RatingListData {
  ratings: Rating[]
  pagination: import('./index').Pagination
}

export interface RatingListParams {
  page?: number
  limit?: number
  spot_id?: string
  business_id?: string
  status?: RatingStatus
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface RatingModerationBody {
  status: RatingStatus
}

export interface RatingReplyBody {
  reply_text: string
}
