import { toggleGroup } from '@kit/core'
import type { ToggleGroupMode } from '@kit/core'
import type { ToggleHost } from '@kit/core'
import type { CompositeDirection } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { ToggleGroupContext, useToggleGroup } from './context'
import type { ToggleGroupContextValue, ToggleGroupEntry } from './context'
import { gate } from '../internal/gate'
import { spread } from '../spread'

type GroupValue = string | readonly string[] | undefined

interface Shared {
  orientation?: 'horizontal' | 'vertical'
  dir?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

interface Single {
  mode?: 'single'
  value?: string
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
}

interface Multiple {
  mode: 'multiple'
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: readonly string[]) => void
}

type Own = Shared & { mode?: ToggleGroupMode } & {
  value?: GroupValue
  defaultValue?: GroupValue
  onValueChange?: (value: GroupValue) => void
  as?: ValidComponent
}

interface ItemOwn {
  value: string
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

export type ToggleGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Shared | 'mode' | 'value' | 'defaultValue' | 'onValueChange' | 'as'
> &
  Shared &
  (Single | Multiple) & { as?: T }

export type ToggleGroupItemProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  ItemOwn & { as?: T }

function byDomOrder(a: ToggleGroupEntry, b: ToggleGroupEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

function hostOf(as: ValidComponent | undefined): ToggleHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  return 'generic'
}

function ToggleGroupRoot<T extends ValidComponent = 'div'>(
  props: ToggleGroupProps<T>
): JSX.Element {
  const own = props as unknown as Own
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'mode',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'dir',
    'loop',
    'disabled',
    'ref',
    'children'
  )

  const [entries, setEntries] = createSignal<ToggleGroupEntry[]>([])
  const [active, setActive] = createSignal<string>()
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')
  const [internal, setInternal] = createSignal<GroupValue>(untrack(() => own.defaultValue))

  const mode = () => own.mode ?? 'single'
  const orientation = () => own.orientation ?? 'horizontal'
  const disabled = () => own.disabled ?? false
  const controlled = () => own.value !== undefined
  const current = () => own.value ?? internal()

  const entryFor = (value: string) => entries().find((entry) => entry.value() === value)

  const change = (next: GroupValue) => {
    if (!untrack(controlled)) setInternal(next)
    own.onValueChange?.(next)
  }

  const engine = createMemo(() =>
    toggleGroup<string>({
      items: entries().map((entry) => entry.value()),
      mode: mode(),
      value: current(),
      active: active(),
      disabled: disabled(),
      itemDisabled: (value) => entryFor(value)?.disabled() ?? false,
      host: (value) => entryFor(value)?.host() ?? 'button',
      orientation: orientation(),
      direction: own.dir ?? ambient(),
      loop: own.loop ?? true,
      onValueChange: change,
      onActiveChange: (value) => {
        setActive(value)
        onSettled(() => entryFor(value)?.el?.focus())
      },
    })
  )

  let registered: ToggleGroupEntry[] = []
  const register = (entry: ToggleGroupEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      setEntries(registered)
    }
  }

  const context: ToggleGroupContextValue = {
    register,
    part: (entry) => engine().parts.item(entry.value()),
    disabled,
  }

  const content = createMemo(() => (
    <ToggleGroupContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </ToggleGroupContext>
  ))

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
      {...spread(engine().parts.root, { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

function ToggleGroupItem<T extends ValidComponent = 'button'>(
  props: ToggleGroupItemProps<T>
): JSX.Element {
  const own = props as ItemOwn & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'disabled', 'ref')
  const context = useToggleGroup('ToggleGroup.Item')

  const entry: ToggleGroupEntry = {
    el: null,
    value: () => own.value,
    disabled: () => own.disabled ?? false,
    host: () => hostOf(own.as),
  }

  const interactive = () => !context.disabled() && !entry.disabled()

  const ref = (node: HTMLElement) => {
    entry.el = node
    own.ref?.(node)
  }

  onSettled(() => context.register(entry))

  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    gate(out, interactive)
    return out
  }

  return (
    <Dynamic
      component={(own.as ?? 'button') as ValidComponent}
      ref={ref}
      {...spread(context.part(entry), merged())}
    />
  )
}

export const ToggleGroup = Object.assign(ToggleGroupRoot, { Item: ToggleGroupItem })
