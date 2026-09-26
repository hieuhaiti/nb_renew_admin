// ── Publish status ────────────────────────────────────────────────
export const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  draft: 'Draft',
}
export const STATUS_CLASS: Record<string, string> = {
  published: 'bg-success/10 text-success border-success/30',
  draft: 'bg-muted text-muted-foreground border-border',
}
export const STATUS_DOT: Record<string, string> = {
  published: 'bg-success',
  draft: 'bg-muted-foreground',
}
