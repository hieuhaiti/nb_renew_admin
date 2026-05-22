import apiClient from './common/apiClient'
import type { ApiResponse } from '@/types/api'

export default {
  /** GET /health */
  // TODO: Available in Postman but not used by admin UI yet
  check: () => apiClient.get<ApiResponse<{ status?: string; uptime?: number }>>('/health'),
}
