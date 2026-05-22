import apiClient from './common/apiClient'
import type { ApiResponse, AuthLoginData, AuthMeData } from '@/types/api'
import { serviceAuthPath } from '@/constant/serviceConstant'

export default {
  /** POST /auth/register */
  register: (data: {
    email: string
    password: string
    full_name?: string
    phone?: string
  }) => apiClient.post<ApiResponse<AuthLoginData>>(`${serviceAuthPath}/register`, data),

  /** POST /auth/login */
  login: (data: { login: string; password: string; remember?: boolean }) =>
    apiClient.post<ApiResponse<AuthLoginData>>(`${serviceAuthPath}/login`, data),

  /** POST /auth/refresh — body uses snake_case per Postman */
  refreshToken: (data: { refresh_token: string }) =>
    apiClient.post<ApiResponse<Pick<AuthLoginData, 'access_token'>>>(
      `${serviceAuthPath}/refresh`,
      data
    ),

  /** GET /auth/me */
  getProfile: () => apiClient.get<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`),

  /** GET /auth/google */
  googleLogin: () => apiClient.get<ApiResponse<{ redirect_url?: string }>>(`${serviceAuthPath}/google`),

  /** GET /auth/google/callback */
  googleCallback: (params: { code?: string; state?: string }) =>
    apiClient.get<ApiResponse<AuthLoginData>>(`${serviceAuthPath}/google/callback`, params),

  /** PUT /auth/me */
  /** NOTE: Postman uses multipart/form-data with avatar file upload. */
  updateProfile: (
    data:
      | FormData
      | {
          full_name?: string
          phone?: string
          date_of_birth?: string
          gender?: string
          nationality?: string
          preferred_language?: string
          preferred_currency?: string
        }
  ) =>
    data instanceof FormData
      ? apiClient.put<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`, data, true)
      : apiClient.put<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`, data),

  /**
   * PUT /auth/me — with avatar file upload (multipart/form-data per Postman)
   */
  updateProfileWithAvatar: (data: FormData) =>
    apiClient.put<ApiResponse<AuthMeData>>(`${serviceAuthPath}/me`, data, true),

  /** POST /auth/change-password — body uses snake_case per Postman */
  changePassword: (data: {
    current_password?: string
    new_password?: string
    confirm_password?: string
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/change-password`, {
      current_password: data.current_password ?? data.currentPassword,
      new_password: data.new_password ?? data.newPassword,
      confirm_password: data.confirm_password ?? data.confirmPassword,
    }),

  /** POST /auth/logout — body uses snake_case per Postman */
  logout: (data?: { refresh_token?: string; refreshToken?: string }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/logout`, {
      refresh_token: data?.refresh_token ?? data?.refreshToken,
    }),

  /** POST /auth/forgot-password */
  forgotPassword: (data: { email: string }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/forgot-password`, data),

  /** POST /auth/reset-password */
  resetPassword: (data: {
    token: string
    password: string
    confirm_password?: string
    confirmPassword?: string
  }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/reset-password`, {
      token: data.token,
      password: data.password,
      confirm_password: data.confirm_password ?? data.confirmPassword,
    }),

  /** POST /auth/verify-email/send */
  sendVerificationEmail: () =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/verify-email/send`, {}),

  /** GET /auth/verify-email/:token */
  verifyEmail: (token: string) =>
    apiClient.get<ApiResponse<{}>>(`${serviceAuthPath}/verify-email/${token}`),

  // ─── 2FA ──────────────────────────────────────────────────────────────────

  /** GET /auth/2fa/status */
  get2FAStatus: () => apiClient.get<ApiResponse<{ enabled: boolean }>>(`${serviceAuthPath}/2fa/status`),

  /** POST /auth/2fa/setup */
  setup2FA: () => apiClient.post<ApiResponse<{ qr_url: string; secret: string }>>(`${serviceAuthPath}/2fa/setup`, {}),

  /** POST /auth/2fa/enable */
  enable2FA: (data: { totp_code: string }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/2fa/enable`, data),

  /** POST /auth/2fa/disable */
  disable2FA: (data: { totp_code: string }) =>
    apiClient.post<ApiResponse<{}>>(`${serviceAuthPath}/2fa/disable`, data),

  /** POST /auth/2fa/verify-login */
  verify2FALogin: (data: { temp_token: string; totp_code: string }) =>
    apiClient.post<ApiResponse<AuthLoginData>>(`${serviceAuthPath}/2fa/verify-login`, data),
}
