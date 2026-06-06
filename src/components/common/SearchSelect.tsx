import { useState, useRef } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ChevronDown, Check } from 'lucide-react'

export interface SearchSelectOption {
  value: string
  label: string
}

interface SearchSelectProps {
  options: SearchSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  isLoading?: boolean
  emptyMessage?: string
  filterOptions?: boolean
  onSearchChange?: (value: string) => void
}

export function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Chọn...',
  searchPlaceholder = 'Tìm kiếm...',
  className,
  disabled,
  isLoading = false,
  emptyMessage = 'Không có kết quả',
  filterOptions = true,
  onSearchChange,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    filterOptions && search.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
      : options

  const selectedLabel = options.find((o) => o.value === value)?.label

  function handleOpenChange(o: boolean) {
    setOpen(o)
    if (!o) {
      setSearch('')
      onSearchChange?.('')
    } else setTimeout(() => inputRef.current?.focus(), 30)
  }

  function handleSelect(val: string) {
    onValueChange(val)
    setOpen(false)
    setSearch('')
    onSearchChange?.('')
  }

  function handleSearchChange(nextSearch: string) {
    setSearch(nextSearch)
    onSearchChange?.(nextSearch)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          className={cn(
            'border-input bg-background ring-offset-background focus:ring-ring flex h-10 items-center justify-between rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            !selectedLabel && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{selectedLabel ?? placeholder}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0"
        style={{ width: triggerRef.current ? triggerRef.current.offsetWidth : undefined }}
      >
        <div className="border-b p-2">
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-60 overflow-y-auto py-1">
          {isLoading && filtered.length === 0 ? (
            <div className="text-muted-foreground py-2 text-center text-sm">
              Đang tải dữ liệu...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-muted-foreground py-2 text-center text-sm">{emptyMessage}</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground flex w-full cursor-default items-center px-3 py-2 text-sm',
                  opt.value === value && 'bg-accent/50 font-medium'
                )}
                onClick={() => handleSelect(opt.value)}
              >
                <Check
                  className={cn(
                    'mr-2 size-4 shrink-0',
                    opt.value === value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
