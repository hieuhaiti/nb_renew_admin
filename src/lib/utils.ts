import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
const BASE_URL = import.meta.env.VITE_BASE_URL

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseLink(url: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  } else {
    if (url.startsWith('/')) {
      return `${BASE_URL}${url}`
    } else {
      return `${BASE_URL}/${url}`
    }
  }
}

export function isPdf(url: string): boolean {
  if (!url) return false
  return url.toLowerCase().endsWith('.pdf')
}

export function hexToRgba(hex: string, alpha = 0.12): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(148,163,184,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}
