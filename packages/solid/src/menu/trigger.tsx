import type { ValidComponent, JSX } from '@solidjs/web'
import { createMemo, createUniqueId, onCleanup, onSettled, omit } from 'solid-js'
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { spread } from '../spread'
import { useMenu } from './context'

export type MenuTriggerProps<T extends ValidComponent = 'button'> = ButtonProps<T>
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
