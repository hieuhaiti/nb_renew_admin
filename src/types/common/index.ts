export type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
  subpath?: string
  subItems?: {
    name: string
    path: string
  }[]
}
