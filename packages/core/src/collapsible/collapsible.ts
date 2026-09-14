import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

export interface CollapsibleIds {
  trigger?: string
  content?: string
}

export interface CollapsibleOptions {
  ids?: CollapsibleIds
  open?: boolean
  status?: PresenceStatus
  forceMount?: boolean
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface CollapsibleState {
  open: boolean
  present: boolean
  status: PresenceStatus
  disabled: boolean
}

export interface CollapsibleResult {
  state: CollapsibleState
  parts: {
    root: PartProps<'div'>
    trigger: PartProps<'button'>
    content: PartProps<'div'>
  }
}

export function collapsible(options: CollapsibleOptions = {}): CollapsibleResult {
  const open = options.open ?? false
  const disabled = options.disabled ?? false
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  const flags = {
    'data-state': open ? 'open' : 'closed',
    'data-disabled': disabled ? '' : undefined,
  }

  const state: CollapsibleState = {
    open,
    present: life.state.present,
    status: life.state.status,
    disabled,
  }

  const trigger: PartProps<'button'> = {
    attrs: {
      ...flags,
      id: options.ids?.trigger,
      type: 'button',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': options.ids?.content,
      disabled: disabled || undefined,
    },
    on: {
      click(event) {
        if (disabled) {
          event.preventDefault()
          return
        }
        options.onOpenChange?.(!open)
      },
    },
  }

  const content: PartProps<'div'> = {
    attrs: {
      ...life.parts.root.attrs,
      'data-disabled': flags['data-disabled'],
      id: options.ids?.content,
    },
    on: {},
  }

  return { state, parts: { root: { attrs: { ...flags }, on: {} }, trigger, content } }
}
