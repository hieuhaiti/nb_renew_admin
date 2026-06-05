export interface Role {
  [key: string]: unknown
  id: number
  name: string
  name_vi?: string | null
  code?: string | null
  description?: string | null
  is_system?: boolean
  permissions?:
    | RolePermission[]
    | (Record<string, string[]> & {
        map_layer_apis?: string[]
      })
  created_at?: string
  updated_at?: string
}

export interface RolePermission {
  id?: number
  permission_id?: number
  role_id?: number
  resource: string
  action: string
  name_vi: string | null
  description: string | null
  granted_at?: string
}

export interface Permission {
  id: number
  resource: string
  action: string
  name_vi: string | null
  description: string | null
}

export interface PermissionListData {
  permissions: Permission[]
  pagination: import('./index').Pagination
}

export interface PermissionListParams {
  page?: number
  limit?: number
  search?: string
}

export interface RolePermissionsData {
  role_id: number
  items: RolePermission[]
  total: number
}
