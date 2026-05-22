import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useLightboxStore } from '@/stores/ui/useLightboxStore'

export default function ImageLightbox() {
  const { src, isOpen, close } = useLightboxStore()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  if (!isOpen || !src) return null

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 p-4 pointer-events-auto"
      onClick={(e) => { e.stopPropagation(); close() }}
      role="dialog"
      aria-modal="true"
      aria-label="Ảnh phóng to"
    >
      <button
        type="button"
        className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/60"
        onClick={(e) => { e.stopPropagation(); close() }}
        aria-label="Đóng"
      >
        <X className="size-4" />
      </button>
      <img
        src={src}
        alt="Ảnh phóng to"
        className="max-h-[92vh] max-w-[92vw] rounded-md object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  )
}
