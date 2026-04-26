import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categoryService, useApiQuery } from '@/service'
import type { ApiResponse, CategoryListData } from '@/types/api'
import { Loader2, Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

interface Category {
  id: string | number
  name: string
  is_active: boolean
}

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
    ['categories', { page: 1, limit: 100, search: debouncedSearch, activeOnly }],
    () =>
      categoryService.getAll({
        page: 1,
        limit: 100,
        sortBy: 'id',
        sortOrder: 'ASC',
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(activeOnly && { is_active: true }),
      }),
    { enabled },
    false,
    false
  )

  const categories = (
    (categoryQuery.data as ApiResponse<CategoryListData>)?.data?.categories ?? []
  ).filter((category: Category) => (activeOnly ? category.is_active : true))

  const isLoading = categoryQuery.isLoading || categoryQuery.isFetching
  const hasItems = categories.length > 0 || includeAllOption

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {showLabel && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Select
        value={value}
        onValueChange={onValueChange}
        onOpenChange={(open) => {
          if (!open) setCategorySearch('')
        }}
      >
        <SelectTrigger className={cn('w-full', triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent
          position="popper"
          sideOffset={6}
          className="max-h-80 w-full min-w-[var(--radix-select-trigger-width)] overflow-hidden"
        >
          <div className="bg-popover sticky top-0 z-10 border-b px-2 py-2.5">
            <div className="relative flex items-center">
              <Search className="text-muted-foreground absolute left-2 h-4 w-4" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Tìm kiếm danh mục..."
                className="h-9 w-full pr-8 pl-8 focus-visible:ring-1"
              />
              {isLoading && (
                <Loader2 className="text-muted-foreground absolute right-2 h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          <div className="max-h-[220px] overflow-y-auto p-1">
            {isLoading && categories.length === 0 && !includeAllOption ? (
              <div className="text-muted-foreground flex items-center justify-center py-6 text-sm">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tải dữ liệu...
              </div>
            ) : hasItems ? (
              <>
                {includeAllOption && (
                  <SelectItem value="all" className="cursor-pointer">
                    {allOptionLabel}
                  </SelectItem>
                )}
                {categories.map((category: Category) => (
                  <SelectItem
                    key={category.id}
                    value={String(category.id)}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </>
            ) : (
              <div className="text-muted-foreground py-6 text-center text-sm">
                {categorySearch ? (
                  <>
                    Không tìm thấy kết quả cho <b>"{categorySearch}"</b>
                  </>
                ) : (
                  'Không có dữ liệu danh mục'
                )}
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}
