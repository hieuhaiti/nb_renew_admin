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

  /** POST /ratings */
  // TODO: Available in Postman but not used by admin UI yet
  create: (data: Partial<Rating>) =>
    apiClient.post<ApiResponse<Rating>>(serviceRatingPath, data),

  /** PATCH /ratings/:id */
  // TODO: Available in Postman but not used by admin UI yet
  update: (id: string, data: Partial<Rating>) =>
    apiClient.patch<ApiResponse<Rating>>(`${serviceRatingPath}/${id}`, data),

  /** GET /ratings/business/my */
  // TODO: Available in Postman but not used by admin UI yet
  getMyBusiness: () =>
    apiClient.get<ApiResponse<RatingListData>>(`${serviceRatingPath}/business/my`),

  /** PATCH /ratings/:id/status */
  setStatus: (id: string, data: RatingModerationBody) =>
    apiClient.patch<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/status`, data),

  /** POST /ratings/:id/reply */
  reply: (id: string, reply: string) =>
    apiClient.post<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/reply`, { reply }),

  /** POST /ratings/:id/helpful */
  // TODO: Available in Postman but not used by admin UI yet
  markHelpful: (id: string) =>
    apiClient.post<ApiResponse<Rating>>(`${serviceRatingPath}/${id}/helpful`, {}),

  /** DELETE /ratings/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceRatingPath}/${id}`),
}
