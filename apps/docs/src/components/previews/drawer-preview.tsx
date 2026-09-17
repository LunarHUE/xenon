import { createSignal, For } from 'solid-js'
import { Menu, X } from 'lucide'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerHandle,
} from '../ui/drawer'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

const sections = [
  { label: 'Start here', links: ['Overview', 'Installation', 'Components'] },
  { label: 'Guides', links: ['Composition', 'Styling', 'Accessibility'] },
  {
    label: 'Components',
    links: ['Accordion', 'Button', 'Checkbox', 'Collapsible', 'Field', 'Tabs', 'Toggle'],
  },
]

/** Sidebar link per registry sheet 04: 32px row, 12px inset, 1px outline when current. */
function NavLink(props: { label: string; current: boolean }) {
  return (
    <a
      href="#"
      aria-current={props.current ? 'page' : undefined}
      class={cn(
        'block min-h-8 border border-transparent px-3 py-[5px] leading-5 text-muted-foreground',
        'hover:bg-accent active:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        props.current &&
          'border-sidebar-primary bg-sidebar-selected font-medium text-sidebar-primary'
      )}
    >
      {props.label}
    </a>
  )
}

/** Compact docs page: the drawer holds the sidebar that has no room at this width. */
function NavigationDrawer(props: { theme: 'light' | 'dark' }) {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="border border-foreground bg-muted">
      <Drawer open={open()} onOpenChange={setOpen}>
        <div class="flex items-center gap-4 border-b border-foreground bg-background p-4">
          <DrawerTrigger
            variant="outline"
            size="icon-sm"
            class="size-6"
            aria-label="Open navigation"
          >
            <Icon icon={Menu} class="size-[18px]" />
          </DrawerTrigger>
          <span>Components / Button</span>
        </div>
        <DrawerContent
          aria-label={`${props.theme} navigation`}
          data-theme={props.theme}
          class="gap-0"
        >
          <DrawerHeader class="-mx-6 -mt-6 mb-2 border-b border-foreground bg-background p-4">
            <DrawerClose
              variant="outline"
              size="icon-sm"
              class="size-6"
              aria-label="Close navigation"
            >
              <Icon icon={X} class="size-[18px]" />
            </DrawerClose>
            <span class="me-auto">Components / Button</span>
          </DrawerHeader>
          <For each={sections}>
            {(section) => (
              <nav aria-label={section.label}>
                <div class="mb-1.5 min-h-8 border-b border-foreground px-3 pt-5 pb-2 font-mono text-[11px] font-medium uppercase leading-[19px] tracking-[0.08em] text-foreground">
                  {section.label}
                </div>
                <For each={section.links}>
                  {(label) => <NavLink label={label} current={label === 'Button'} />}
                </For>
              </nav>
            )}
          </For>
        </DrawerContent>
      </Drawer>
      <div class="min-h-40 px-4 py-7 text-muted-foreground">Button documentation</div>
    </div>
  )
}

/** Bottom sheet with the drag handle, to exercise the swipe path. */
function BottomSheet(props: { theme: 'light' | 'dark' }) {
  return (
    <Drawer side="bottom" dragThreshold="96px">
      <DrawerTrigger variant="outline">Notification settings</DrawerTrigger>
      <DrawerContent data-theme={props.theme}>
        <DrawerHandle aria-label="Close notification settings" />
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerClose variant="outline" size="icon-sm" aria-label="Close">
            <Icon icon={X} />
          </DrawerClose>
        </DrawerHeader>
        <DrawerDescription>
          Drag the bar down past the threshold, press Escape, or click outside to dismiss.
        </DrawerDescription>
        <label class="mt-6 flex items-center gap-3">
          <input type="checkbox" checked class="size-4 accent-primary" />
          Send a weekly digest
        </label>
        <div class="mt-8 flex justify-end">
          <DrawerClose>Done</DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function Specimens(props: { theme: 'light' | 'dark' }) {
  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="grid gap-8 lg:grid-cols-2">
        <div class="min-w-0 space-y-3">
          <h3 class="text-sm text-muted-foreground">Navigation drawer, left</h3>
          <NavigationDrawer theme={props.theme} />
        </div>
        <div class="min-w-0 space-y-3">
          <h3 class="text-sm text-muted-foreground">Bottom sheet with drag handle</h3>
          <BottomSheet theme={props.theme} />
        </div>
      </div>
    </section>
  )
}

export default function DrawerPreview() {
  return (
    <div class="space-y-8">
      <Specimens theme="light" />
      <Specimens theme="dark" />
    </div>
  )
}
