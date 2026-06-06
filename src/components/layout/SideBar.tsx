import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useSidebarStore } from '@/stores/common/useSidebarStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navConfig } from '@/constant/common'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/common/useAuthStore'
import { canAccessPage, type PageAccess } from '@/constant/permissionConstant'

function canAccess(access: PageAccess | undefined, permissions: readonly string[]): boolean {
  if (!access) return true
  return canAccessPage(permissions, access)
}

function getNavName(
  item: { name: string; roleNames?: Partial<Record<number, string>> },
  roleId?: number
) {
  return (roleId ? item.roleNames?.[roleId] : undefined) ?? item.name
}

export function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isExpanded, setExpanded } = useSidebarStore() as {
    isExpanded: boolean
    setExpanded: (isExpanded: boolean) => void
    toggleSidebar: () => void
  }
  const permissions = useAuthStore((s) => s.permissions)
  const roleId = useAuthStore((s) => s.user?.role_id)
  // Track which nav item's submenu is open (accordion: only one at a time)
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null)

  const handleMenuClick = (path: string) => {
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }

    navigate(path)
  }

  useEffect(() => {
    if (!isExpanded) {
      setOpenSubMenu(null)
      return
    }
    const matchedParent = navConfig.find((item) =>
      item.subItems?.some((sub) => location.pathname === sub.path)
    )
    if (matchedParent) setOpenSubMenu(matchedParent.path)
  }, [location.pathname, isExpanded])

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Header của Sidebar */}
      <div className="flex items-center justify-between p-4">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">NB</span>
            </div>
            <span className="text-foreground font-semibold">Ninh Bình Admin</span>
          </div>
        )}

        {!isExpanded && (
          <div className="flex w-full justify-center">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">NB</span>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navConfig
            .filter((item) => {
              if (!canAccess(item.access, permissions)) return false
              // Ẩn parent nếu có subItems nhưng tất cả đều bị filter
              if (item.subItems && item.subItems.length > 0) {
                return item.subItems.some((s) => canAccess(s.access, permissions))
              }
              return true
            })
            .map((item) => {
              const navName = getNavName(item, roleId)
              const visibleSubItems = item.subItems?.filter((s) => canAccess(s.access, permissions))
              const hasSubItems = !!visibleSubItems && visibleSubItems.length > 0
              const isSubItemActive =
                hasSubItems && visibleSubItems!.some((sub) => location.pathname === sub.path)
              const isDirectlyActive =
                !isSubItemActive &&
                (location.pathname === item.path ||
                  location.pathname === item.subpath ||
                  location.pathname.startsWith(item.path + '/'))
              const isActive = isDirectlyActive || isSubItemActive
              const isSubOpen = openSubMenu === item.path

              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <div className="w-full">
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={cn(
                          'text-foreground hover:text-foreground-hover h-auto w-full justify-start gap-3 px-3 py-2',
                          isExpanded ? 'justify-start' : 'justify-center px-2',
                          isDirectlyActive &&
                            'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                          isSubItemActive &&
                            !isDirectlyActive &&
                            'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                        )}
                        onClick={(e) => {
                          if (hasSubItems) {
                            e.stopPropagation()
                            setExpanded(true)
                            setOpenSubMenu(isSubOpen ? null : item.path)
                          } else {
                            handleMenuClick(item.path)
                          }
                        }}
                      >
                        {item.icon}
                        {isExpanded && (
                          <span
                            className={cn(
                              'flex w-full items-center justify-between truncate text-sm font-medium',
                              isDirectlyActive && 'text-primary-foreground',
                              isSubItemActive && !isDirectlyActive && 'text-primary'
                            )}
                          >
                            {navName}
                            {hasSubItems && (
                              <Button asChild variant="ghost" size="icon" className="h-6 w-6 p-0">
                                {isSubOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </span>
                        )}
                      </Button>

                      {hasSubItems && isSubOpen && isExpanded && (
                        <div className="mt-1 space-y-1 pl-6">
                          {visibleSubItems?.map((sub) => {
                            const subName = getNavName(sub, roleId)

                            return (
                              <Button
                                key={sub.path}
                                variant={location.pathname === sub.path ? 'default' : 'ghost'}
                                className={cn(
                                  'h-auto w-full justify-start gap-3 px-3 py-2',
                                  isExpanded ? 'justify-start' : 'justify-center px-2',
                                  location.pathname === sub.path &&
                                    'bg-primary text-primary-foreground'
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMenuClick(sub.path)
                                }}
                              >
                                {isExpanded && (
                                  <span className="truncate text-sm font-medium">{subName}</span>
                                )}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{navName}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
        </div>
      </nav>
    </div>
  )
}
