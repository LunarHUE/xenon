import type { JSX } from '@solidjs/web'
import { createSignal, omit, untrack } from 'solid-js'
import { Dialog } from '../dialog/dialog'
import type { DialogContentProps, DialogHandle, DialogViewportProps } from '../dialog/dialog'
import { createShortcut } from '../shortcuts/shortcuts'
import { BridgeContext, CommandRoot } from './command'
import type { Bridge, CommandRootProps } from './command'

/** Palette options plus the dialog's visibility, shortcut and host props. */
export type CommandDialogProps = CommandRootProps & {
  /** Controlled visibility. */
  open?: boolean
  /** Initial uncontrolled visibility. Defaults to false. */
  defaultOpen?: boolean
  /** Reports a visibility request from the shortcut, Escape, an outside press or a selection. */
  onOpenChange?: (open: boolean) => void
  /** Connects detached Dialog.Trigger buttons to this palette. */
  handle?: DialogHandle
  /**
   * Binding that toggles the palette, registered with the shortcuts package so it
   * appears in shortcut listings and follows ShortcutScope. Read once. False for none.
   * @defaultValue 'Mod+K'
   */
  openShortcut?: string | false
  /** Close after an item's onSelect unless it canceled the event or opened a page. Defaults to true. */
  closeOnSelect?: boolean
  /** Accessible name for the dialog. Defaults to "Command palette". */
  label?: string
  /** Props for the native dialog host that owns layout and scrolling. */
  viewportProps?: DialogViewportProps
  /** Props for the dialog surface around the palette. */
  contentProps?: DialogContentProps
}

/**
 * A command palette in a modal Xenon dialog.
 *
 * @remarks
 * Opening moves focus to Command.Input. Escape pops a page first and closes the
 * dialog on the root page. Closing returns focus to the element that had it
 * before, such as a Dialog.Trigger. The palette mounts fresh on every opening,
 * so an uncontrolled query and page stack start empty.
 */
export function CommandDialog(props: CommandDialogProps): JSX.Element {
  const rest = omit(
    props,
    'open',
    'defaultOpen',
    'onOpenChange',
    'handle',
    'openShortcut',
    'closeOnSelect',
    'label',
    'viewportProps',
    'contentProps'
  )
  const [internal, setInternal] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const open = () => props.open ?? internal()
  const change = (next: boolean) => {
    if (next === untrack(open)) return
    if (props.open === undefined) setInternal(next)
    props.onOpenChange?.(next)
  }
  const binding = untrack(() => props.openShortcut) ?? 'Mod+K'
  if (binding)
    createShortcut(binding, () => change(!untrack(open)), {
      description: 'Open command palette',
    })
  const bridge: Bridge = {
    setInput: (el) => setInput(() => el),
    releaseInput(el) {
      if (untrack(input) === el) setInput(undefined)
    },
    openShortcut: binding || undefined,
    close: () => change(false),
    selected(event, pagesChanged) {
      if (event.defaultPrevented || pagesChanged || props.closeOnSelect === false) return
      change(false)
    },
  }
  return (
    <Dialog open={open()} onOpenChange={change} handle={props.handle} initialFocus={input()}>
      <Dialog.Viewport {...props.viewportProps}>
        <Dialog.Content aria-label={props.label ?? 'Command palette'} {...props.contentProps}>
          <BridgeContext value={bridge}>
            <CommandRoot {...rest} />
          </BridgeContext>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog>
  )
}
