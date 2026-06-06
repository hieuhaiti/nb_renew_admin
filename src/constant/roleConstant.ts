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

export const ROLE_CODES = {
  SYSTEM_ADMIN: 'system_admin',
  MINISTRY: 'ministry_manager',
  DEPARTMENT: 'department_manager',
  SPOT_OPERATOR: 'spot_operator',
  TRAVEL_COMPANY: 'travel_company',
  SERVICE_PROVIDER: 'service_provider',
  TOURIST: 'tourist',
} as const

export const BUSINESS_REPRESENTATIVE_ROLE_IDS = [
  ROLE_IDS.SPOT_OPERATOR,
  ROLE_IDS.TRAVEL_COMPANY,
  ROLE_IDS.SERVICE_PROVIDER,
] as const

export const BUSINESS_REPRESENTATIVE_ROLE_CODES = [
  ROLE_CODES.SPOT_OPERATOR,
  ROLE_CODES.TRAVEL_COMPANY,
  ROLE_CODES.SERVICE_PROVIDER,
] as const

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS]
export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES]
