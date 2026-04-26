// ── Priority ─────────────────────────────────────────────────────
export const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Thường',
  high: 'Cao',
  urgent: 'Khẩn',
}
export const PRIORITY_CLASS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-300',
}
export const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-slate-400',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-600',
}

// ── Processing status ─────────────────────────────────────────────
export const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
  closed: 'Đóng',
}
export const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  closed: 'bg-slate-100 text-slate-500 border-slate-200',
}
export const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-green-500',
  rejected: 'bg-red-500',
  closed: 'bg-slate-400',
}

// ── Moderation status ─────────────────────────────────────────────
export const MOD_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}
export const MOD_CLASS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}
export const MOD_DOT: Record<string, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
}
