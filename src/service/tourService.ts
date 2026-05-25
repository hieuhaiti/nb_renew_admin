import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Tour,
  TourListData,
  TourListParams,
  TourFormBody,
  TourStop,
  TourStopFormBody,
} from '@/types/api'
import { serviceTourPath } from '@/constant/serviceConstant'

export default {
  /** GET /tours/admin */
  getAdmin: (params?: TourListParams) =>
    apiClient.get<ApiResponse<TourListData>>('/tours/admin', params),

  /** GET /tours */
  getAll: (params?: TourListParams) =>
    apiClient.get<ApiResponse<TourListData>>(serviceTourPath, params),

  /** GET /tours/:id */
  getById: (id: string) => apiClient.get<ApiResponse<Tour>>(`${serviceTourPath}/${id}`),

  /** GET /tours/slug/:slug */
  getBySlug: (slug: string) => apiClient.get<ApiResponse<Tour>>(`${serviceTourPath}/slug/${slug}`),

  /** POST /tours */
  create: (data: TourFormBody) => apiClient.post<ApiResponse<Tour>>(serviceTourPath, data),

  /** PATCH /tours/:id */
  update: (id: string, data: Partial<TourFormBody>) =>
    apiClient.patch<ApiResponse<Tour>>(`${serviceTourPath}/${id}`, data),

  /** DELETE /tours/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceTourPath}/${id}`),

  // ─── Stops ────────────────────────────────────────────────────────────────

  /** GET /tours/:id/stops */
  getStops: (tourId: string, params?: { sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) =>
    apiClient.get<ApiResponse<TourStop[]>>(`${serviceTourPath}/${tourId}/stops`, params),

  /** POST /tours/:id/stops */
  addStop: (tourId: string, data: TourStopFormBody) =>
    apiClient.post<ApiResponse<TourStop>>(`${serviceTourPath}/${tourId}/stops`, data),

  /** PATCH /tours/:tourId/stops/:stopId */
  updateStop: (tourId: string, stopId: string, data: Partial<TourStopFormBody>) =>
    apiClient.patch<ApiResponse<TourStop>>(`${serviceTourPath}/${tourId}/stops/${stopId}`, data),

  /** DELETE /tours/:tourId/stops/:stopId */
  deleteStop: (tourId: string, stopId: string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceTourPath}/${tourId}/stops/${stopId}`),

  /**
   * PATCH /tours/:tourId/stops/reorder
   * Same-day:   { day_number, stop_ids }
   * Cross-day:  { stops: [{ id, day_number, stop_order }] }
   */
  reorderStops: (
    tourId: string,
    payload:
      | { day_number: number; stop_ids: string[] }
      | { stops: { id: string; day_number: number; stop_order: number }[] }
  ) =>
    apiClient.patch<ApiResponse<TourStop[]>>(`${serviceTourPath}/${tourId}/stops/reorder`, payload),
}
