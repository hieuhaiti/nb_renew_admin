export type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
  subpath?: string
  /** role_id[] được phép thấy mục này; falsy hoặc [] → hiển thị cho tất cả */
  authen?: number[]
  subItems?: {
    name: string
    path: string
    authen?: number[]
  }[]
}
