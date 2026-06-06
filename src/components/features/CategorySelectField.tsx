import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { SearchSelect } from '@/components/common/SearchSelect'
import { mapAdminCategoryService, useApiQuery } from '@/service'
import type { ApiResponse, MapAdminCategory, MapAdminCategoryListData } from '@/types/api'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { getMapAdminCategoryItems, getMapAdminCategoryName } from '@/lib/mapAdminCategory'

interface CategorySelectFieldProps {
  value: string
  onValueChange: (value: string) => void
  enabled?: boolean
  activeOnly?: boolean
  label?: string
  placeholder?: string
  required?: boolean
  showLabel?: boolean
  includeAllOption?: boolean
  allOptionLabel?: string
  containerClassName?: string
  triggerClassName?: string
}

export default function CategorySelectField({
  value,
  onValueChange,
  enabled = true,
  activeOnly = false,
  label = 'Danh mục',
  placeholder = 'Chọn danh mục',
  required = true,
  showLabel = true,
  includeAllOption = false,
  allOptionLabel = 'Tất cả danh mục',
  containerClassName,
  triggerClassName,
}: CategorySelectFieldProps) {
  const [categorySearch, setCategorySearch] = useState<string>('')
  const debouncedSearch = useDebounce(categorySearch, 500)

  const categoryQuery = useApiQuery(
    ['categories', { page: 1, limit: 50, search: debouncedSearch, activeOnly }],
    () =>
      mapAdminCategoryService.getAll({
        page: 1,
        limit: 50,
        sortBy: 'created_at',
        sortOrder: 'DESC',
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(activeOnly && { is_active: true }),
      }),
    { enabled },
    false,
    false
  )

  const categories = getMapAdminCategoryItems(
    (categoryQuery.data as ApiResponse<MapAdminCategoryListData>)?.data
  ).filter((category) => (activeOnly ? category.is_active : true))

  const isLoading = categoryQuery.isLoading || categoryQuery.isFetching
  const options = [
    ...(includeAllOption ? [{ value: 'all', label: allOptionLabel }] : []),
    ...categories.map((category: MapAdminCategory) => ({
      value: String(category.id),
      label: getMapAdminCategoryName(category),
    })),
  ]

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {showLabel && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <SearchSelect
        options={options}
        value={value}
        onValueChange={onValueChange}
        placeholder={placeholder}
        searchPlaceholder="Tìm kiếm danh mục..."
        className={cn('w-full', triggerClassName)}
        disabled={!enabled}
        isLoading={isLoading}
        filterOptions={false}
        onSearchChange={setCategorySearch}
        emptyMessage={
          categorySearch
            ? `Không tìm thấy kết quả cho "${categorySearch}"`
            : 'Không có dữ liệu danh mục'
        }
      />
    </div>
  )
}
