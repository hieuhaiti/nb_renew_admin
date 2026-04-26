export type ApiStatus = 'draft' | 'published'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type PrincipalType = 'user' | 'role' | 'public'
export type PermissionLevel = 'view' | 'edit' | 'manage'

export interface MapLayerApi {
  id: number
  category_id: number
  category_name?: string
  name: string
  slug: string
  description?: string
  endpoint_url: string
  http_method: HttpMethod
  status: ApiStatus
  published_at?: string
  created_by?: number
  created_at: string
  updated_at: string
}

export interface MapLayerApiListData {
  apis: MapLayerApi[]
  pagination: import('./index').Pagination
}

export interface CreateMapLayerApiBody {
  category_id: number
  name: string
  slug: string
  description?: string | null
  endpoint_url: string
  http_method?: HttpMethod
  status?: ApiStatus
}

export interface UpdateMapLayerApiBody {
  category_id?: number
  name?: string
  slug?: string
  description?: string | null
  endpoint_url?: string
  http_method?: HttpMethod
  status?: ApiStatus
  published_at?: string | null
}

export interface PublicMapLayerApiData {
  id: number
  name: string
  slug: string
  description?: string
  endpoint_url: string
  http_method: HttpMethod
  status: ApiStatus
}

export interface ApiPermission {
  id: number
  map_layer_api_id: number
  principal_type: PrincipalType
  user_id?: number | null
  role_id?: number | null
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  can_share: boolean
  created_at: string
}

export interface AddPermissionBody {
  principal_type: PrincipalType
  user_id?: number | null
  role_id?: number | null
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
  can_share?: boolean
}

export interface ApiShare {
  id: number
  map_layer_api_id: number
  shared_with_type: PrincipalType
  shared_with_user_id?: number | null
  shared_with_role_id?: number | null
  permission_level: PermissionLevel
  expires_at?: string
  created_at: string
}

export interface CreateShareBody {
  shared_with_type: PrincipalType
  shared_with_user_id?: number | null
  shared_with_role_id?: number | null
  permission_level?: PermissionLevel
  expires_at?: string
}

export interface MapLayerApiListParams {
  page?: number
  limit?: number
  category_id?: number
  status?: 'draft' | 'published'
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
