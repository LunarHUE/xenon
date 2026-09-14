import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

export interface DialogOptions {
  ids?: { content?: string; title?: string; description?: string }
  open?: boolean
  modal?: boolean
  status?: PresenceStatus
  forceMount?: boolean
  onOpenChange?: (open: boolean) => void
}
export interface DialogResult {
  state: { open: boolean; modal: boolean; present: boolean; status: PresenceStatus }
  parts: {
    root: PartProps<'div'>
    trigger: PartProps<'button'>
    content: PartProps<'dialog'>
    title: PartProps<'h2'>
    description: PartProps<'p'>
    close: PartProps<'button'>
  }
}
export function dialog(options: DialogOptions = {}): DialogResult {
  const open = options.open ?? false
  const modal = options.modal ?? true
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  const flags = { 'data-state': open ? 'open' : 'closed' }
  return {
    state: { open, modal, present: life.state.present, status: life.state.status },
    parts: {
      root: { attrs: flags, on: {} },
      trigger: {
        attrs: {
          ...flags,
          type: 'button',
          'aria-haspopup': 'dialog',
          'aria-expanded': open ? 'true' : 'false',
          'aria-controls': options.ids?.content,
        },
        on: { click: () => options.onOpenChange?.(true) },
      },
      content: {
        attrs: {
          ...life.parts.root.attrs,
          id: options.ids?.content,
          role: 'dialog',
          'aria-modal': modal ? 'true' : undefined,
          'aria-labelledby': options.ids?.title,
          'aria-describedby': options.ids?.description,
        },
        on: {},
      },
      title: { attrs: { id: options.ids?.title }, on: {} },
      description: { attrs: { id: options.ids?.description }, on: {} },
      close: {
        attrs: { ...flags, type: 'button' },
        on: { click: () => options.onOpenChange?.(false) },
      },
    },
  }
}
