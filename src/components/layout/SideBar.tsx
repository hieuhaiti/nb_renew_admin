import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useSidebarStore } from '@/stores/common/useSidebarStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navConfig } from '@/constant/common'
import { useLocation, useNavigate } from 'react-router-dom'

export function SideBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isExpanded, setExpanded } = useSidebarStore() as {
    isExpanded: boolean
    setExpanded: (isExpanded: boolean) => void
    toggleSidebar: () => void
  }
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
    }
  }, [isExpanded])

  return (
    <div className="bg-card flex h-full flex-col">
      {/* Header của Sidebar */}
      <div className="flex items-center justify-between p-4">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">DL</span>
            </div>
            <span className="text-foreground font-semibold">Đắk Lắk Admin</span>
          </div>
        )}

        {!isExpanded && (
          <div className="flex w-full justify-center">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">DL</span>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {navConfig.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.subpath
            const hasSubItems = item.subItems && item.subItems.length > 0
            const isSubOpen = openSubMenu === item.path

            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'text-foreground hover:text-foreground-hover h-auto w-full justify-start gap-3 px-3 py-2',
                        isExpanded ? 'justify-start' : 'justify-center px-2',
                        isActive &&
                          'bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground'
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
                          className={` ${isActive ? 'text-secondary-foreground' : ''} flex w-full items-center justify-between truncate text-sm font-medium`}
                        >
                          {item.name}
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
                        {item.subItems?.map((sub) => (
                          <Button
                            key={sub.path}
                            variant={location.pathname === sub.path ? 'secondary' : 'ghost'}
                            className={cn(
                              'h-auto w-full justify-start gap-3 px-3 py-2',
                              isExpanded ? 'justify-start' : 'justify-center px-2',
                              location.pathname === sub.path &&
                                'bg-secondary text-secondary-foreground'
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMenuClick(sub.path)
                            }}
                          >
                            {isExpanded && (
                              <span className="truncate text-sm font-medium">{sub.name}</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {!isExpanded && (
                  <TooltipContent side="right" sideOffset={8}>
                    <p>{item.name}</p>
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
