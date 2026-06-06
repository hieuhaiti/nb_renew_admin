import { ROLE_IDS } from '@/constant/roleConstant'
import { useAuthStore } from '@/stores/common/useAuthStore'

export function useProvinceScope() {
  const user = useAuthStore((s) => s.user)
  const provinceCode = user?.province_code?.trim() ?? ''
  const canEditProvinceCode = user?.role_id === ROLE_IDS.SYSTEM_ADMIN

  return {
    provinceCode,
    canEditProvinceCode,
    isProvinceCodeLocked: !canEditProvinceCode,
  }
}
