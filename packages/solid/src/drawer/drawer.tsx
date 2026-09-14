import { drawer } from '@tenon/core/drawer'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, dialogParts, DialogClose, useDialog } from '../internal/dialog'
import type { ButtonProps } from '../button/button'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { registerDrawerHandle } from '@tenon/dom'
import type { DrawerProps } from '../internal/dialog'
export function DrawerHandle<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Drawer.Handle')
  const [element, setElement] = createSignal<HTMLElement>()
  let controller: ReturnType<typeof registerDrawerHandle> | undefined
  let attached: HTMLElement | undefined
  let attachedContent: HTMLElement | undefined
  let wasOpen = false
  createEffect(
    () => ({
      el: element(),
      content: context.content(),
      side: context.own.side ?? 'bottom',
      open: context.result().state.open,
      status: context.result().state.status,
    }),
    ({ el, content, side, open, status }) => {
      if (!el || !content) return
      const options = {
        side,
        onDismiss: () => {
          context.change(false)
          // Controlled roots may refuse the request without producing an update.
          const current = controller
          queueMicrotask(() => {
            if (controller === current && context.result().state.open) current?.reset()
          })
        },
      }
      if (el !== attached || content !== attachedContent) {
        controller?.dispose()
        attached = el
        attachedContent = content
        controller = registerDrawerHandle(el, content, options)
      } else controller?.update(options)
      if ((open && !wasOpen) || status === 'exited') controller?.reset()
      wasOpen = open
    }
  )
  onCleanup(() => {
    controller?.dispose()
    controller = undefined
  })
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
