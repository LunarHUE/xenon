import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import type { CompositeOptions } from '@xenon-ui/core'
import { composite } from '@xenon-ui/core'
import type { AnyPart, CompositeDirection } from '@xenon-ui/core'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled } from 'solid-js'

import { ToolbarContext } from './context'
import type { ToolbarContextValue, ToolbarEntry } from './context'
import { ToolbarButton, ToolbarGroup, ToolbarLink, ToolbarSeparator } from './items'
import { spread } from '../spread'

/** Library-owned root settings, replacing matching host props. */
interface Own extends Pick<CompositeOptions<string>, 'orientation' | 'loop'> {
  /** Single arrow-navigation axis; defaults to horizontal. */
  orientation?: Exclude<CompositeOptions<string>['orientation'], 'both'>
  /** Explicit horizontal arrow direction, also forwarded to the root. Omission reads the nearest dir attribute after settling, defaulting to ltr. */
  dir?: CompositeOptions<string>['direction']
  /** Inherited button disabled state, defaulting to false. Links remain independent. */
  disabled?: boolean
  /** Receives the root host; custom components must forward it for ambient direction lookup. */
  ref?: unknown
}

/** Polymorphic root props with toolbar navigation settings; remaining host attributes override generated ones. */
export type ToolbarProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<Own, 'ref'>> & {
    /** Root host or forwarding component, defaulting to div. */
    as?: T
  }

/** Sorts entries with known hosts by document position, leaving pairs without both refs unchanged. */
function byDomOrder(a: ToolbarEntry, b: ToolbarEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Provides toolbar role and a shared roving tab stop for registered items.
 *
 * @remarks
 * Arrow, Home, and End navigation follows the core composite and moves DOM focus
 * after settling. Items register on the client; server output leaves each enabled
 * item tabbable until that registry exists. With no navigable items the root gets
 * tabindex=-1, not a sequential tab stop. Ambient direction is read after settling
 * and is not observed for later ancestor attribute changes. Registration sorts by
 * current DOM order; subsequent DOM moves alone do not trigger a new sort.
 * Supply an accessible toolbar name and forward props/ref from custom hosts.
 */
function ToolbarRoot<T extends ValidComponent = 'div'>(props: ToolbarProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'orientation',
    'loop',
    'disabled',
    'ref',
    'children'
  )

  // Keyed children unregister while Solid disposes an owned computation.
  const [entries, setEntries] = createSignal<ToolbarEntry[]>([], { ownedWrite: true })
  const [active, setActive] = createSignal<ToolbarEntry>()
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')

  const orientation = () => own.orientation ?? 'horizontal'
  const direction = () => own.dir ?? ambient()
  const disabled = () => booleanAttribute(own.disabled)

  const engine = createMemo(() =>
    composite<ToolbarEntry>({
      items: entries(),
      active: active(),
      disabled: (entry) => entry.disabled(),
      orientation: orientation(),
      direction: direction(),
      loop: own.loop ?? true,
      onActiveChange: (entry) => {
        setActive(entry)
        onSettled(() => entry.el?.focus())
      },
    })
  )

  let registered: ToolbarEntry[] = []
  /** Publishes a DOM-sorted registry and removes entries by identity during descendant cleanup. */
  const register = (entry: ToolbarEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      setEntries(registered)
    }
  }

  const navigable = () => entries().some((entry) => !entry.disabled())

  const context: ToolbarContextValue = {
    register,
    // Until the client registry exists, native items must remain keyboard reachable.
    part: (entry) => {
      const part = engine().parts.item(entry)
      return isServer || entries().length === 0
        ? { ...part, attrs: { ...part.attrs, tabindex: entry.disabled() ? -1 : 0 } }
        : part
    },
    orientation,
    disabled,
  }

  const content = createMemo(() => (
    <ToolbarContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </ToolbarContext>
  ))

  const part = (): AnyPart => ({
    attrs: {
      role: 'toolbar',
      'aria-orientation': orientation() === 'vertical' ? 'vertical' : undefined,
      'data-orientation': orientation(),
      tabindex: navigable() ? undefined : -1,
    },
    on: {},
  })

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(own.ref, node)
  }

  onSettled(() => {
    if (!el) return
    const nearest = el.closest('[dir]')
    const value = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(value === 'rtl' ? 'rtl' : 'ltr')
  })

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  return (
    <Host ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Host>
  )
}

/** Toolbar root with Button, Link, Separator, and Group parts, which require its context. */
export const Toolbar = Object.assign(ToolbarRoot, {
  /** Navigable button inheriting toolbar/group disabled state. */
  Button: ToolbarButton,
  /** Navigable anchor independent of toolbar/group disabled state. */
  Link: ToolbarLink,
  /** Structural separator, perpendicular by default and outside the item registry. */
  Separator: ToolbarSeparator,
  /** Group semantics and inherited disabled policy sharing the root navigation registry. */
  Group: ToolbarGroup,
})
