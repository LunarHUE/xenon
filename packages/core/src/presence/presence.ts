import type { PartProps } from '../part'

export type PresenceStatus = 'entering' | 'entered' | 'exiting' | 'exited'

export interface PresenceOptions {
  open?: boolean
  status?: PresenceStatus
  forceMount?: boolean
}

export interface PresenceState {
  open: boolean
  present: boolean
  status: PresenceStatus
}

export interface PresenceResult {
  state: PresenceState
  parts: { root: PartProps<'div'> }
}

export function presence(options: PresenceOptions = {}): PresenceResult {
  const open = options.open ?? false
  const forceMount = options.forceMount ?? false
  const status = options.status ?? (open ? 'entered' : 'exited')
  const present = open || status === 'exiting' || forceMount

  const state: PresenceState = { open, present, status }

  const root: PartProps<'div'> = {
    attrs: {
      'data-state': open ? 'open' : 'closed',
      'data-starting-style': status === 'entering' ? '' : undefined,
      'data-ending-style': status === 'exiting' ? '' : undefined,
      inert: status === 'exiting' ? true : undefined,
      hidden: forceMount && !open && status !== 'exiting' ? true : undefined,
    },
    on: {},
  }

  return { state, parts: { root } }
}
