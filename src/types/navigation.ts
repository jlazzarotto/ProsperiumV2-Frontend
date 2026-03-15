export interface NavigationItem {
  label: string
  href: string
  iconKey?: string | null
  permissionKey?: string
  locked?: boolean
}

export interface NavigationCategory {
  code?: string
  label: string
  items: NavigationItem[]
}
