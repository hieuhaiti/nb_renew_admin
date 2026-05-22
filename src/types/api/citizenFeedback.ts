export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed' | 'rejected'
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'critical'
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
  id: string
  user_id?: string | null
  title: string
  content: string
  latitude?: number | null
  longitude?: number | null
  location_text?: string | null
  location_coordinates?: string | null
  priority: FeedbackPriority
  status: FeedbackStatus
  moderation_status: ModerationStatus
  is_location_verified: boolean
  location_verified_at?: string | null
  admin_response?: string | null
  resolution_note?: string | null
  forest_loss_area_estimate_m2?: number | null
  images?: string[]
  user_name?: string | null
  user_avatar?: string | null
  created_at: string
  updated_at: string
  responded_at?: string | null
  responder?: {
    id: string
    full_name?: string | null
    username?: string | null
    email?: string | null
  } | null
  user?: {
    id: string
    full_name: string | null
    username?: string | null
    email?: string | null
    email_registered?: string | null
    avatar_url?: string | null
  } | null
  attachments?: FeedbackAttachment[]
}

export interface CitizenFeedbackListData {
  items: CitizenFeedback[]
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
