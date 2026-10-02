import { booleanAttribute, setRef } from '../internal/host'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createUniqueId, omit, onCleanup, onSettled, untrack } from 'solid-js'
import { contextMenu } from '@xenon-ui/core/context-menu'
import type { ContextMenuPoint } from '@xenon-ui/core/context-menu'
import { MenuRoot } from '../menu/root'
import type { MenuProps } from '../menu/root'
import { useMenu } from '../menu/context'
import type { MenuTriggerEntry } from '../menu/context'
import { MenuContent } from '../menu/content'
import type { MenuContentProps } from '../menu/content'
import { spread } from '../spread'

/** Context-menu visibility, direction, presence, and item navigation options. */
export type ContextMenuProps<Payload = unknown> = MenuProps<Payload>
/** Region props. The default div has a tab stop for keyboard context-menu access. */
export type ContextMenuTriggerProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Region host; defaults to div. */
  as?: T
  /** Allow the native context menu and suppress all custom opening gestures. */
  disabled?: JSX.BooleanAttribute
}
/** Provides shared Menu state for a context-menu region and popup. */
export function ContextMenuRoot<Payload = unknown>(props: ContextMenuProps<Payload>): JSX.Element {
  const rest = omit(props as unknown as Record<string, unknown>, 'children')
  return <MenuRoot {...rest} children={props.children} />
}
/**
 * Opens at client coordinates, keyboard region center, or a 500ms touch hold.
 * Movement beyond 10px, release, cancellation, and scrolling cancel a pending hold.
 * The click produced by releasing a completed hold is suppressed; a fresh pointer
 * press restores ordinary click-to-close behavior. Initial anchor publication waits
 * until settling so closed force-mounted content retains its server DOM on hydration.
 */
export function ContextMenuTrigger<T extends ValidComponent = 'div'>(
  props: ContextMenuTriggerProps<T>
): JSX.Element {
  const context = useMenu('ContextMenu.Trigger')
  const id = createUniqueId()
  const own = props as ContextMenuTriggerProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'disabled')
  const entry: MenuTriggerEntry = {
    id: () => (typeof own.id === 'string' ? own.id : id),
    disabled: () => booleanAttribute(own.disabled),
    payload: () => undefined,
  }
  onCleanup(context.registerTrigger(entry))
  onSettled(() => {
    if (entry.element && !untrack(context.trigger)) context.setTrigger(entry.element)
  })
  let timer: ReturnType<typeof setTimeout> | undefined
  let start: ContextMenuPoint | undefined
  let suppressReleaseClick = false
  let removeListeners: (() => void) | undefined
  function cancel() {
    clearTimeout(timer)
    timer = undefined
    start = undefined
    removeListeners?.()
    removeListeners = undefined
  }
  function open(point?: ContextMenuPoint) {
    if (entry.disabled() || !entry.element) return
    cancel()
    const box = entry.element.getBoundingClientRect()
    const location = point ?? { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    if (context.open()) context.resetChildren()
    context.setAnchor({
      contextElement: entry.element,
      getBoundingClientRect: () => new DOMRect(location.x, location.y, 0, 0),
    })
    context.activate(entry, 'content')
  }
  function hold(event: PointerEvent) {
    suppressReleaseClick = false
    if (event.pointerType !== 'touch' || entry.disabled()) return
    if (start || !event.isPrimary) {
      cancel()
      return
    }
    start = { x: event.clientX, y: event.clientY }
    const doc = entry.element!.ownerDocument
    const move = (event: PointerEvent) => {
      if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) cancel()
    }
    const second = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && !event.isPrimary) cancel()
    }
    doc.addEventListener('pointermove', move)
    doc.addEventListener('pointerdown', second)
    doc.addEventListener('pointerup', cancel)
    doc.addEventListener('pointercancel', cancel)
    doc.addEventListener('scroll', cancel, true)
    removeListeners = () => {
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerdown', second)
      doc.removeEventListener('pointerup', cancel)
      doc.removeEventListener('pointercancel', cancel)
      doc.removeEventListener('scroll', cancel, true)
    }
    timer = setTimeout(() => {
      open(start)
      suppressReleaseClick = true
    }, 500)
  }
  onCleanup(cancel)
  const part = () => {
    const engine = contextMenu({
      items: [],
      open: context.open() && context.activeTrigger(entry),
      triggerDisabled: booleanAttribute(own.disabled),
      onOpenRequest: open,
    })
    return {
      ...engine.parts.trigger,
      on: {
        ...engine.parts.trigger.on,
        pointerdown: hold,
        click(event: MouseEvent) {
          if (suppressReleaseClick) {
            suppressReleaseClick = false
            event.preventDefault()
            return
          }
          if (context.open()) context.closeAll(false)
        },
      },
    }
  }
  const children = createMemo(() => own.children)
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread(part(), { tabindex: 0, ...rest, id: entry.id() })}
      ref={(element: HTMLElement) => {
        entry.element = element
        setRef(own.ref, element)
      }}
    >
      {children()}
    </Dynamic>
  )
}
/** Menu surface props, including author naming and handlers. */
export type ContextMenuContentProps<T extends ValidComponent = 'div'> = MenuContentProps<T>
/** Shares item, submenu, and dismissal behavior with Menu, suppresses native menus within the surface, and supports navigation from initial surface focus. */
export function ContextMenuContent<T extends ValidComponent = 'div'>(
  props: ContextMenuContentProps<T>
): JSX.Element {
  const context = useMenu('ContextMenu.Content')
  const rest = omit(props as Record<string, unknown>, 'children')
  const children = createMemo(() => props.children)
  return (
    <MenuContent<ValidComponent>
      {...spread(
        {
          attrs: {},
          on: {
            contextmenu(event: MouseEvent) {
              event.preventDefault()
            },
            keydown(event: KeyboardEvent) {
              if (
                event.target !== context.content() ||
                event.isComposing ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey
              )
                return
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault()
                context.change(true, ['ArrowUp', 'End'].includes(event.key) ? 'last' : 'first')
              }
            },
          },
        },
        { ...rest }
      )}
    >
      {children()}
    </MenuContent>
  )
}
