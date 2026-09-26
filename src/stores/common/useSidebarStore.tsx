import { create } from 'zustand'

export interface SidebarState {
  isExpanded: boolean
  isMobileOpen: boolean
  setExpanded: (isExpanded: boolean) => void
  setMobileOpen: (open: boolean) => void
  toggleSidebar: () => void
  toggleMobile: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isExpanded: true,
  isMobileOpen: false,
  setExpanded: (isExpanded: boolean) => set({ isExpanded }),
  setMobileOpen: (isMobileOpen: boolean) => set({ isMobileOpen }),
  toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
}))
