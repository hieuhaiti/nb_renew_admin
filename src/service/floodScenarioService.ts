import apiClient from './common/apiClient'
import type { ApiResponse, FloodScenario, FloodScenarioListData, FloodScenarioListParams, FloodScenarioFormBody, FloodScenarioMetadata } from '@/types/api'
import { serviceFloodScenarioPath } from '@/constant/serviceConstant'

export default {
  getAll: (params?: FloodScenarioListParams) =>
    apiClient.get<ApiResponse<FloodScenarioListData> & { metadata?: FloodScenarioMetadata }>(serviceFloodScenarioPath, params),

  getById: (id: number | string) =>
    apiClient.get<ApiResponse<FloodScenario>>(`${serviceFloodScenarioPath}/${id}`),

  create: (data: FloodScenarioFormBody) =>
    apiClient.post<ApiResponse<FloodScenario>>(serviceFloodScenarioPath, data),

  update: (id: number | string, data: Partial<FloodScenarioFormBody>) =>
    apiClient.put<ApiResponse<FloodScenario>>(`${serviceFloodScenarioPath}/${id}`, data),

  delete: (id: number | string) =>
    apiClient.del<ApiResponse<{}>>(`${serviceFloodScenarioPath}/${id}`),
}
