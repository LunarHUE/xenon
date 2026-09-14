import type { CompositeDirection } from '@kit/core'
import { accordion } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { AccordionContext } from './context'
import type { AccordionContextValue, AccordionEntry } from './context'
import { AccordionItem, AccordionPanel, AccordionTrigger } from './items'
import { spread } from '../spread'

export type AccordionValue = string | readonly string[] | undefined

interface Own {
  value?: AccordionValue
  defaultValue?: AccordionValue
  onValueChange?: (value: AccordionValue) => void
  mode?: 'single' | 'multiple'
  collapsible?: boolean
  orientation?: 'horizontal' | 'vertical'
  dir?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  forceMount?: boolean
  region?: boolean
  ref?: (el: HTMLElement) => void
}

export type AccordionProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function byDomOrder(a: AccordionEntry, b: AccordionEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

function AccordionRoot<T extends ValidComponent = 'div'>(props: AccordionProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'defaultValue',
    'onValueChange',
    'mode',
    'collapsible',
    'orientation',
    'dir',
    'loop',
    'disabled',
    'forceMount',
    'region',
    'ref',
    'children'
  )

  // Keyed item disposal unregisters while its parent computation is running.
  const [entries, setEntries] = createSignal<AccordionEntry[]>([], { ownedWrite: true })
  const [internal, setInternal] = createSignal<AccordionValue>(untrack(() => own.defaultValue))
  const [active, setActive] = createSignal<string>()
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')

  const controlled = () => own.value !== undefined
  const value = () => own.value ?? internal()
  const disabled = () => own.disabled ?? false
  const forceMount = () => own.forceMount ?? false

  const change = (next: AccordionValue) => {
    if (!untrack(controlled)) setInternal(next)
    own.onValueChange?.(next)
  }

  const build = (list: readonly AccordionEntry[]) => {
    const byValue = new Map(list.map((entry) => [entry.value, entry]))
    return accordion<string>({
      items: list.map((entry) => entry.value),
      value: value(),
      mode: own.mode ?? 'single',
      collapsible: own.collapsible,
      active: active(),
      disabled: disabled(),
      itemDisabled: (item) => byValue.get(item)?.disabled() ?? false,
      ids: (item) => byValue.get(item)?.ids(),
      status: (item) => byValue.get(item)?.status(),
      forceMount: forceMount(),
      region: own.region,
      orientation: own.orientation ?? 'vertical',
      direction: own.dir ?? ambient(),
      loop: own.loop,
      onValueChange: change,
      onActiveChange: (item) => {
        setActive(item)
        onSettled(() => byValue.get(item)?.el?.focus())
      },
    })
  }
  const engine = createMemo(() => build(entries()))
  const forEntry = (entry: AccordionEntry) =>
    entries().includes(entry) ? engine() : build([...entries(), entry])

  let registered: AccordionEntry[] = []
  const register = (entry: AccordionEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      setEntries(registered)
    }
  }

  const context: AccordionContextValue = {
    register,
    item: (entry) => forEntry(entry).parts.item(entry.value),
    trigger: (entry) => forEntry(entry).parts.trigger(entry.value),
    panel: (entry) => forEntry(entry).parts.panel(entry.value),
    isOpen: (item) => engine().state.isOpen(item),
    disabled,
    forceMount,
  }

  const inner = createMemo(() => (
    <AccordionContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </AccordionContext>
  ))

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  onSettled(() => {
    if (!el) return
    const nearest = el.closest('[dir]')
    const resolved = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(resolved === 'rtl' ? 'rtl' : 'ltr')
  })

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(engine().parts.root, { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
})
