export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected' | 'closed'
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'

export interface FeedbackAttachment {
  id: number
  file_name: string
  file_path: string
  file_url: string
  mime_type: string
  file_size: number | null
  uploaded_at: string
}

export interface CitizenFeedback {
  id: number
  user_id?: string | null
  title: string
  content: string
  latitude?: number | null
  longitude?: number | null
  location_text?: string | null
  priority: FeedbackPriority
  status: FeedbackStatus
  moderation_status: ModerationStatus
  is_location_verified: boolean
  location_verified_at?: string | null
  admin_response?: string
  resolution_note?: string
  forest_loss_area_estimate_m2?: number
  images?: string[]
  created_at: string
  updated_at: string
  user?: {
    id: string
    full_name: string | null
    email?: string
    avatar_url?: string
  }
  attachments?: FeedbackAttachment[]
}

export interface CitizenFeedbackListData {
  feedbacks: CitizenFeedback[]
  pagination: import('./index').Pagination
}

export interface UpdateFeedbackStatusBody {
  status: FeedbackStatus
  is_location_verified?: boolean
  admin_response?: string
  resolution_note?: string
}

export interface UpdateModerationBody {
  moderation_status: ModerationStatus
  admin_response?: string
}

export interface FeedbackListParams {
  page?: number
  limit?: number
  search?: string
  status?: FeedbackStatus
  moderation_status?: ModerationStatus
  priority?: FeedbackPriority
  user_id?: string
  start_date?: string
  end_date?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
