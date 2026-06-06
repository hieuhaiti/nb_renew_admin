export const BUSINESS_TYPE_OPTIONS = [
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'tour', label: 'Lữ hành' },
  { value: 'transport', label: 'Vận chuyển' },
  { value: 'restaurant', label: 'Nhà hàng' },
  { value: 'entertainment', label: 'Trải nghiệm/giải trí' },
  { value: 'other', label: 'Khác' },
] as const

export type BusinessType = (typeof BUSINESS_TYPE_OPTIONS)[number]['value']

export const BUSINESS_TYPE_LABEL = Object.fromEntries(
  BUSINESS_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>

const LEGACY_BUSINESS_TYPE_MAP: Record<string, BusinessType> = {
  service_provider: 'other',
  san_xuat: 'other',
  nha_hang: 'restaurant',
  ban_le: 'other',
  lu_hanh: 'tour',
  khu_du_lich: 'other',
}

export function normalizeBusinessType(value: string | null | undefined): BusinessType {
  if (!value) return 'other'
  if (BUSINESS_TYPE_OPTIONS.some((item) => item.value === value)) return value as BusinessType
  return LEGACY_BUSINESS_TYPE_MAP[value] ?? 'other'
}
