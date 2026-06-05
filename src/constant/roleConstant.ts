export const ROLE_MAP: Record<number, string> = {
  1: 'Quản trị hệ thống',
  2: 'Bộ Văn hóa Thể thao và Du lịch',
  3: 'Sở Văn hóa Thể thao và Du lịch',
  4: 'Đơn vị vận hành điểm du lịch',
  5: 'Công ty lữ hành',
  6: 'Đơn vị cung cấp dịch vụ du lịch',
  7: 'Khách du lịch',
}

export const ROLE_IDS = {
  SYSTEM_ADMIN: 1,
  MINISTRY: 2,
  DEPARTMENT: 3,
  SPOT_OPERATOR: 4,
  TRAVEL_COMPANY: 5,
  SERVICE_PROVIDER: 6,
  TOURIST: 7,
} as const

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]
