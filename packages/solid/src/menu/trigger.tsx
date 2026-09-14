import type { ValidComponent, JSX } from '@solidjs/web'
import { createMemo, createUniqueId, onCleanup, onSettled, omit } from 'solid-js'
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { spread } from '../spread'
import { useMenu } from './context'

/** Opening trigger props inherited from Button, including host, disabled/pending gates, and author handlers. */
export type MenuTriggerProps<T extends ValidComponent = 'button'> = ButtonProps<T>
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
export function MenuTrigger<T extends ValidComponent = 'button'>(
  props: MenuTriggerProps<T>
): JSX.Element {
  const context = useMenu('Menu.Trigger')
  const id = createUniqueId()
  let element: HTMLElement | undefined
  onSettled(() => {
    if (element) context.setTrigger(element)
  })
  const own = props as { id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'ref', 'id', 'children')
  onCleanup(context.setTriggerId(() => own.id ?? id))
  /** Composes core opening handlers, then canonicalizes click casing for Button's interaction gate. */
  const merged = () => {
    const part = context.engine().parts.trigger
    const result = spread(
      {
        ...part,
        attrs: {
          ...part.attrs,
          'aria-controls': context.association('aria-controls', () =>
            context.open() ? context.contentId() : undefined
          ),
        },
      },
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
  const children = createMemo(() => (props as { children?: JSX.Element }).children)
  return (
    <Button
      {...merged()}
      id={own.id ?? id}
      ref={(el) => {
        element = el
        own.ref?.(el)
      }}
    >
      {children()}
    </Button>
  )
}
