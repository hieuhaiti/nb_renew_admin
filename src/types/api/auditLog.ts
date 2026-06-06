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
  total_actions: string | number
  unique_users: string | number
  unique_ips: string | number
  entity_types_affected: string | number
}

export interface VisitorStatisticsTimeSeries {
  period: string
  actions: string | number
  unique_users: string | number
}

export interface VisitorStatisticsTopAction {
  action: string
  entity_type: string | null
  count: string | number
}

export interface VisitorStatistics {
  overview: VisitorStatisticsOverview
  time_series: VisitorStatisticsTimeSeries[]
  top_actions: VisitorStatisticsTopAction[]
}

export interface VisitorStatsParams {
  from_date?: string
  to_date?: string
  group_by?: 'day' | 'week' | 'month'
}
