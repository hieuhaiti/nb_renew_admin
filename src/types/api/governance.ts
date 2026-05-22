// ─── Admin ────────────────────────────────────────────────────────────────────

export interface GovernanceAdminDashboard {
  total_users?: number
  active_users?: number
  new_users_today?: number
  total_spots?: number
  total_businesses?: number
  pending_businesses?: number
  total_feedbacks?: number
  pending_feedbacks?: number
  total_roles?: number
  [key: string]: any
}

export interface GovernanceTrafficItem {
  date?: string
  day?: string
  week?: string
  month?: string
  visitors?: number
  sessions?: number
  pageviews?: number
  [key: string]: any
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
  report_period?: string
  period_from?: string
  period_to?: string
  total_revenue_vnd?: number
  total_bookings?: number
  total_visitors?: number
  avg_capacity_pct?: number
  notes?: string
  status?: string
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
  period?: string
  [key: string]: any
}

export interface GovernanceEnterpriseFeedback {
  id: string
  title?: string
  description?: string
  status?: string
  priority?: string
  distance_km?: number
  created_at?: string
  [key: string]: any
}
