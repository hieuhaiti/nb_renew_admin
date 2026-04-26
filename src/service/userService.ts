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
  getById: (id: string) => apiClient.get<ApiResponse<User>>(`${serviceUserPath}/${id}`),

  /** POST /users */
  create: (data: UserCreateBody) =>
    apiClient.post<ApiResponse<User>>(serviceUserPath, data),

  /** PUT /users/:id */
  update: (id: string, data: UserUpdateBody) =>
    apiClient.put<ApiResponse<User>>(`${serviceUserPath}/${id}`, data),

  /** POST /users/:id/lock  — body: { reason } */
  lock: (id: string, data: { reason: string }) =>
    apiClient.post<ApiResponse<User>>(`${serviceUserPath}/${id}/lock`, data),

  /** POST /users/:id/unlock */
  unlock: (id: string) =>
    apiClient.post<ApiResponse<User>>(`${serviceUserPath}/${id}/unlock`),

  /** DELETE /users/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceUserPath}/${id}`),
}
