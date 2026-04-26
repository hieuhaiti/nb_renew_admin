import apiClient from './common/apiClient'
import type { ApiResponse, Role } from '@/types/api'
import { serviceRolePath } from '@/constant/serviceConstant'

export default {
  /** GET /roles */
  getAll: () => apiClient.get<ApiResponse<Role[]>>(serviceRolePath),

  /** GET /roles/:id */
  getById: (id: number) => apiClient.get<ApiResponse<Role>>(`${serviceRolePath}/${id}`),

  /** POST /roles */
  create: (data: { name: string; description?: string }) =>
    apiClient.post<ApiResponse<Role>>(serviceRolePath, data),

  /** PUT /roles/:id */
  update: (id: number, data: { name: string; description?: string }) =>
    apiClient.put<ApiResponse<Role>>(`${serviceRolePath}/${id}`, data),

  /** DELETE /roles/:id */
  delete: (id: number) => apiClient.del<ApiResponse<{}>>(`${serviceRolePath}/${id}`),
}
