import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Business,
  BusinessListData,
  BusinessListParams,
  BusinessApprovalBody,
  BusinessFormBody,
  BusinessStatus,
} from '@/types/api'
import { serviceBusinessPath, serviceGovernancePath } from '@/constant/serviceConstant'

export interface BusinessServiceItem {
  id: number
  business_id: string
  service_name_vi: string
  service_name_en?: string | null
  category: string | null
  description_vi?: string | null
  price_from?: number | null
  price_to?: number | null
  currency?: string
  unit?: string | null
  booking_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BusinessServiceFormBody {
  service_name_vi: string
  service_name_en?: string
  category?: string
  description_vi?: string
  price_from?: number
  price_to?: number
  currency?: string
  unit?: string
  booking_url?: string
  is_active?: boolean
}

export interface BusinessVoucher {
  id: number
  business_id: string
  code: string
  discount_pct: number
  valid_from: string
  valid_to: string
  max_uses: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

export interface BusinessVoucherFormBody {
  code: string
  discount_pct: number
  valid_from: string
  valid_to: string
  max_uses?: number
}

export default {
  // ─── Core ─────────────────────────────────────────────────────────────────

  /** GET /businesses (Admin — all) */
  getAll: (params?: BusinessListParams) =>
    apiClient.get<ApiResponse<BusinessListData>>(serviceBusinessPath, params),

  /** GET /businesses/public */
  // TODO: Available in Postman but not used by admin UI yet
  getPublic: (params?: BusinessListParams & { lang?: string }) =>
    apiClient.get<ApiResponse<BusinessListData>>(`${serviceBusinessPath}/public`, params),

  /** GET /businesses/me — enterprise user */
  // TODO: Available in Postman but not used by admin UI yet
  getMe: () => apiClient.get<ApiResponse<Business>>(`${serviceBusinessPath}/me`),

  /** POST /businesses */
  // TODO: Available in Postman but not used by admin UI yet
  create: (data: BusinessFormBody) =>
    apiClient.post<ApiResponse<Business>>(serviceBusinessPath, data),

  /** GET /businesses/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Business>>(`${serviceBusinessPath}/${id}`),

  /** PATCH /businesses/:id */
  update: (id: string, data: Partial<BusinessFormBody>) =>
    apiClient.patch<ApiResponse<Business>>(`${serviceBusinessPath}/${id}`, data),

  /** PATCH /businesses/:id/status */
  updateStatus: (id: string, status: BusinessStatus) =>
    apiClient.patch<ApiResponse<Business>>(`${serviceBusinessPath}/${id}/status`, { status }),

  /** PATCH /governance/department/registrations/businesses/:id */
  setApproval: (id: string, data: BusinessApprovalBody) =>
    apiClient.patch<ApiResponse<Business>>(
      `${serviceGovernancePath}/department/registrations/businesses/${id}`,
      data
    ),

  // ─── Services ─────────────────────────────────────────────────────────────

  /** GET /businesses/:businessId/services */
  getServices: (businessId: string) =>
    apiClient.get<ApiResponse<BusinessServiceItem[]>>(`${serviceBusinessPath}/${businessId}/services`),

  /** POST /businesses/:businessId/services */
  createService: (businessId: string, data: BusinessServiceFormBody) =>
    apiClient.post<ApiResponse<BusinessServiceItem>>(`${serviceBusinessPath}/${businessId}/services`, data),

  /** PATCH /businesses/:businessId/services/:serviceId */
  updateService: (businessId: string, serviceId: number, data: Partial<BusinessServiceFormBody>) =>
    apiClient.patch<ApiResponse<BusinessServiceItem>>(
      `${serviceBusinessPath}/${businessId}/services/${serviceId}`, data
    ),

  /** DELETE /businesses/:businessId/services/:serviceId */
  deleteService: (businessId: string, serviceId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceBusinessPath}/${businessId}/services/${serviceId}`),

  // ─── Vouchers ─────────────────────────────────────────────────────────────

  /** GET /businesses/:businessId/vouchers */
  getVouchers: (businessId: string) =>
    apiClient.get<ApiResponse<BusinessVoucher[]>>(`${serviceBusinessPath}/${businessId}/vouchers`),

  /** POST /businesses/:businessId/vouchers */
  createVoucher: (businessId: string, data: BusinessVoucherFormBody) =>
    apiClient.post<ApiResponse<BusinessVoucher>>(`${serviceBusinessPath}/${businessId}/vouchers`, data),

  /** PATCH /businesses/:businessId/vouchers/:voucherId */
  updateVoucher: (businessId: string, voucherId: number, data: Partial<BusinessVoucherFormBody>) =>
    apiClient.patch<ApiResponse<BusinessVoucher>>(
      `${serviceBusinessPath}/${businessId}/vouchers/${voucherId}`, data
    ),

  /** DELETE /businesses/:businessId/vouchers/:voucherId */
  deleteVoucher: (businessId: string, voucherId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceBusinessPath}/${businessId}/vouchers/${voucherId}`),

  // ─── Public voucher helpers ───────────────────────────────────────────────

  /** GET /businesses/vouchers/nearby */
  // TODO: Available in Postman but not used by admin UI yet
  getNearbyVouchers: (params: { lat: number; lng: number; radius_km?: number }) =>
    apiClient.get<ApiResponse<BusinessVoucher[]>>(`${serviceBusinessPath}/vouchers/nearby`, params),

  /** POST /businesses/vouchers/validate */
  // TODO: Available in Postman but not used by admin UI yet
  validateVoucher: (code: string) =>
    apiClient.post<ApiResponse<BusinessVoucher>>(`${serviceBusinessPath}/vouchers/validate`, { code }),
}
