import type { Pagination } from './index'

export type ItineraryStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled'

export interface ItineraryStop {
  id: number
  day_id: number
  sort_order: number
  spot_id: string | null
  custom_name: string | null
  planned_arrival: string | null
  planned_duration_min: number | null
  notes: string | null
  lng: number | null
  lat: number | null
  created_at: string
  updated_at: string
}

export interface ItineraryDay {
  id: number
  itinerary_id: number
  day_number: number
  title: string | null
  date_actual: string | null
  notes: string | null
  stops?: ItineraryStop[]
  created_at: string
  updated_at: string
}

export interface Itinerary {
  id: number
  user_id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  budget_vnd: number | null
  is_public: boolean
  status: ItineraryStatus
  share_token: string | null
  days?: ItineraryDay[]
  created_at: string
  updated_at: string
}

export interface ItineraryListData {
  itineraries: Itinerary[]
  pagination: Pagination
}

export interface ItineraryListParams {
  page?: number
  limit?: number
  status?: ItineraryStatus
}

export interface ItineraryFormBody {
  title: string
  description?: string
  start_date?: string
  end_date?: string
  budget_vnd?: number
  is_public?: boolean
  status?: ItineraryStatus
}

export interface ItineraryDayFormBody {
  day_number: number
  title?: string
  date_actual?: string
  notes?: string
}

export interface ItineraryStopFormBody {
  sort_order: number
  spot_id?: string | null
  custom_name?: string
  planned_arrival?: string
  planned_duration_min?: number
  notes?: string
  lng?: number
  lat?: number
}

export interface AIItineraryGenerateBody {
  num_days: number
  preferences?: string[]
  budget_vnd?: number
  start_location?: string
  language?: string
}
