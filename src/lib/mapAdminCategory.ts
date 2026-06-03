import type { MapAdminCategory, MapAdminCategoryListData } from '@/types/api'

export function getMapAdminCategoryItems(
  data?: MapAdminCategoryListData | null
): MapAdminCategory[] {
  return data?.items ?? data?.categories ?? []
}

export function getMapAdminCategoryName(category?: MapAdminCategory | null): string {
  return category?.name_vi || category?.name || category?.name_en || category?.code || '-'
}
