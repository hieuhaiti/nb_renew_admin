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

  /** GET /news/:slug */
  // TODO: Available in Postman but not used by admin UI yet
  getBySlug: (slug: string) =>
    apiClient.get<ApiResponse<NewsData>>(`${serviceNewsPath}/${slug}`),

  /** POST /news */
  create: (data: NewsFormBody) =>
    apiClient.post<ApiResponse<News>>(serviceNewsPath, data),

  /** PATCH /news/:id */
  update: (id: string, data: Partial<NewsFormBody>) =>
    apiClient.patch<ApiResponse<News>>(`${serviceNewsPath}/${id}`, data),

  /** PATCH /news/admin/:id/publish */
  setPublished: (id: string, is_published: boolean) =>
    apiClient.patch<ApiResponse<News>>(`${serviceNewsPath}/admin/${id}/publish`, { is_published }),

  /** DELETE /news/:id */
  delete: (id: string) => apiClient.del<ApiResponse<{}>>(`${serviceNewsPath}/${id}`),
}
