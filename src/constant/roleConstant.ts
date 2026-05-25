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

/**
 * Nhóm role dùng cho route guard và permission check.
 * Đây là source of truth duy nhất cho tập hợp role — không hardcode [1,2,3] trong App.tsx hay pages.
 */
export const ROLE_GROUPS = {
  /** Tất cả role được phép vào admin panel (loại trừ Tourist = 7) */
  ALL_ADMIN: [1, 2, 3, 4, 5, 6],
  /** Admin + Bộ + Sở — quản lý nội dung hệ thống và báo cáo */
  MANAGEMENT: [1, 2, 3],
  /** Admin + Bộ + Sở + Đơn vị vận hành — quản lý điểm, nội dung địa phương */
  CONTENT: [1, 2, 3, 4],
  /** Admin + Bộ + Sở + Đơn vị vận hành + Công ty lữ hành — quản lý tour */
  TOUR: [1, 2, 3, 4, 5],
  /** Công ty lữ hành + Dịch vụ — doanh nghiệp xem đánh giá của mình */
  ENTERPRISE: [5, 6],
} as const
