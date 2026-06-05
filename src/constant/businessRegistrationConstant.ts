import { ROLE_IDS } from '@/constant/roleConstant'

export const BUSINESS_REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
} as const

export type BusinessRegistrationStatus =
  (typeof BUSINESS_REGISTRATION_STATUS)[keyof typeof BUSINESS_REGISTRATION_STATUS]

export const BUSINESS_REGISTRATION_STATUS_LABEL: Record<BusinessRegistrationStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối duyệt',
  suspended: 'Tạm đình chỉ / ngưng hoạt động',
}

export const BUSINESS_APPROVAL_ROLE_IDS = [ROLE_IDS.DEPARTMENT] as const

export const BUSINESS_REGISTRATION_ROLE_IDS = [
  ROLE_IDS.SPOT_OPERATOR,
  ROLE_IDS.TRAVEL_COMPANY,
  ROLE_IDS.SERVICE_PROVIDER,
] as const
