import type { ApiResponse } from '@/types/api'
import { tokenManager } from '@/lib/tokenManager'
import { toast } from 'react-toastify'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

function getAccessToken() {
  try {
    return tokenManager.getAccessToken() || undefined
  } catch {
    return undefined
  }
}

async function handleResponse<T>(res: Response, isAuthEndpoint = false): Promise<ApiResponse<T>> {
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json() : undefined

  if (!res.ok) {
    const err: any = new Error(body?.message || res.statusText || 'Request failed')
    err.status = res.status
    err.body = body
    err.isAuthRequest = isAuthEndpoint

    // Auth endpoints (login/register/...): luôn hiện toast kể cả 401 (sai mật khẩu, v.v.)
    // Non-auth 401: xử lý bởi useApiMutation (navigate login) - không show toast ở đây
    if (res.status !== 401 || isAuthEndpoint) {
      const errors = body?.errors
      if (Array.isArray(errors) && errors.length) {
        const detail = errors
          .map((e: any) => (typeof e === 'string' ? e : e.message || e))
          .join('\n')
        toast.error(body?.message ? `${body.message}\n${detail}` : detail, {
          autoClose: 8000,
        })
      } else {
        toast.error(body?.message || `Lỗi ${res.status}`, { autoClose: 5000 })
      }
    }

    throw err
  }

  return body as ApiResponse<T>
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getRefreshToken() {
  try {
    return tokenManager.getRefreshToken() || undefined
  } catch {
    return undefined
  }
}

function isAuthUrl(url: string) {
  return (
    url.includes('auth/login') ||
    url.includes('auth/register') ||
    url.includes('auth/refresh') ||
    url.includes('auth/logout') ||
    url.includes('auth/forgot-password') ||
    url.includes('auth/reset-password')
  )
}

async function requestWithRefresh(
  url: string,
  opts: RequestInit,
  isRetry = false
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, opts)

  if (res.status !== 401) return res

  // If unauthorized and not retried yet, try refresh
  // Bỏ qua auth endpoints (login, register, ...): 401 = sai mật khẩu, không refresh
  if (isRetry || isAuthUrl(url)) return res
  const refreshToken = getRefreshToken()
  if (!refreshToken) return res

  // Attempt refresh
  try {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!refreshRes.ok) {
      // clear tokens and return original 401 response
      clearTokens()
      return res
    }

    const refreshBody = await refreshRes.json()
    const newAccess = refreshBody?.data?.accessToken
    const newRefresh = refreshBody?.data?.refreshToken
    if (newAccess) setTokens({ accessToken: newAccess, refreshToken: newRefresh })

    // retry original request with updated auth header
    const newOpts = {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${newAccess}`,
      },
    }
    return await requestWithRefresh(url, newOpts, true)
  } catch (err) {
    clearTokens()
    return res
  }
}

export async function get<T = any>(
  url: string,
  params?: Record<string, any>
): Promise<ApiResponse<T>> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]) as any
      ).toString()
    : ''
  const opts: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  }
  const res = await requestWithRefresh(`${url}${qs}`, opts)
  return handleResponse(res, isAuthUrl(url))
}

export async function post<T = any>(
  url: string,
  data?: any,
  useForm = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...authHeaders() }
  let body: any
  if (useForm) {
    body = data
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(data ?? {})
  }

  const opts: RequestInit = {
    method: 'POST',
    headers,
    body,
  }
  const res = await requestWithRefresh(url, opts)
  return handleResponse(res, isAuthUrl(url))
}

export async function put<T = any>(
  url: string,
  data?: any,
  useForm = false
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { ...authHeaders() }
  let body: any
  if (useForm) {
    body = data
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(data ?? {})
  }

  const opts: RequestInit = {
    method: 'PUT',
    headers,
    body,
  }
  const res = await requestWithRefresh(url, opts)
  return handleResponse(res, isAuthUrl(url))
}

export async function patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  const opts: RequestInit = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data ?? {}),
  }
  const res = await requestWithRefresh(url, opts)
  return handleResponse(res, isAuthUrl(url))
}

export async function del<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
  const opts: RequestInit = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: data !== undefined ? JSON.stringify(data) : undefined,
  }
  const res = await requestWithRefresh(url, opts)
  return handleResponse(res, isAuthUrl(url))
}

export function setTokens({
  accessToken,
  refreshToken,
}: {
  accessToken?: string
  refreshToken?: string
}) {
  try {
    if (accessToken) tokenManager.setAccessToken(accessToken)
    if (refreshToken) tokenManager.setRefreshToken(refreshToken)
  } catch {}
}

export function clearTokens() {
  try {
    tokenManager.clearAll()
  } catch {}
}

export default { get, post, put, patch, del, setTokens, clearTokens }
