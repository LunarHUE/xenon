import type { ValidComponent, JSX } from '@solidjs/web'
import {
  createEffect,
  createMemo,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
} from 'solid-js'
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { spread } from '../spread'
import { useMenu } from './context'
import type { MenuTriggerEntry } from './context'
import { getOverlayHandleContext } from '../internal/overlay-handle'
import type { MenuHandle } from './root'

/** Opening trigger props inherited from Button, including host, disabled/pending gates, and author handlers. */
export type MenuTriggerProps<
  T extends ValidComponent = 'button',
  Payload = unknown,
> = ButtonProps<T> & {
  /** Connect a detached trigger to its menu root. */
  handle?: MenuHandle<Payload>
  /** Data selected when this trigger opens the shared menu. */
  payload?: Payload
}
/**
 * Renders a Button that opens the menu and supplies its default positioning/focus target.
 *
 * @remarks
 * Click toggles visibility; ArrowUp requests the last item, while ArrowDown, Enter,
 * and Space request the first. Author handlers run before core handlers and may
 * cancel them. Button gates click and Enter/Space while disabled or pending;
 * its gate does not block arrow-key opening if those events reach the handler.
 * The host is recorded after settling. A live author/generated ID reader registers
 * immediately and unregisters on owner cleanup; the recorded host is not cleared
 * here. Open-only aria-controls is finalized after child serialization on the server.
 * Custom hosts must forward Button props/ref; the author ref receives the trigger.
 * @throws If rendered outside Menu.
 */
export function MenuTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: MenuTriggerProps<T, Payload>
): JSX.Element {
  const inherited = untrack(() => props.handle) ? undefined : useMenu('Menu.Trigger')
  const context = () => (props.handle ? getOverlayHandleContext(props.handle) : inherited)
  const id = createUniqueId()
  const own = props as {
    id?: string
    ref?: (el: HTMLElement) => void
    disabled?: boolean
    pending?: boolean
    children?: JSX.Element
  }
  const entry: MenuTriggerEntry = {
    id: () => own.id ?? id,
    payload: () => props.payload,
    disabled: () => !!own.disabled || !!own.pending,
  }
  if (inherited) {
    onCleanup(inherited.registerTrigger(entry))
    onSettled(() => {
      if (entry.element && !untrack(inherited.trigger)) inherited.setTrigger(entry.element)
    })
  } else {
    createEffect(context, (value) => value?.registerTrigger(entry))
  }
  const rest = omit(props as Record<string, unknown>, 'ref', 'id', 'children', 'handle', 'payload')
  /** Only the active opener reports expansion; detached handles remain harmless before attachment. */
  const merged = () => {
    const value = context()
    const active = value?.activeTrigger(entry) ?? false
    const expanded = active && !!value?.open()
    const result = spread(
      {
        attrs: {
          ...value?.engine().parts.trigger.attrs,
          type: 'button',
          'aria-haspopup': 'menu',
          'aria-expanded': expanded ? 'true' : 'false',
          'data-state': expanded ? 'open' : 'closed',
          'aria-controls': value?.association('aria-controls', () =>
            value.open() && value.activeTrigger(entry) ? value.contentId() : undefined
          ),
        },
        on: {
          click() {
            value?.activate(entry, 'first', true)
          },
          keydown(event: KeyboardEvent) {
            if (
              entry.disabled() ||
              event.isComposing ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return
            if (['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
              event.preventDefault()
              value?.activate(entry, event.key === 'ArrowUp' ? 'last' : 'first')
            }
          },
        },
      } as import('@tenon/core').PartProps<'button'>,
      { ...rest }
    )
    for (const key of Object.keys(result)) {
      if (key.toLowerCase() === 'onclick' && key !== 'onClick') {
        result.onClick = result[key]
        delete result[key]
      }
    }
    return result
  }
  const children = createMemo(() => own.children)
  return (
    <Button
      {...merged()}
      id={entry.id()}
      ref={(el) => {
        entry.element = el
        own.ref?.(el)
      }}
    >
      {children()}
    </Button>
  )
}
