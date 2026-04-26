import apiClient from './common/apiClient'
import type { ApiResponse, Spot, SpotListData, SpotListParams, SpotFormBody } from '@/types/api'
import { serviceSpotPath } from '@/constant/serviceConstant'

export default {
  /** GET /spots */
  getAll: (params?: SpotListParams) =>
    apiClient.get<ApiResponse<SpotListData>>(serviceSpotPath, params),

  /** GET /spots/:slug */
  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<{ spot: Spot }>>(`${serviceSpotPath}/${slug}`),

  /** POST /spots */
  create: (data: SpotFormBody) =>
    apiClient.post<ApiResponse<Spot>>(serviceSpotPath, data),

  /** PATCH /spots/:id */
  update: (id: string, data: Partial<SpotFormBody>) =>
    apiClient.patch<ApiResponse<Spot>>(`${serviceSpotPath}/${id}`, data),

  /** DELETE /spots/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceSpotPath}/${id}`),

  /** PATCH /spots/:id/featured */
  toggleFeatured: (id: string) =>
    apiClient.patch<ApiResponse<Spot>>(`${serviceSpotPath}/${id}/featured`),
}
