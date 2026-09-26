import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { SideBar } from '@/components/layout/SideBar'
import { useSidebarStore } from '@/stores/common/useSidebarStore'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isExpanded, isMobileOpen, setMobileOpen } = useSidebarStore()

  return (
    <div className="bg-background flex h-screen w-full overflow-hidden text-sm">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setMobileOpen(false)
          }}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-card border-border fixed top-0 left-0 z-50 h-screen border-r transition-all duration-300 ease-in-out md:z-20',
          isExpanded ? 'md:w-64' : 'md:w-16',
          'w-64 max-md:shadow-2xl',
          isMobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        )}
      >
        <SideBar />
      </aside>

      {/* Main content area */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out',
          isExpanded ? 'md:ml-64' : 'md:ml-16',
          'ml-0'
        )}
      >
        <Header />

        {/* Main content */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="flex min-h-0 flex-1 flex-col">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
