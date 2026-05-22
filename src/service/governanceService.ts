import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceGovernancePath } from '@/constant/serviceConstant'

export default {
  // ─── Admin ────────────────────────────────────────────────────────────────

  /** GET /governance/admin/dashboard */
  getDashboard: () =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/dashboard`),

  /** GET /governance/admin/traffic */
  getTraffic: (params?: { days?: number; group_by?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/traffic`, params),

  /** GET /governance/admin/permissions */
  getPermissions: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/permissions`, params),

  /** POST /governance/admin/permissions */
  createPermission: (data: { resource: string; action: string; name_vi: string; description?: string }) =>
    apiClient.post<ApiResponse<any>>(`${serviceGovernancePath}/admin/permissions`, data),

  /** GET /governance/admin/roles/:roleId/permissions */
  getRolePermissions: (roleId: number) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/roles/${roleId}/permissions`),

  /** PUT /governance/admin/roles/:roleId/permissions */
  setRolePermissions: (roleId: number, data: { permission_ids: number[] }) =>
    apiClient.put<ApiResponse<any>>(
      `${serviceGovernancePath}/admin/roles/${roleId}/permissions`,
      data
    ),

  // ─── Ministry ─────────────────────────────────────────────────────────────

  /** GET /governance/ministry/overview */
  getMinistryOverview: (params?: { from_date?: string; to_date?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/ministry/overview`, params),

  /** GET /governance/ministry/capacity-alerts */
  getMinistryCapacityAlerts: (params?: { province_code?: string; statuses?: string; limit?: number }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/ministry/capacity-alerts`, params),

  /** GET /governance/ministry/conservation-summary */
  getMinistryConservationSummary: (params?: { province_code?: string; days?: number }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/ministry/conservation-summary`, params),

  // ─── Department ───────────────────────────────────────────────────────────

  /** GET /governance/department/registrations/businesses */
  getDepartmentBusinessRegistrations: (params?: { page?: number; limit?: number; status?: string; province_code?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/registrations/businesses`, params),

  /** GET /governance/department/registrations/spots */
  getDepartmentSpotRegistrations: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/registrations/spots`, params),

  /** PATCH /governance/department/registrations/businesses/:businessId */
  approveDepartmentBusiness: (businessId: string, data: { status: string; rejection_note?: string }) =>
    apiClient.patch<ApiResponse<any>>(
      `${serviceGovernancePath}/department/registrations/businesses/${businessId}`,
      data
    ),

  /** PATCH /governance/department/registrations/spots/:spotId */
  approveDepartmentSpot: (spotId: string, data: { status: string }) =>
    apiClient.patch<ApiResponse<any>>(
      `${serviceGovernancePath}/department/registrations/spots/${spotId}`,
      data
    ),

  /** GET /governance/department/feedbacks */
  getDepartmentFeedbacks: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/feedbacks`, params),

  /** GET /governance/department/capacity-alerts */
  getDepartmentCapacityAlerts: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/capacity-alerts`, params),

  /** GET /governance/department/conservation-summary */
  getDepartmentConservationSummary: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/conservation-summary`, params),

  /** POST /governance/department/reports */
  createDepartmentReport: (data: {
    report_type: string
    period_from: string
    period_to: string
    title: string
    file_url?: string
    file_format?: string
    file_size_kb?: number
    sent_to_roles?: number[]
  }) =>
    apiClient.post<ApiResponse<any>>(`${serviceGovernancePath}/department/reports`, data),

  /** GET /governance/department/reports */
  getDepartmentReports: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/reports`, params),

  /** POST /governance/department/reports/:reportId/send */
  sendDepartmentReport: (reportId: string, data: { target_roles?: number[]; title_vi?: string; body_vi?: string }) =>
    apiClient.post<ApiResponse<any>>(`${serviceGovernancePath}/department/reports/${reportId}/send`, data),

  // ─── Enterprise ───────────────────────────────────────────────────────────

  /** POST /governance/enterprise/reports */
  createEnterpriseReport: (data: {
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
  }) =>
    apiClient.post<ApiResponse<any>>(`${serviceGovernancePath}/enterprise/reports`, data),

  /** GET /governance/enterprise/reports */
  getEnterpriseReports: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/enterprise/reports`, params),

  /** GET /governance/enterprise/businesses/:businessId/dashboard */
  getEnterpriseDashboard: (businessId: string, params?: { period?: string; year?: number }) =>
    apiClient.get<ApiResponse<any>>(
      `${serviceGovernancePath}/enterprise/businesses/${businessId}/dashboard`,
      params
    ),

  /** PATCH /governance/enterprise/businesses/:businessId */
  updateEnterpriseBusiness: (businessId: string, data: Record<string, any>) =>
    apiClient.patch<ApiResponse<any>>(
      `${serviceGovernancePath}/enterprise/businesses/${businessId}`,
      data
    ),

  /** GET /governance/enterprise/businesses/:businessId/feedbacks */
  getEnterpriseFeedbacks: (businessId: string, params?: { page?: number; limit?: number; radius_km?: number }) =>
    apiClient.get<ApiResponse<any>>(
      `${serviceGovernancePath}/enterprise/businesses/${businessId}/feedbacks`,
      params
    ),
}
