import { createSignal, untrack } from 'solid-js'

/** A command forwarded to the currently mounted overlay root. */
export type OverlayHandleCommand<Payload> =
  | {
      /** Open using a registered trigger. */
      type: 'open'
      /** Optional specific trigger; omission uses the root's current fallback. */
      triggerId?: string
    }
  | {
      /** Open with explicitly supplied data. */
      type: 'payload'
      /** Data forwarded unchanged, including an explicitly undefined value. */
      payload: Payload
    }
  | {
      /** Request closure. */
      type: 'close'
    }

declare const contextType: unique symbol

/**
 * Imperative controls for one mounted overlay root. Commands request changes through
 * that root's controlled/uncontrolled policy; the handle owns no visibility state.
 * Before attachment and after disposal, commands are ignored without queuing.
 */
export interface OverlayHandle<Payload, Context = unknown> {
  /** The mounted root's current open state, or false while detached. */
  readonly isOpen: boolean
  /** Request opening, optionally selecting a registered trigger. Unknown explicit IDs are ignored; omission uses the root-specific active/fallback opener. */
  open(triggerId?: string): void
  /** Request opening with typed data on the root-specific active/fallback opener. An explicitly undefined value is preserved when Payload permits it. Anchored overlays still require a usable anchor. */
  openWithPayload(payload: Payload): void
  /** Request closing the mounted root. */
  close(): void
  /** Carries the context type without adding a runtime property. */
  readonly [contextType]?: Context
}

/** The root's state and command implementation shared with detached parts. */
export interface OverlayHandleAttachment<Payload, Context> {
  /** Root context made available to detached parts while attached. */
  context: Context
  /** Read the root's effective visibility without owning another open state. */
  readOpen(): boolean
  /** Apply a request through the root's controlled/uncontrolled policies. */
  dispatch(command: OverlayHandleCommand<Payload>): void
}

interface HandleState<Payload, Context> {
  read(): OverlayHandleAttachment<Payload, Context> | undefined
  write(value: OverlayHandleAttachment<Payload, Context> | undefined): unknown
}

const handles = new WeakMap<object, HandleState<unknown, unknown>>()

function stateOf<Payload, Context>(handle: OverlayHandle<Payload, Context>) {
  const state = handles.get(handle)
  if (!state) throw new Error('Expected an overlay handle created by createHandle().')
  return state as HandleState<Payload, Context>
}

/**
 * Create an owner-independent handle. Commands are ignored until a root attaches
 * and after it detaches; the handle never stores or replays pending commands.
 */
export function createOverlayHandle<Payload = unknown, Context = unknown>(): OverlayHandle<
  Payload,
  Context
> {
  // Roots attach during component setup, where Solid requires owned writes.
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let current: OverlayHandleAttachment<Payload, Context> | undefined
  const read = () => {
    revision()
    return current
  }
  const write = (value: OverlayHandleAttachment<Payload, Context> | undefined) => {
    // Solid batches signal writes. Attachment ownership and command dispatch
    // must change immediately, including two roots mounting in the same batch.
    current = value
    setRevision((value) => value + 1)
  }
  const dispatch = (command: OverlayHandleCommand<Payload>) =>
    untrack(() => read()?.dispatch(command))
  const handle: OverlayHandle<Payload, Context> = {
    get isOpen() {
      return read()?.readOpen() ?? false
    },
    open(triggerId) {
      dispatch(triggerId === undefined ? { type: 'open' } : { type: 'open', triggerId })
    },
    openWithPayload(payload) {
      dispatch({ type: 'payload', payload })
    },
    close() {
      dispatch({ type: 'close' })
    },
  }
  handles.set(handle, { read, write } as HandleState<unknown, unknown>)
  return handle
}

/**
 * Attach exactly one mounted root and return its idempotent release function.
 * A handle cannot be shared by two simultaneously mounted roots.
 */
export function attachOverlayHandle<Payload, Context>(
  handle: OverlayHandle<Payload, Context>,
  attachment: OverlayHandleAttachment<Payload, Context>
): () => void {
  const state = stateOf(handle)
  if (untrack(state.read)) {
    throw new Error('An overlay handle can only attach to one mounted root at a time.')
  }
  state.write(attachment)
  let released = false
  return () => {
    if (released) return
    released = true
    if (untrack(state.read) === attachment) state.write(undefined)
  }
}

/** Read the attached root context reactively, including later mounts and detachments. */
export function getOverlayHandleContext<Payload, Context>(
  handle: OverlayHandle<Payload, Context>
): Context | undefined {
  return stateOf(handle).read()?.context
}
