import apiClient from './common/apiClient'
import type { ApiResponse, News, NewsData, NewsListData, NewsListParams, NewsFormBody } from '@/types/api'
import { serviceNewsPath } from '@/constant/serviceConstant'

export default {
  /** GET /news (public list) */
  getAll: (params?: NewsListParams) =>
    apiClient.get<ApiResponse<NewsListData>>(serviceNewsPath, params),

  /** GET /news/admin/all (admin — includes unpublished) */
  getAllAdmin: (params?: NewsListParams) =>
    apiClient.get<ApiResponse<NewsListData>>(`${serviceNewsPath}/admin/all`, params),

  /** GET /news/admin/:id */
  getByIdAdmin: (id: string) =>
    apiClient.get<ApiResponse<NewsData>>(`${serviceNewsPath}/admin/${id}`),

  /** POST /news */
  create: (data: NewsFormBody) =>
    apiClient.post<ApiResponse<News>>(serviceNewsPath, data),

  /** PUT /news/:id */
  update: (id: string, data: NewsFormBody) =>
    apiClient.put<ApiResponse<News>>(`${serviceNewsPath}/${id}`, data),

  /** PATCH /news/admin/:id/publish */
  setPublished: (id: string, is_published: boolean) =>
    apiClient.patch<ApiResponse<News>>(`${serviceNewsPath}/admin/${id}/publish`, { is_published }),

  /** DELETE /news/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceNewsPath}/${id}`),
}
