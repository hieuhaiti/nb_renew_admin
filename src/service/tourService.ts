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
  /** GET /tours */
  getAll: (params?: TourListParams) =>
    apiClient.get<ApiResponse<TourListData>>(serviceTourPath, params),

  /** GET /tours/:id */
  getById: (id: string) =>
    apiClient.get<ApiResponse<Tour>>(`${serviceTourPath}/${id}`),

  /** GET /tours/slug/:slug */
  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<Tour>>(`${serviceTourPath}/slug/${slug}`),

  /** POST /tours */
  create: (data: TourFormBody) =>
    apiClient.post<ApiResponse<Tour>>(serviceTourPath, data),

  /** PATCH /tours/:id */
  update: (id: string, data: Partial<TourFormBody>) =>
    apiClient.patch<ApiResponse<Tour>>(`${serviceTourPath}/${id}`, data),

  /** DELETE /tours/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceTourPath}/${id}`),

  // ─── Stops ────────────────────────────────────────────────────────────────

  /** GET /tours/:id/stops */
  getStops: (tourId: string) =>
    apiClient.get<ApiResponse<TourStop[]>>(`${serviceTourPath}/${tourId}/stops`),

  /** POST /tours/:id/stops */
  addStop: (tourId: string, data: TourStopFormBody) =>
    apiClient.post<ApiResponse<TourStop>>(`${serviceTourPath}/${tourId}/stops`, data),

  /** PATCH /tours/:tourId/stops/:stopId */
  updateStop: (tourId: string, stopId: number, data: Partial<TourStopFormBody>) =>
    apiClient.patch<ApiResponse<TourStop>>(`${serviceTourPath}/${tourId}/stops/${stopId}`, data),

  /** DELETE /tours/:tourId/stops/:stopId */
  deleteStop: (tourId: string, stopId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceTourPath}/${tourId}/stops/${stopId}`),
}
