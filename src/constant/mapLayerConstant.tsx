// ── Active status ─────────────────────────────────────────────────
export const ACTIVE_LABEL: Record<string, string> = {
  true: 'Đang hoạt động',
  false: 'Ngừng hoạt động',
}
export const ACTIVE_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/30',
  false: 'bg-muted text-muted-foreground border-border',
}
export const ACTIVE_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}
