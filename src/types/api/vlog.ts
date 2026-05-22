export type VlogStatus = 'pending' | 'published' | 'rejected' | 'draft'

export interface Vlog {
  id: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image_url: string | null
  media_urls: string[]
  video_url: string | null
  video_duration_sec: number | null
  platform: string | null
  spot_id: string | null
  province_code: string | null
  latitude: number | null
  longitude: number | null
  status: VlogStatus
  rejection_note: string | null
  view_count: number
  like_count: number
  comment_count: number
  user_id: number | null
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

export interface VlogListData {
  vlogs: Vlog[]
  pagination: import('./index').Pagination
}

export interface VlogListParams {
  page?: number
  limit?: number
  search?: string
  platform?: string
  user_id?: string
  status?: VlogStatus
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface VlogModerationBody {
  status: 'published' | 'rejected'
  rejection_note?: string | null
}
