import apiClient from './common/apiClient'
import type { ApiResponse, SearchResult, SearchType } from '@/types/api'
import { serviceSearchPath } from '@/constant/serviceConstant'

// TODO: Admin UI search page not yet implemented — service available per Postman

export default {
  /** GET /search/types */
  getTypes: () =>
    apiClient.get<ApiResponse<SearchType[]>>(`${serviceSearchPath}/types`),

  /** GET /search?q=&types= */
  search: (params: { q: string; types?: string }) =>
    apiClient.get<ApiResponse<SearchResult[]>>(serviceSearchPath, params),

  /** GET /search/spots?q= */
  searchSpots: (params: { q: string }) =>
    apiClient.get<ApiResponse<SearchResult>>(`${serviceSearchPath}/spots`, params),
}
