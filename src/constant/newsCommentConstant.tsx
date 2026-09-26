// ── Approval status ───────────────────────────────────────────────
export const APPROVED_LABEL: Record<string, string> = {
  true: 'Đã duyệt',
  false: 'Chờ duyệt',
}
export const APPROVED_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/30',
  false: 'bg-warning/10 text-warning-foreground border-warning/30',
}
export const APPROVED_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-warning',
}
