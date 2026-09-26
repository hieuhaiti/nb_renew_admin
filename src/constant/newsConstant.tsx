// ── Published status ──────────────────────────────────────────────
export const PUBLISHED_LABEL: Record<string, string> = {
  true: 'Xuất bản',
  false: 'Nháp',
}
export const PUBLISHED_CLASS: Record<string, string> = {
  true: 'bg-success/10 text-success border-success/30',
  false: 'bg-muted text-muted-foreground border-border',
}
export const PUBLISHED_DOT: Record<string, string> = {
  true: 'bg-success',
  false: 'bg-muted-foreground',
}

// ── Featured status ───────────────────────────────────────────────
export const FEATURED_LABEL: Record<string, string> = {
  true: 'Nổi bật',
  false: 'Không',
}
export const FEATURED_CLASS: Record<string, string> = {
  true: 'bg-warning/10 text-warning-foreground border-warning/30',
  false: 'bg-muted text-muted-foreground border-border',
}
export const FEATURED_DOT: Record<string, string> = {
  true: 'bg-warning',
  false: 'bg-muted-foreground/50',
}
