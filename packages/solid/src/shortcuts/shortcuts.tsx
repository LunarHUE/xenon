import {
  ariaKeyshortcuts,
  createShortcutRegistry,
  formatKeys,
  formatLabel,
  parseShortcut,
} from '@xenon-ui/core/shortcuts'
import type {
  ActiveShortcut,
  ShortcutLayout,
  ShortcutPlatform,
  ShortcutRegistration,
  ShortcutRegistry,
} from '@xenon-ui/core/shortcuts'
import {
  detectShortcutPlatform,
  readKeyboardLayout,
  readShortcutContext,
  watchShortcutContext,
} from '@xenon-ui/dom/shortcuts'
import type { Accessor } from 'solid-js'
import type { ComponentProps, JSX } from '@solidjs/web'
import { createContext, createMemo, createSignal, omit, onCleanup, useContext } from 'solid-js'
import { setRef } from '../internal/host'

/** The document's registry, its listeners, and a version that changes with anything list() reads. */
interface Manager {
  registry: ShortcutRegistry
  /** Tracked read for anything derived from the registry or the document context. */
  version: Accessor<number>
  /** Schedule a version bump. Deferred so registering in a component body writes nothing there. */
  invalidate: () => void
  register: (registration: ShortcutRegistration) => () => void
}

let manager: Manager | undefined

/** Lazily create the shared manager; undefined on the server. */
function useManager(): Manager | undefined {
  if (manager || typeof document === 'undefined') return manager
  const doc = document
  const registry = createShortcutRegistry({
    platform: detectShortcutPlatform(doc),
    warn: import.meta.env.DEV ? (message) => console.warn(message) : undefined,
  })
  const [version, setVersion] = createSignal(0)
  let scheduled = false
  const invalidate = () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      setVersion((value) => value + 1)
    })
  }
  const keydown = (event: KeyboardEvent) => {
    registry.handle(event, readShortcutContext(doc))
  }
  let stopWatching: (() => void) | undefined
  // Chromium reports the layout; elsewhere physical keys keep their US legends.
  void readKeyboardLayout(doc).then((layout) => {
    if (!layout || registry.layout) return
    registry.configure({ layout })
    invalidate()
  })
  manager = {
    registry,
    version,
    invalidate,
    register(registration) {
      const remove = registry.register(registration)
      if (registry.size === 1) {
        doc.addEventListener('keydown', keydown)
        stopWatching = watchShortcutContext(doc, invalidate)
      }
      invalidate()
      let removed = false
      return () => {
        if (removed) return
        removed = true
        remove()
        if (!registry.size) {
          doc.removeEventListener('keydown', keydown)
          stopWatching?.()
          stopWatching = undefined
        }
        invalidate()
      }
    },
  }
  return manager
}

/**
 * Override the detected platform, the keyboard layout or the sequence timeout for
 * every shortcut in the document. Call outside components, for example in test setup.
 */
export function configureShortcuts(options: {
  /** Apple shows ⌘ and resolves Mod to Meta; other uses Ctrl. */
  platform?: ShortcutPlatform
  /**
   * Characters by `KeyboardEvent.code`, used to label physical-key bindings such
   * as `Alt+KeyQ`. Detected in Chromium; other browsers show US legends unless
   * you pass one.
   */
  layout?: ShortcutLayout
  /** Milliseconds allowed between sequence steps. */
  sequenceTimeout?: number
}): void {
  const current = useManager()
  if (!current) return
  current.registry.configure(options)
  current.invalidate()
}

const ScopeContext = /* @__PURE__ */ createContext<Accessor<Element | undefined> | null>(null)

/** Options for {@link createShortcut}. */
export interface CreateShortcutOptions {
  /** Shown by help overlays and hint footers. */
  description?: string
  /** Heading that groups related shortcuts in a help overlay. */
  group?: string
  /** Leave the binding registered but inactive while false. */
  enabled?: boolean | Accessor<boolean>
  /**
   * Element that owns the binding. Defaults to the nearest {@link ShortcutScope};
   * without one the binding is global.
   */
  scope?: Element | Accessor<Element | undefined>
  /** Fire on auto-repeat keydowns while the key is held. */
  repeat?: boolean
  /** Fire while focus is in a text field. Defaults to true only for Mod, Meta and Control chords. */
  allowInEditable?: boolean
  /** Cancel the keydown that fired the binding. Defaults to true. */
  preventDefault?: boolean
}

/** Display forms and live state for one registered shortcut. */
export interface ShortcutHandle {
  /** Tokens for a Kbd hint, such as `['⌘', 'K']` on Apple and `['Ctrl', 'K']` elsewhere. */
  keys: Accessor<string[]>
  /** Spoken form, such as `Command K`. */
  label: Accessor<string>
  /** Value for `aria-keyshortcuts` on the owning control; undefined for sequences. */
  ariaKeyshortcuts: Accessor<string | undefined>
  /** Whether the binding can fire right now, after scope, modal and focus filtering. */
  active: Accessor<boolean>
}

/**
 * Bind a key for the current owner's lifetime and get its display forms from the
 * same registration, so a hint never advertises a key that does nothing.
 *
 * A binding names the character a key types (`Mod+K`, `?`) or, by its
 * `KeyboardEvent.code` name, the physical key (`Shift+Digit1`, `Alt+KeyT`). Use the
 * second when the character depends on the layout or on the modifiers held.
 *
 * @remarks
 * Global bindings stand down while a modal dialog is open, and bindings
 * containing Escape stand down while any Xenon layer is open, because the layer
 * already dismisses on Escape. One document keydown listener serves every
 * shortcut and is removed when the last one is disposed.
 *
 * @throws When the binding does not parse.
 */
export function createShortcut(
  binding: string,
  handler: (event: KeyboardEvent) => void,
  options: CreateShortcutOptions = {}
): ShortcutHandle {
  parseShortcut(binding)
  const scope = options.scope ?? useContext(ScopeContext) ?? undefined
  const current = useManager()
  const registration: ShortcutRegistration = {
    binding,
    handler: (event) => handler(event),
    scope,
    description: options.description,
    group: options.group,
    enabled: options.enabled,
    repeat: options.repeat,
    allowInEditable: options.allowInEditable,
    preventDefault: options.preventDefault,
  }
  if (current) onCleanup(current.register(registration))
  const platform = () => {
    current?.version()
    return current?.registry.platform ?? 'other'
  }
  const layout = () => {
    current?.version()
    return current?.registry.layout
  }
  const keys = createMemo(() => formatKeys(binding, platform(), layout()))
  const label = createMemo(() => formatLabel(binding, platform(), layout()))
  const aria = createMemo(() => ariaKeyshortcuts(binding, platform(), layout()))
  const active = createMemo(() => list(current).some((item) => item.registration === registration))
  return { keys, label, ariaKeyshortcuts: aria, active }
}

/** Tracked list of active shortcuts. */
function list(current: Manager | undefined): ActiveShortcut[] {
  if (!current) return []
  current.version()
  return current.registry.list(readShortcutContext(document))
}

/** Reactive view of the shortcuts that can fire right now. */
export interface ShortcutsView {
  /** Active shortcuts in registration order, one per binding, with descriptions and display forms. */
  list: Accessor<ActiveShortcut[]>
}

/** Read the active shortcuts for a help overlay or hint footer. */
export function useShortcuts(): ShortcutsView {
  const current = useManager()
  const active = createMemo(() => list(current))
  return { list: active }
}

/** Div props for a scope host. */
export type ShortcutScopeProps = ComponentProps<'div'>

/**
 * Scope every {@link createShortcut} below it to this element's subtree. Its
 * bindings fire while focus is inside, or while the element sits in the topmost
 * open layer, and they win over global bindings for the same keys.
 */
export function ShortcutScope(props: ShortcutScopeProps): JSX.Element {
  let element: HTMLDivElement | undefined
  const rest = omit(props, 'ref', 'children')
  const content = createMemo(() => (
    <ScopeContext value={() => element}>{props.children}</ScopeContext>
  ))
  return (
    <div
      ref={(node) => {
        element = node
        setRef(() => props.ref, node)
      }}
      {...rest}
    >
      {content()}
    </div>
  )
}

export type { ActiveShortcut, ShortcutLayout, ShortcutPlatform }
