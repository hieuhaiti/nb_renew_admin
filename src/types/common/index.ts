import type { PageAccess } from '@/constant/permissionConstant'

export type NavItem = {
  name: string
  roleNames?: Partial<Record<number, string>>
  icon: React.ReactNode
  path: string
  subpath?: string
  /** Permission requirement used for dynamic backend-driven access control. */
  access?: PageAccess
  subItems?: {
    name: string
    roleNames?: Partial<Record<number, string>>
    path: string
    access?: PageAccess
  }[]
}
