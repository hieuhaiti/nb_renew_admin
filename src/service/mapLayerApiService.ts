import apiClient from '@/service/common/apiClient'
import { serviceApiKeyPath, serviceMapLayerApiPath } from '@/constant/serviceConstant'
import type {
  ApiResponse,
  ApiKey,
  ApiKeyListData,
  ApiKeyListParams,
  CreateApiKeyBody,
  CreateApiKeyResponseData,
  MapLayerApi,
  MapLayerApiListData,
  MapLayerApiListParams,
} from '@/types/api'

export interface MapLayerApiFormBody {
  category_id: number
  map_layer_id?: number
  name: string
  slug: string
  description?: string | null
  endpoint_url: string
  http_method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  status?: 'draft' | 'published'
}

export interface MapLayerApiPermissionBody {
  principal_type: 'role' | 'user' | 'public'
  role_id?: number | null
  user_id?: number | null
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

export default {
  // ─── Map Layer APIs ────────────────────────────────────────────────────────

  /** GET /map-admin/apis */
  getAll: (params?: MapLayerApiListParams) =>
    apiClient.get<ApiResponse<MapLayerApiListData>>(serviceMapLayerApiPath, params),

  /** GET /map-admin/apis/:id */
  getById: (id: number) =>
    apiClient.get<ApiResponse<{ api: MapLayerApi }>>(`${serviceMapLayerApiPath}/${id}`),

  /** POST /map-admin/apis */
  create: (data: MapLayerApiFormBody) =>
    apiClient.post<ApiResponse<MapLayerApi>>(serviceMapLayerApiPath, data),

  /** PATCH /map-admin/apis/:id */
  update: (id: number, data: Partial<MapLayerApiFormBody>) =>
    apiClient.patch<ApiResponse<MapLayerApi>>(`${serviceMapLayerApiPath}/${id}`, data),

  /** DELETE /map-admin/apis/:id */
  delete: (id: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceMapLayerApiPath}/${id}`),

  /** GET /map-admin/apis/:id/permissions */
  getPermissions: (id: number) =>
    apiClient.get<ApiResponse<any>>(`${serviceMapLayerApiPath}/${id}/permissions`),

  /** POST /map-admin/apis/:id/permissions */
  addPermission: (id: number, data: MapLayerApiPermissionBody) =>
    apiClient.post<ApiResponse<any>>(`${serviceMapLayerApiPath}/${id}/permissions`, data),

  /** PUT /map-admin/apis/:id/permissions */
  setPermission: (id: number, data: MapLayerApiPermissionBody) =>
    apiClient.put<ApiResponse<any>>(`${serviceMapLayerApiPath}/${id}/permissions`, data),

  /** DELETE /map-admin/apis/:id/permissions/:permissionId */
  deletePermission: (id: number, permissionId: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceMapLayerApiPath}/${id}/permissions/${permissionId}`),

  /** GET /map-layer-apis/:slug?apikey=... */
  getBySlugWithKey: (slug: string, apiKey: string) =>
    apiClient.get<ApiResponse<any>>(`/map-layer-apis/${slug}`, { apikey: apiKey }),

  // ─── API Keys ─────────────────────────────────────────────────────────────

  /** GET /map-admin/api-keys */
  getApiKeys: (params?: ApiKeyListParams) =>
    apiClient.get<ApiResponse<ApiKeyListData | ApiKey[]>>(serviceApiKeyPath, params),

  /** GET /map-admin/api-keys/:id */
  getApiKeyById: (id: number) =>
    apiClient.get<ApiResponse<ApiKey>>(`${serviceApiKeyPath}/${id}`),

  /** POST /map-admin/api-keys */
  createApiKey: (data: CreateApiKeyBody) =>
    apiClient.post<ApiResponse<CreateApiKeyResponseData>>(serviceApiKeyPath, data),

  /** PATCH /map-admin/api-keys/:id/revoke */
  revokeApiKey: (id: number) =>
    apiClient.patch<ApiResponse<ApiKey>>(`${serviceApiKeyPath}/${id}/revoke`),

  /** DELETE /map-admin/api-keys/:id */
  deleteApiKey: (id: number) =>
    apiClient.del<ApiResponse<{}>>(`${serviceApiKeyPath}/${id}`),
}
