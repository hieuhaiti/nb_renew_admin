import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'
import { serviceGovernancePath } from '@/constant/serviceConstant'

export default {
  /** GET /governance/admin/dashboard */
  getDashboard: () =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/dashboard`),

  /** GET /governance/admin/traffic */
  getTraffic: (params?: { days?: number; group_by?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/traffic`, params),

  /** GET /governance/ministry/overview */
  getMinistryOverview: (params?: { from_date?: string; to_date?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/ministry/overview`, params),

  /** GET /governance/ministry/capacity-alerts */
  getMinistryCapacityAlerts: (params?: { province_code?: string; statuses?: string; limit?: number }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/ministry/capacity-alerts`, params),

  /** GET /governance/department/registrations/businesses */
  getDepartmentBusinessRegistrations: (params?: { page?: number; limit?: number; status?: string; province_code?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/registrations/businesses`, params),

  /** GET /governance/department/feedbacks */
  getDepartmentFeedbacks: (params?: Record<string, any>) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/department/feedbacks`, params),

  /** GET /governance/admin/permissions */
  getPermissions: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/permissions`, params),

  /** GET /governance/admin/roles/:roleId/permissions */
  getRolePermissions: (roleId: number) =>
    apiClient.get<ApiResponse<any>>(`${serviceGovernancePath}/admin/roles/${roleId}/permissions`),

  /** PUT /governance/admin/roles/:roleId/permissions */
  setRolePermissions: (roleId: number, data: { permission_ids: number[] }) =>
    apiClient.put<ApiResponse<any>>(
      `${serviceGovernancePath}/admin/roles/${roleId}/permissions`,
      data
    ),
}
