export interface User {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
  email_registered?: string | null
  phone?: string | null
  avatar_url?: string | null
  address_detail?: string | null
  province_code?: string | null
  role_id?: number
  role?: UserRole
  role_name?: string | null
  role_code?: string | null
  is_active: boolean
  is_verified?: boolean
  is_deleted?: boolean
  deleted_at?: string | null
  last_login?: string | null
  locked_until?: string | null
  created_at?: string
  updated_at?: string
}

export interface UserRole {
  id: number
  name?: string
  code?: string
  name_vi?: string
  name_en?: string
  description?: string
  permissions?: Record<string, string[]> & {
    map_layer_apis?: string[]
  }
}

export interface UserListData {
  users: User[]
  pagination: import('./index').Pagination
}

export interface UserListParams {
  page?: number
  limit?: number
  is_active?: boolean
  role_id?: number
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface UserCreateBody {
  email: string
  password: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role_id?: number
  is_active?: boolean
  is_verified?: boolean
  date_of_birth?: string
  gender?: string
  nationality?: string
  preferred_language?: string
  preferred_currency?: string
}

export interface UserUpdateBody {
  email?: string
  full_name?: string
  phone?: string
  avatar_url?: string
  role_id?: number
  is_active?: boolean
  is_verified?: boolean
}
