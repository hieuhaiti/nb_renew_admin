import { create } from 'zustand'

interface LightboxStore {
  src: string | null
  isOpen: boolean
  open: (src: string) => void
  close: () => void
}

export const useLightboxStore = create<LightboxStore>((set) => ({
  src: null,
  isOpen: false,
  open: (src) => set({ src, isOpen: true }),
  close: () => set({ isOpen: false }),
}))
