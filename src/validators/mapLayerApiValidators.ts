import { z } from 'zod'
import type {
  AddPermissionBody,
  CreateApiKeyBody,
  CreateMapLayerApiBody,
  UpdateMapLayerApiBody,
} from '@/types/api'

const endpointUrlRegex = /^(https?:\/\/.+|\/[^\s]*)$/

export const createMapLayerApiSchema = z.object({
  category_id: z.number().int().min(1),
  name: z.string().trim().min(2).max(255),
  slug: z.string().trim().min(2).max(255),
  description: z.string().nullable().optional(),
  endpoint_url: z.string().trim().regex(endpointUrlRegex),
  http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  status: z.enum(['draft', 'published']),
})

export const updateMapLayerApiSchema = createMapLayerApiSchema.partial().refine(
  (value) => Object.values(value).some((field) => field !== undefined),
  { message: 'Cần ít nhất 1 trường thay đổi' }
)

export const listQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  category_id: z.number().int().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  search: z.string().trim().optional(),
  sortBy: z
    .enum(['id', 'name', 'slug', 'created_at', 'updated_at', 'published_at'])
    .optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
})

export const addPermissionSchema = z.object({
  principal_type: z.enum(['user', 'role', 'public']),
  user_id: z.number().int().min(1).nullable().optional(),
  role_id: z.number().int().min(1).nullable().optional(),
  can_view: z.boolean().optional(),
  can_edit: z.boolean().optional(),
  can_delete: z.boolean().optional(),
})

export const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(255),
  expires_at: z
    .string()
    .datetime({ offset: true })
    .nullable()
    .optional(),
  map_layer_api_ids: z.array(z.number().int().min(1)).min(1),
})

export const createShareKeySchema = createApiKeySchema

export const revokeKeyParamSchema = z.object({
  apiKeyId: z.number().int().positive(),
})

const allowedHttpMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const)
const allowedStatuses = new Set(['draft', 'published'] as const)

function normalizeTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeNullableTrimmedString(value: unknown): string | null {
  const normalized = normalizeTrimmedString(value)
  return normalized ? normalized : null
}

function normalizeCategoryId(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function normalizeMapLayerApiInput(
  values: Partial<CreateMapLayerApiBody>
): CreateMapLayerApiBody {
  const method = values.http_method
  const status = values.status

  return {
    category_id: normalizeCategoryId(values.category_id),
    name: normalizeTrimmedString(values.name),
    slug: normalizeTrimmedString(values.slug),
    description: normalizeNullableTrimmedString(values.description),
    endpoint_url: normalizeTrimmedString(values.endpoint_url),
    http_method: method && allowedHttpMethods.has(method) ? method : 'GET',
    status: status && allowedStatuses.has(status) ? status : 'draft',
  }
}

export function buildUpdatePayload(
  original: Partial<CreateMapLayerApiBody>,
  current: Partial<CreateMapLayerApiBody>
): UpdateMapLayerApiBody {
  const next = normalizeMapLayerApiInput(current)
  const prev = normalizeMapLayerApiInput(original)

  const payload: UpdateMapLayerApiBody = {}

    ; (Object.keys(next) as (keyof CreateMapLayerApiBody)[]).forEach((key) => {
      if (next[key] !== prev[key]) {
        payload[key] = next[key] as never
      }
    })

  return payload
}

export function validateCreatePayload(values: CreateMapLayerApiBody) {
  return createMapLayerApiSchema.safeParse(normalizeMapLayerApiInput(values))
}

export function validateUpdatePayload(values: UpdateMapLayerApiBody) {
  return updateMapLayerApiSchema.safeParse(values)
}

export function validatePermissionPayload(values: AddPermissionBody) {
  return addPermissionSchema.safeParse(values)
}

export function validateApiKeyPayload(values: CreateApiKeyBody) {
  return createApiKeySchema.safeParse(values)
}

export function validateShareKeyPayload(values: CreateApiKeyBody) {
  return validateApiKeyPayload(values)
}

export function getMappedErrorMessage(error: unknown, fallback: string) {
  const status = (error as { status?: number; body?: { status?: number } })?.status
  const bodyStatus = (error as { body?: { status?: number } })?.body?.status
  const code = status ?? bodyStatus
  const serverMessage = (error as { body?: { message?: string }; message?: string })?.body?.message

  if (serverMessage) return serverMessage

  if (code === 401) return 'Token/apikey không hợp lệ hoặc đã hết hạn.'
  if (code === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (code === 404) return 'Dữ liệu không tồn tại hoặc đã bị xóa.'
  if (code === 409) return 'Slug đã tồn tại. Vui lòng chọn slug khác.'
  if (code === 400) return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.'

  return fallback
}
