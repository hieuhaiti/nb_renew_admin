import apiClient from './common/apiClient'
import type {
  ApiResponse,
  User,
  UserListData,
  UserListParams,
  UserCreateBody,
  UserUpdateBody,
} from '@/types/api'
import { serviceUserPath } from '@/constant/serviceConstant'

export default {
  /** GET /users */
  getAll: (params?: UserListParams) =>
    apiClient.get<ApiResponse<UserListData>>(serviceUserPath, params),

  /** GET /users/:id */
  getById: (id: string | number) => apiClient.get<ApiResponse<User>>(`${serviceUserPath}/${id}`),

  /** POST /users */
  create: (data: UserCreateBody) =>
    apiClient.post<ApiResponse<User>>(serviceUserPath, data),

  /** PUT /users/:id */
  update: (id: string | number, data: UserUpdateBody) =>
    apiClient.put<ApiResponse<User>>(`${serviceUserPath}/${id}`, data),

  /** PUT /users/:id/lock */
  lock: (id: string | number, data?: { reason?: string }) =>
    apiClient.put<ApiResponse<User>>(`${serviceUserPath}/${id}/lock`, data),

  /** DELETE /users/:id/lock */
  unlock: (id: string | number) =>
    apiClient.del<ApiResponse<User>>(`${serviceUserPath}/${id}/lock`),

  /** DELETE /users/batch */
  batchDelete: (userIds: Array<string | number>) =>
    apiClient.del<ApiResponse<{}>>(`${serviceUserPath}/batch`, { userIds }),

  /** PUT /users/:id/role */
  assignRole: (id: string | number, role_id: number) =>
    apiClient.put<ApiResponse<User>>(`${serviceUserPath}/${id}/role`, { role_id }),

  /** DELETE /users/:id */
  delete: (id: string | number) => apiClient.del<ApiResponse<{}>>(`${serviceUserPath}/${id}`),
}
