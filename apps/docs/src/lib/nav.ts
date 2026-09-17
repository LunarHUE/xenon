/** One navigation row. */
export interface NavLink {
  label: string
  href: string
}

/** A titled group of rows. */
export interface NavSection {
  label: string
  links: NavLink[]
  /** Fold the group behind a disclosure. */
  collapsible?: boolean
}

/** Static docs navigation until content collections supply it. */
export const navigation: NavSection[] = [
  {
    label: 'Start here',
    links: [
      { label: 'Overview', href: '/' },
      { label: 'Installation', href: '/installation/' },
      { label: 'Components', href: '/components/' },
    ],
  },
  {
    label: 'Playgrounds',
    collapsible: true,
    links: [
      { label: 'Button', href: '/dev/button/' },
      { label: 'Tabs', href: '/dev/tabs/' },
      { label: 'Combobox', href: '/dev/combobox/' },
      { label: 'Breadcrumb', href: '/dev/breadcrumb/' },
      { label: 'Code block', href: '/dev/codeblock/' },
      { label: 'Drawer', href: '/dev/drawer/' },
      { label: 'Tooltip', href: '/dev/tooltip/' },
      { label: 'Toast', href: '/dev/toast/' },
      { label: 'Sidebar', href: '/dev/sidebar/' },
    ],
  },
]
