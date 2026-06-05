// ─── Admin ────────────────────────────────────────────────────────────────────

export interface GovernanceAdminDashboard {
  total_users?: number
  active_users?: number
  total_news?: number
  total_map_categories?: number
  total_map_layers?: number
  total_map_apis?: number
  total_permissions?: number
  audit_logs_in_range?: number
  visits_in_range?: number
  total_cuisine_items?: number
  total_festivals?: number
  total_ocop_products?: number
  [key: string]: any
}

export interface GovernanceTrafficAction {
  action: string
  count: string | number
}

export interface GovernanceTrafficTimelineItem {
  period: string
  visits: number
  unique_visitors: number
}

export interface GovernanceTrafficData {
  total_visits?: number
  unique_visitors?: number
  avg_duration_seconds?: number
  bounce_rate_pct?: number
  timeline?: GovernanceTrafficTimelineItem[]
  /** Legacy fields — may be absent depending on API version */
  time_series?: Record<string, unknown>[]
  top_sources?: Record<string, unknown>[]
  top_actions?: GovernanceTrafficAction[]
}

export interface GovernancePermission {
  id: number
  resource: string
  action: string
  name_vi: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface GovernancePermissionListData {
  permissions?: GovernancePermission[]
  items?: GovernancePermission[]
  data?: GovernancePermission[]
  pagination?: import('./index').Pagination
}

export interface GovernancePermissionCreateBody {
  resource: string
  action: string
  name_vi: string
  description?: string
}

export interface GovernanceRolePermissionsData {
  role_id?: number
  permissions?: GovernancePermission[]
  items?: GovernancePermission[]
}

// ─── Ministry ─────────────────────────────────────────────────────────────────

export interface GovernanceMinistryAggregate {
  total_spots?: number
  total_service_units?: number
  new_businesses?: number
  reported_revenue_vnd?: number
}

export interface GovernanceMinistryProvince {
  province_code?: string
  province_name?: string
  spot_count?: number | string
  service_unit_count?: number | string
  new_business_count?: number | string
  reported_revenue_vnd?: number | string
}

export interface GovernanceMinistryOverview {
  period?: { fromDate?: string; toDate?: string }
  aggregate?: GovernanceMinistryAggregate
  provinces?: GovernanceMinistryProvince[]
  overload_alerts?: { total: number; items: GovernanceCapacityAlert[] }
  conservation_monitoring?: { total: number; items: GovernanceConservationItem[] }
  [key: string]: any
}

export interface GovernanceCapacityAlert {
  spot_id?: string
  name_vi?: string
  province_code?: string
  province_name?: string
  status?: string
  visitor_count?: number
  max_capacity?: number
  capacity_pct?: number
  recorded_at?: string
  [key: string]: any
}

export interface GovernanceConservationItem {
  conservation_id?: string
  conservation_name?: string
  province_name?: string
  detected_changes?: number
  total_change_area_ha?: number
  latest_analyzed_at?: string
  [key: string]: any
}

export interface GovernanceConservationSummary {
  total?: number
  items?: GovernanceConservationItem[]
  [key: string]: any
}

// ─── Department ───────────────────────────────────────────────────────────────

export interface GovernanceDeptBusinessReg {
  id: string
  name?: string
  owner_name?: string
  email?: string
  phone?: string
  address?: string
  status?: string
  rejection_note?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface GovernanceDeptSpotReg {
  id: string
  name?: string
  category?: string
  address?: string
  status?: string
  owner_name?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

export interface GovernanceDeptFeedback {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: string
  moderation_status?: string
  created_at?: string
  [key: string]: any
}

export interface GovernanceDeptReport {
  id: string
  title: string
  report_type?: string
  period_from?: string
  period_to?: string
  file_url?: string
  file_format?: string
  sent_to_roles?: number[]
  status?: string
  created_at?: string
  updated_at?: string
}

export interface GovernanceDeptReportCreateBody {
  report_type: string
  period_from: string
  period_to: string
  title: string
  file_url?: string
  file_format?: string
  file_size_kb?: number
  sent_to_roles?: number[]
}

export interface GovernanceDeptReportSendBody {
  target_roles?: number[]
  title_vi?: string
  body_vi?: string
}

// ─── Enterprise ───────────────────────────────────────────────────────────────

export interface GovernanceEnterpriseReport {
  id: string
  business_id?: string
  business_name?: string
  report_period?: string
  period_from?: string
  period_to?: string
  total_revenue_vnd?: number | string
  total_bookings?: number | string
  total_visitors?: number | string
  avg_capacity_pct?: number | string
  notes?: string
  status?: string
  submitted_by?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at?: string
  updated_at?: string
}

export interface GovernanceEnterpriseReportCreateBody {
  business_id: string
  report_period: string
  period_from: string
  period_to: string
  total_revenue_vnd?: number
  total_bookings?: number
  total_visitors?: number
  avg_capacity_pct?: number
  notes?: string
  status?: string
}

export interface GovernanceEnterpriseDashboard {
  business_id?: string
  total_visitors?: number
  total_revenue_vnd?: number
  avg_rating?: number
  total_bookings?: number
  capacity_pct?: number
  period?:
    | string
    | {
        type?: string
        year?: number
        from?: string
        to?: string
      }
  business?: Record<string, unknown>
  summary?: {
    total_revenue_vnd?: number | string
    total_bookings?: number | string
    total_visitors?: number | string
    avg_capacity_pct?: number | string
    report_count?: number | string
  }
  revenue_trend?: Array<{
    period?: string
    revenue_vnd?: number | string
    bookings?: number | string
    visitors?: number | string
  }>
  capacity_alerts?: Array<{
    spot_id?: string
    name_vi?: string
    capacity_pct?: number | string
    status?: string
    recorded_at?: string
  }>
  [key: string]: unknown
}

export interface GovernanceEnterpriseFeedback {
  id: string
  title?: string
  content?: string
  description?: string
  status?: string
  priority?: string
  moderation_status?: string
  distance_km?: number
  location_text?: string
  is_location_verified?: boolean
  responded_at?: string | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}
