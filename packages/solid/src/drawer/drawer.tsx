import { drawer } from '@tenon/core/drawer'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, dialogParts, DialogClose, useDialog } from '../internal/dialog'
import type { ButtonProps } from '../button/button'
import { createEffect, createSignal } from 'solid-js'
import { registerDrawerHandle } from '@tenon/dom'
import type { DrawerProps } from '../internal/dialog'
export function DrawerHandle<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Drawer.Handle')
  const [element, setElement] = createSignal<HTMLElement>()
  createEffect(
    () => ({ el: element(), content: context.content(), side: context.own.side ?? 'bottom' }),
    ({ el, content, side }) => {
      if (!el || !content) return
      const handle = registerDrawerHandle(el, content, {
        side,
        onDismiss: () => context.change(false),
      })
      return () => handle.dispose()
    }
  )
  return (
    <DialogClose
      aria-label="Close drawer"
      {...props}
      ref={(el) => {
        setElement(el)
        props.ref?.(el)
      }}
    />
  )
}
function DrawerRoot<T extends ValidComponent = 'div'>(props: DrawerProps<T>): JSX.Element {
  return createDialogRoot(props, { kind: 'drawer', compute: drawer })
}
export const Drawer = Object.assign(DrawerRoot, {
  Root: DrawerRoot,
  ...dialogParts,
  Handle: DrawerHandle,
})
export type { DrawerProps } from '../internal/dialog'
