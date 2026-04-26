import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Rating,
  RatingListData,
  RatingListParams,
  RatingModerationBody,
} from '@/types/api'
import { serviceRatingPath } from '@/constant/serviceConstant'

export default {
  /** GET /ratings */
  getAll: (params?: RatingListParams) =>
    apiClient.get<ApiResponse<RatingListData>>(serviceRatingPath, params),

  /** PATCH /ratings/:id/status */
  setStatus: (id: string, data: RatingModerationBody) =>
    apiClient.patch<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/status`, data),

  /** DELETE /ratings/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceRatingPath}/${id}`),
}
