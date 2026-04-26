import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Business,
  BusinessListData,
  BusinessListParams,
  BusinessApprovalBody,
  BusinessFormBody,
} from '@/types/api'
import { serviceBusinessPath, serviceGovernancePath } from '@/constant/serviceConstant'

export default {
  /** GET /businesses (Admin — all) */
  getAll: (params?: BusinessListParams) =>
    apiClient.get<ApiResponse<BusinessListData>>(serviceBusinessPath, params),

  /** GET /businesses/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Business>>(`${serviceBusinessPath}/${id}`),

  /** PATCH /businesses/:id */
  update: (id: string, data: Partial<BusinessFormBody>) =>
    apiClient.patch<ApiResponse<Business>>(`${serviceBusinessPath}/${id}`, data),

  /** DELETE /businesses/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceBusinessPath}/${id}`),

  /** PATCH /governance/department/registrations/businesses/:id (approve/reject) */
  setApproval: (id: string, data: BusinessApprovalBody) =>
    apiClient.patch<ApiResponse<Business>>(
      `${serviceGovernancePath}/department/registrations/businesses/${id}`,
      data
    ),
}
