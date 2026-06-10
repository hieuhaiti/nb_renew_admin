import apiClient from './common/apiClient'
import type {
  ApiResponse,
  Rating,
  RatingListData,
  RatingListParams,
  RatingModerationBody,
  RatingReplyBody,
} from '@/types/api'
import { serviceRatingPath } from '@/constant/serviceConstant'

export default {
  /** GET /ratings */
  getAll: (params?: RatingListParams) =>
    apiClient.get<ApiResponse<RatingListData>>(serviceRatingPath, params),

  /** POST /ratings */
  create: (data: Partial<Rating>) =>
    apiClient.post<ApiResponse<Rating>>(serviceRatingPath, data),

  /** PATCH /ratings/:id */
  update: (id: string, data: Partial<Rating>) =>
    apiClient.patch<ApiResponse<Rating>>(`${serviceRatingPath}/${id}`, data),

  /** GET /ratings/business/my */
  getMyBusiness: (params?: Omit<RatingListParams, 'spot_id' | 'business_id'>) =>
    apiClient.get<ApiResponse<RatingListData>>(`${serviceRatingPath}/business/my`, params),

  /** PATCH /ratings/:id/status */
  setStatus: (id: string, data: RatingModerationBody) =>
    apiClient.patch<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/status`, data),

  /** POST /ratings/:id/reply */
  reply: (id: string, reply: string) =>
    apiClient.post<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/reply`, {
      reply_text: reply,
    } satisfies RatingReplyBody),

  /** POST /ratings/:id/helpful */
  markHelpful: (id: string) =>
    apiClient.post<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/helpful`, {}),

  /** DELETE /ratings/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceRatingPath}/${id}`),
}
