import { composite } from '@kit/core'
import type { AnyPart, CompositeDirection } from '@kit/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled } from 'solid-js'

import { ToolbarContext } from './context'
import type { ToolbarContextValue, ToolbarEntry } from './context'
import { ToolbarButton, ToolbarGroup, ToolbarLink, ToolbarSeparator } from './items'
import { spread } from '../spread'

interface Own {
  orientation?: 'horizontal' | 'vertical'
  dir?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

export type ToolbarProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function byDomOrder(a: ToolbarEntry, b: ToolbarEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

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
  const disabled = () => own.disabled ?? false

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
    own.ref?.(node)
  }

  onSettled(() => {
    if (!el) return
    const nearest = el.closest('[dir]')
    const value = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(value === 'rtl' ? 'rtl' : 'ltr')
  })

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

export const Toolbar = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  Link: ToolbarLink,
  Separator: ToolbarSeparator,
  Group: ToolbarGroup,
})
