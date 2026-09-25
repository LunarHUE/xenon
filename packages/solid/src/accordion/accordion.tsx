import type { AccordionOptions } from '@xenon-ui/core'
import type { CompositeDirection } from '@xenon-ui/core'
import { accordion } from '@xenon-ui/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { AccordionContext } from './context'
import type { AccordionContextValue, AccordionEntry } from './context'
import { AccordionItem, AccordionPanel, AccordionTrigger } from './items'
import { spread } from '../spread'

/** Single-mode key or empty state, or a multiple-mode array of open keys. */
export type AccordionValue = AccordionOptions<string>['value']

/** Root-owned selection, navigation, and mounting props. */
interface Own extends Omit<
  AccordionOptions<string>,
  'items' | 'active' | 'itemDisabled' | 'ids' | 'status' | 'direction' | 'onActiveChange'
> {
  /** Controlled open values when defined; undefined uses internal state. Single mode uses the first array entry. */
  value?: AccordionOptions<string>['value']
  /** Initial uncontrolled open values, defaulting to empty; subsequent changes are ignored. */
  defaultValue?: AccordionOptions<string>['value']
  /** Reports accepted open-value proposals after updating uncontrolled state; no callback on initialization or navigation. */
  onValueChange?: AccordionOptions<string>['onValueChange']
  /** Horizontal navigation direction. Omission samples nearest dir or document dir after settling, initially ltr; not forwarded as a root attribute. */
  dir?: AccordionOptions<string>['direction']
  /** Receives the root host; custom components must forward it for ambient direction lookup. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic accordion root props with controlled or uncontrolled open values. */
export type AccordionProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Root host, defaulting to div; custom components must forward props and refs. */
    as?: T
  }

/** Sorts by known trigger hosts; pairs with missing hosts retain registration order. */
function byDomOrder(a: AccordionEntry, b: AccordionEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Owns open selection, registered trigger order, and independent navigation focus.
 * Defined value selects controlled mode on each read; undefined releases control.
 * Item registration and requested DOM focus run after settling. Registration sorts
 * current trigger positions; later DOM-only moves are not observed. Ambient reading
 * direction is sampled after settling without observing ancestor attribute changes.
 */
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

  /** Stores proposals only while uncontrolled, then invokes the current callback. */
  const change = (next: AccordionValue) => {
    if (!untrack(controlled)) setInternal(next)
    own.onValueChange?.(next)
  }

  /** Builds core state from supplied registrations and their current per-item readers. */
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
  /** Includes an unregistered item provisionally so initial/server part output has IDs and state. */
  const forEntry = (entry: AccordionEntry) =>
    entries().includes(entry) ? engine() : build([...entries(), entry])

  let registered: AccordionEntry[] = []
  /** Publishes a trigger-sorted entry list and removes only this identity during cleanup. */
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

/**
 * Accordion root with item, trigger, and panel parts. Item keys must be unique.
 * Native triggers keep their normal tab stops; arrow navigation is independent
 * of opening. The caller supplies trigger names and panel animation styles.
 */
export const Accordion = Object.assign(AccordionRoot, {
  /** Item scope owning stable identity and panel presence. */
  Item: AccordionItem,
  /** Disclosure trigger requiring an enclosing Item. */
  Trigger: AccordionTrigger,
  /** Conditional panel requiring an enclosing Item. */
  Panel: AccordionPanel,
})
