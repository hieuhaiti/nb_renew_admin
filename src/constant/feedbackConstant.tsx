// Priority
export const PRIORITY_LABEL: Record<string, string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  critical: 'Khẩn cấp',
}

export const PRIORITY_CLASS: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  normal: 'bg-primary/10 text-primary border-primary/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const PRIORITY_DOT: Record<string, string> = {
  low: 'bg-muted-foreground',
  normal: 'bg-primary',
  high: 'bg-warning',
  critical: 'bg-destructive',
}

// Processing status
export const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã xử lý',
  rejected: 'Từ chối',
  closed: 'Đóng',
}

export const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  in_progress: 'bg-primary/10 text-primary border-primary/20',
  resolved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  closed: 'bg-muted text-muted-foreground border-border',
}

export const STATUS_DOT: Record<string, string> = {
  pending: 'bg-warning',
  in_progress: 'bg-primary',
  resolved: 'bg-success',
  rejected: 'bg-destructive',
  closed: 'bg-muted-foreground',
}

// Moderation status
export const MOD_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
}

export const MOD_CLASS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  approved: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const MOD_DOT: Record<string, string> = {
  pending: 'bg-warning',
  approved: 'bg-success',
  rejected: 'bg-destructive',
}
