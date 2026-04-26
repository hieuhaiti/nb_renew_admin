export type ApiKeyStatus = 'active' | 'revoked' | 'expired'

export interface ApiKey {
    id: number
    name: string
    status?: ApiKeyStatus
    is_active?: boolean
    masked_key?: string
    key_masked?: string
    api_key?: string
    plain_key?: string
    expires_at?: string | null
    created_at: string
    updated_at?: string
    map_layer_api_ids?: number[]
}

export interface ApiKeyListData {
    api_keys?: ApiKey[]
    items?: ApiKey[]
    keys?: ApiKey[]
    pagination?: import('./index').Pagination
}

export interface CreateApiKeyBody {
    name: string
    expires_at?: string | null
    map_layer_api_ids: number[]
}

export interface ApiKeyListParams {
    page?: number
    limit?: number
    search?: string
    status?: ApiKeyStatus
}

export interface CreateApiKeyResponseData {
    api_key?: ApiKey | string
    key?: ApiKey | string
    share_key?: ApiKey | string
    plain_key?: string
    token?: string
}

// Backward-compatible aliases
export type ShareKey = ApiKey
export type ShareKeyListData = ApiKeyListData
export type CreateShareKeyBody = CreateApiKeyBody
