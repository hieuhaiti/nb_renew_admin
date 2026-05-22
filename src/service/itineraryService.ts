import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Itinerary,
  ItineraryListData,
  ItineraryListParams,
  ItineraryFormBody,
  ItineraryDay,
  ItineraryDayFormBody,
  ItineraryStop,
  ItineraryStopFormBody,
  AIItineraryGenerateBody,
} from '@/types/api'
import { serviceItineraryPath } from '@/constant/serviceConstant'

// TODO: Admin UI pages for itineraries not yet implemented — service available per Postman

export default {
  /** GET /itineraries */
  getAll: (params?: ItineraryListParams) =>
    apiClient.get<ApiResponse<ItineraryListData>>(serviceItineraryPath, params),

  /** GET /itineraries/:id */
  getById: (id: number) =>
    apiClient.get<ApiResponse<Itinerary>>(`${serviceItineraryPath}/${id}`),

  /** GET /itineraries/shared/:token */
  getShared: (token: string) =>
    apiClient.get<ApiResponse<Itinerary>>(`${serviceItineraryPath}/shared/${token}`),

  /** POST /itineraries */
  create: (data: ItineraryFormBody) =>
    apiClient.post<ApiResponse<Itinerary>>(serviceItineraryPath, data),

  /** POST /itineraries/ai-generate */
  aiGenerate: (data: AIItineraryGenerateBody) =>
    apiClient.post<ApiResponse<Itinerary>>(`${serviceItineraryPath}/ai-generate`, data),

  /** PATCH /itineraries/:id */
  update: (id: number, data: Partial<ItineraryFormBody>) =>
    apiClient.patch<ApiResponse<Itinerary>>(`${serviceItineraryPath}/${id}`, data),

  /** DELETE /itineraries/:id */
  delete: (id: number) => apiClient.del<ApiResponse<{}>>(`${serviceItineraryPath}/${id}`),

  /** POST /itineraries/:id/share */
  share: (id: number) =>
    apiClient.post<ApiResponse<{ share_token: string }>>(`${serviceItineraryPath}/${id}/share`, {}),

  /** DELETE /itineraries/:id/share */
  unshare: (id: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceItineraryPath}/${id}/share`),

  /** GET /itineraries/:id/export/pdf */
  exportPDF: (id: number) =>
    apiClient.get<ApiResponse<object>>(`${serviceItineraryPath}/${id}/export/pdf`),

  // ─── Days ─────────────────────────────────────────────────────────────────

  /** GET /itineraries/:id/days */
  getDays: (itineraryId: number) =>
    apiClient.get<ApiResponse<ItineraryDay[]>>(`${serviceItineraryPath}/${itineraryId}/days`),

  /** POST /itineraries/:id/days */
  addDay: (itineraryId: number, data: ItineraryDayFormBody) =>
    apiClient.post<ApiResponse<ItineraryDay>>(`${serviceItineraryPath}/${itineraryId}/days`, data),

  /** PATCH /itineraries/:id/days/:dayId */
  updateDay: (itineraryId: number, dayId: number, data: Partial<ItineraryDayFormBody>) =>
    apiClient.patch<ApiResponse<ItineraryDay>>(
      `${serviceItineraryPath}/${itineraryId}/days/${dayId}`, data
    ),

  /** DELETE /itineraries/:id/days/:dayId */
  deleteDay: (itineraryId: number, dayId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceItineraryPath}/${itineraryId}/days/${dayId}`),

  // ─── Stops ────────────────────────────────────────────────────────────────

  /** POST /itineraries/:id/days/:dayId/stops */
  addStop: (itineraryId: number, dayId: number, data: ItineraryStopFormBody) =>
    apiClient.post<ApiResponse<ItineraryStop>>(
      `${serviceItineraryPath}/${itineraryId}/days/${dayId}/stops`, data
    ),

  /** PATCH /itineraries/:id/stops/:stopId */
  updateStop: (itineraryId: number, stopId: number, data: Partial<ItineraryStopFormBody>) =>
    apiClient.patch<ApiResponse<ItineraryStop>>(
      `${serviceItineraryPath}/${itineraryId}/stops/${stopId}`, data
    ),

  /** DELETE /itineraries/:id/stops/:stopId */
  deleteStop: (itineraryId: number, stopId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceItineraryPath}/${itineraryId}/stops/${stopId}`),
}
