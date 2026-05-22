import type { Pagination } from './index'

export type IntegrationAuthType = 'api_key' | 'oauth2' | 'basic' | 'none'
export type IntegrationType = 'data_sync' | 'booking' | 'payment' | 'notification' | 'analytics'

export interface Integration {
  id: number
  provider_code: string
  provider_name: string
  integration_type: IntegrationType
  base_url: string | null
  auth_type: IntegrationAuthType
  is_active: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface IntegrationLog {
  id: number
  integration_id: number
  event: string
  status: 'success' | 'error'
  message: string | null
  created_at: string
}

export interface IntegrationListData {
  integrations: Integration[]
  pagination: Pagination
}

export interface IntegrationLogListData {
  logs: IntegrationLog[]
  pagination: Pagination
}

export interface IntegrationListParams {
  page?: number
  limit?: number
  search?: string
  is_active?: boolean
}

export interface IntegrationFormBody {
  provider_code: string
  provider_name: string
  integration_type: IntegrationType
  base_url?: string
  auth_type: IntegrationAuthType
  credentials?: Record<string, string>
  webhook_secret?: string
  is_active?: boolean
}
