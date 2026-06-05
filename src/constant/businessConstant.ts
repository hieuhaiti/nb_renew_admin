export const BUSINESS_TYPE_OPTIONS = [
  { value: 'hotel', label: 'Khách sạn' },
  { value: 'tour', label: 'Lữ hành' },
  { value: 'transport', label: 'Vận chuyển' },
  { value: 'restaurant', label: 'Nhà hàng' },
  { value: 'service_provider', label: 'Dịch vụ du lịch' },
  { value: 'entertainment', label: 'Trải nghiệm/giải trí' },
  { value: 'san_xuat', label: 'Sản xuất/OCOP' },
  { value: 'nha_hang', label: 'Nhà hàng' },
  { value: 'ban_le', label: 'Bán lẻ đặc sản' },
  { value: 'lu_hanh', label: 'Lữ hành' },
  { value: 'khu_du_lich', label: 'Khu du lịch' },
] as const

export const BUSINESS_TYPE_LABEL = Object.fromEntries(
  BUSINESS_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<string, string>
