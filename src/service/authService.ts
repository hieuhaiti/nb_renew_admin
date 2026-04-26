import apiClient from './common/apiClient'
import type { ApiResponse, AuthLoginData, AuthMeData } from '@/types/api'
import { serviceAuthPath } from '@/constant/serviceConstant'

export default {
  /** POST /auth/login */
  login: (data: { login: string; password: string; remember?: boolean }) =>
    apiClient.post<ApiResponse<AuthLoginData>>(`${serviceAuthPath}/login`, data),

  /** POST /auth/refresh */
  refreshToken: (data: { refreshToken: string }) =>
    apiClient.post<ApiResponse<Pick<AuthLoginData, 'access_token'>>>(
      `${serviceAuthPath}/refresh`,
      data
    ),

  /** GET /auth/me */
  getProfile: () => apiClient.get<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`),

  /** PUT /auth/me */
  updateProfile: (data: {
    full_name?: string
    phone?: string
    avatar_url?: string
    date_of_birth?: string
    gender?: string
    nationality?: string
    preferred_language?: string
    preferred_currency?: string
  }) => apiClient.put<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`, data),

  /** POST /auth/change-password */
  changePassword: (data: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/change-password`, data),

  /** POST /auth/logout */
  logout: (data?: { refreshToken?: string }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/logout`, data ?? {}),
}
