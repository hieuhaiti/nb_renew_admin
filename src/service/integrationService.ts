import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Integration,
  IntegrationListData,
  IntegrationListParams,
  IntegrationFormBody,
  IntegrationLogListData,
} from '@/types/api'
import { serviceIntegrationPath } from '@/constant/serviceConstant'

// TODO: Admin UI pages for integrations not yet implemented — service available per Postman

export default {
  /** GET /integrations */
  getAll: (params?: IntegrationListParams) =>
    apiClient.get<ApiResponse<IntegrationListData>>(serviceIntegrationPath, params),

  /** GET /integrations/:id */
  getById: (id: number) =>
    apiClient.get<ApiResponse<Integration>>(`${serviceIntegrationPath}/${id}`),

  /** POST /integrations */
  create: (data: IntegrationFormBody) =>
    apiClient.post<ApiResponse<Integration>>(serviceIntegrationPath, data),

  /** PATCH /integrations/:id */
  update: (id: number, data: Partial<IntegrationFormBody>) =>
    apiClient.patch<ApiResponse<Integration>>(`${serviceIntegrationPath}/${id}`, data),

  /** DELETE /integrations/:id */
  delete: (id: number) => apiClient.del<ApiResponse<{}>>(`${serviceIntegrationPath}/${id}`),

  /** POST /integrations/:id/sync */
  sync: (id: number) =>
    apiClient.post<ApiResponse<{}>>(`${serviceIntegrationPath}/${id}/sync`, {}),

  /** GET /integrations/:id/logs */
  getLogs: (id: number) =>
    apiClient.get<ApiResponse<IntegrationLogListData>>(`${serviceIntegrationPath}/${id}/logs`),
}
