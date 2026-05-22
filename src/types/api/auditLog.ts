export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type?: string | null
  entity_id?: string | null
  old_value?: unknown | null
  new_value?: unknown | null
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: {
    email: string
    full_name: string
  } | null
}

export interface AuditLogListData {
  logs: AuditLog[]
  pagination: import('./index').Pagination
}

export interface AuditLogListParams {
  page?: number
  limit?: number
  user_id?: string
  from_date?: string
  to_date?: string
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface VisitorStatisticsOverview {
  total_visits: string | number
  unique_users: string | number
  unique_ips: string | number
  requests_by_method?: {
    post: string | number
    put: string | number
    delete: string | number
  }
  success_rate?: string | number
  avg_response_time: string | number
}

export interface VisitorStatisticsTimeSeries {
  period: string
  visits: string | number
  unique_users: string | number
  unique_ips: string | number
}

export interface VisitorStatisticsTopUser {
  username: string
  full_name: string
  visit_count: string | number
}

export interface VisitorStatistics {
  overview: VisitorStatisticsOverview
  time_series: VisitorStatisticsTimeSeries[]
  top_users?: VisitorStatisticsTopUser[]
  // Backward compatibility (older payloads)
  timeSeries?: VisitorStatisticsTimeSeries[]
  topUsers?: VisitorStatisticsTopUser[]
}

export interface VisitorStatsParams {
  from_date?: string
  to_date?: string
  group_by?: 'day' | 'week' | 'month'
}
