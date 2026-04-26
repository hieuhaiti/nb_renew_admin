import apiClient from '@/service/common/apiClient'
import { serviceApiKeyPath, serviceMapLayerApiPath } from '@/constant/serviceConstant'
import type {
  ApiKey,
  ApiKeyListData,
  ApiKeyListParams,
  CreateApiKeyBody,
  CreateApiKeyResponseData,
  MapLayerApi,
  MapLayerApiListData,
  MapLayerApiListParams,
} from '@/types/api'

export default {
  /** GET /map-admin/apis */
  getAll: (params?: MapLayerApiListParams) =>
    apiClient.get<MapLayerApiListData>(serviceMapLayerApiPath, params),

  /** GET /map-admin/api-keys */
  getApiKeys: (params?: ApiKeyListParams) =>
    apiClient.get<ApiKeyListData | ApiKey[]>(serviceApiKeyPath, params),

  /** GET /map-admin/api-keys/:id */
  getApiKeyById: (id: number) => apiClient.get<ApiKey>(`${serviceApiKeyPath}/${id}`),

  /** POST /map-admin/api-keys */
  createApiKey: (data: CreateApiKeyBody) =>
    apiClient.post<CreateApiKeyResponseData>(serviceApiKeyPath, data),

  /** PATCH /map-admin/api-keys/:id/revoke */
  revokeApiKey: (id: number) => apiClient.patch<ApiKey>(`${serviceApiKeyPath}/${id}/revoke`),
}
