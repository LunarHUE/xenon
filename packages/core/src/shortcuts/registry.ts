import {
  MODIFIER_KEYS,
  hasCommandModifier,
  matchChord,
  normalizeShortcut,
  parseShortcut,
} from './binding'
import type { ParsedShortcut, ShortcutKeyState, ShortcutPlatform } from './binding'
import { ariaKeyshortcuts, formatKeys, formatLabel } from './format'

/** Where a registration listens: an element, or a reader for one that may not be mounted yet. */
export type ShortcutScopeTarget = Element | (() => Element | null | undefined)

/** One shortcut and the work it triggers. */
export interface ShortcutRegistration {
  /** Binding text, such as `Mod+K` or `g n`. See {@link parseShortcut}. */
  binding: string
  /** Runs when the binding wins a keydown. */
  handler: (event: KeyboardEvent) => void
  /**
   * Subtree that owns the binding. Omit for a global binding. A scoped binding fires
   * only while focus is inside the element or the element sits in the topmost layer.
   * A reader that returns nothing leaves the binding inactive.
   */
  scope?: ShortcutScopeTarget
  /** Human description for help overlays and hint footers. */
  description?: string
  /** Heading that groups related shortcuts in a help overlay. */
  group?: string
  /** Read on every keydown and list; false leaves the binding registered but inactive. */
  enabled?: boolean | (() => boolean)
  /** Fire on auto-repeat keydowns while the key is held. Single-step bindings only. */
  repeat?: boolean
  /**
   * Fire while focus is in a text field, select, contenteditable region or an element
   * with role textbox, combobox, searchbox or spinbutton. Defaults to true when a step
   * holds Mod, Meta or Control, and false otherwise, so `j` stays typeable.
   */
  allowInEditable?: boolean
  /** Cancel the keydown that fired the binding. Defaults to true. */
  preventDefault?: boolean
}

/** A binding that can fire right now, with its display forms for the current platform. */
export interface ActiveShortcut {
  /** The registration object passed to `register`. */
  registration: ShortcutRegistration
  binding: string
  description?: string
  group?: string
  /** Tokens from {@link formatKeys}. */
  keys: string[]
  /** Spoken form from {@link formatLabel}. */
  label: string
  /** Attribute value from {@link ariaKeyshortcuts}; undefined for sequences. */
  ariaKeyshortcuts?: string
}

/** Focus and layer state the registry filters against. Adapters read it from the document. */
export interface ShortcutContext {
  /** Focused element, or null. */
  focus: Element | null
  /** Open dismissable layers (dialogs, popovers, menus, selects), oldest first. */
  layers: readonly Element[]
  /** Innermost open modal dialog; everything outside it is inert. */
  modal: Element | null
}

/** Registry settings. Each can be changed later with `configure`. */
export interface ShortcutRegistryOptions {
  /**
   * Platform used to resolve Mod and to format keys.
   * @defaultValue 'other'
   */
  platform?: ShortcutPlatform
  /**
   * Milliseconds allowed between sequence steps.
   * @defaultValue 1000
   */
  sequenceTimeout?: number
  /** Clock for sequence timing. @defaultValue Date.now */
  now?: () => number
  /** Receives duplicate-registration warnings. Omit to stay silent, as in production. */
  warn?: (message: string) => void
}

/** Shortcut table plus keydown dispatch. Holds no DOM listeners itself. */
export interface ShortcutRegistry {
  /** Platform currently used for matching and display. */
  readonly platform: ShortcutPlatform
  /** Number of registrations, active or not. */
  readonly size: number
  /**
   * Add a registration. Within one scope the last registration wins, and with a
   * `warn` option a duplicate binding reports both registrations.
   * @throws When the binding does not parse.
   * @returns Idempotent removal; the earlier duplicate takes over again.
   */
  register(registration: ShortcutRegistration): () => void
  /**
   * Registrations that could fire in the given context, one per binding, in
   * registration order. Scope, modal, Escape, editable-focus and enabled filtering
   * apply; event-only checks such as repeat and composition do not.
   */
  list(context: ShortcutContext): ActiveShortcut[]
  /**
   * Dispatch one keydown. Fires at most one handler: the longest matching sequence,
   * then the scope holding focus, then the innermost scope, then the latest
   * registration. Returns whether a handler ran.
   */
  handle(event: KeyboardEvent, context: ShortcutContext): boolean
  /** Replace the given settings and clear any half-typed sequence. */
  configure(options: ShortcutRegistryOptions): void
}

/** Input types that take no text, so single-key shortcuts stay usable on them. */
const NON_TEXT_INPUTS = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'hidden',
])
const TEXT_ROLES = '[role="textbox"],[role="combobox"],[role="searchbox"],[role="spinbutton"]'

/** Whether typing into the element produces text, so plain-key shortcuts must not fire there. */
export function isEditableElement(element: EventTarget | null | undefined): boolean {
  const el = element as Element | null | undefined
  if (!el || el.nodeType !== 1) return false
  if (el.localName === 'input') return !NON_TEXT_INPUTS.has((el as HTMLInputElement).type)
  if (el.localName === 'textarea' || el.localName === 'select') return true
  if ((el as HTMLElement).isContentEditable) return true
  return el.matches(TEXT_ROLES) || !!el.closest('[contenteditable]:not([contenteditable="false"])')
}

interface Entry {
  registration: ShortcutRegistration
  parsed: ParsedShortcut
  normalized: string
  /** Registration order; later wins ties. */
  order: number
}

interface Rank {
  focus: number
  depth: number
}

function depth(node: Node): number {
  let count = 0
  for (let current: Node | null = node; current; current = current.parentNode) count++
  return count
}

const escapes = (parsed: ParsedShortcut) => parsed.steps.some((step) => step.key === 'Escape')

/** Compare ranks without sequence length: focus scope, then innermost scope, then latest. */
function beats(a: Rank & { order: number }, b: Rank & { order: number }): boolean {
  if (a.focus !== b.focus) return a.focus > b.focus
  if (a.depth !== b.depth) return a.depth > b.depth
  return a.order > b.order
}

/**
 * Create a framework-free shortcut registry.
 *
 * @remarks
 * The registry never touches the document. An adapter forwards keydowns to
 * `handle` with the current {@link ShortcutContext}. While any layer or modal dialog
 * is open, bindings containing Escape are inactive, because Xenon's layers already
 * own Escape and a second handler would dismiss twice. While a modal dialog is
 * open, only bindings scoped inside it are active.
 */
export function createShortcutRegistry(options: ShortcutRegistryOptions = {}): ShortcutRegistry {
  let settings = { platform: 'other' as ShortcutPlatform, sequenceTimeout: 1000, ...options }
  const entries: Entry[] = []
  let order = 0
  let pressed: ShortcutKeyState[] = []
  let last = 0

  const name = (entry: Entry) =>
    entry.registration.description
      ? `"${entry.registration.description}"`
      : `registration #${entry.order}`

  /** Rank an entry, or undefined when the context rules it out. */
  const rank = (entry: Entry, context: ShortcutContext, editable: boolean): Rank | undefined => {
    const { registration, parsed } = entry
    const enabled = registration.enabled
    if (enabled === false || (typeof enabled === 'function' && !enabled())) return
    if (editable && !(registration.allowInEditable ?? hasCommandModifier(parsed))) return
    if (escapes(parsed) && (context.layers.length || context.modal)) return
    if (registration.scope === undefined) return context.modal ? undefined : { focus: 0, depth: 0 }
    const scope =
      typeof registration.scope === 'function' ? registration.scope() : registration.scope
    if (!scope) return
    if (context.modal && !context.modal.contains(scope)) return
    const focus = !!context.focus && scope.contains(context.focus)
    const top = context.layers.at(-1)
    if (!focus && !top?.contains(scope)) return
    return { focus: focus ? 1 : 0, depth: depth(scope) }
  }

  const ranked = (context: ShortcutContext, editable: boolean) =>
    entries.flatMap((entry) => {
      const result = rank(entry, context, editable)
      return result ? [{ entry, order: entry.order, ...result }] : []
    })

  return {
    get platform() {
      return settings.platform
    },
    get size() {
      return entries.length
    },
    register(registration) {
      const parsed = parseShortcut(registration.binding)
      const entry: Entry = {
        registration,
        parsed,
        normalized: normalizeShortcut(parsed),
        order: ++order,
      }
      const duplicate = entries.findLast(
        (other) =>
          other.normalized === entry.normalized && other.registration.scope === registration.scope
      )
      if (duplicate && settings.warn) {
        settings.warn(
          `Shortcut "${registration.binding}" is registered twice in the same scope: ` +
            `${name(duplicate)} and ${name(entry)}. The later one wins until it is removed.`
        )
      }
      entries.push(entry)
      return () => {
        const index = entries.indexOf(entry)
        if (index !== -1) entries.splice(index, 1)
      }
    },
    list(context) {
      const winners = new Map<string, ReturnType<typeof ranked>[number]>()
      for (const candidate of ranked(context, isEditableElement(context.focus))) {
        const current = winners.get(candidate.entry.normalized)
        if (!current || beats(candidate, current)) {
          winners.set(candidate.entry.normalized, candidate)
        }
      }
      return [...winners.values()]
        .sort((a, b) => a.order - b.order)
        .map(({ entry: { registration } }) => ({
          registration,
          binding: registration.binding,
          description: registration.description,
          group: registration.group,
          keys: formatKeys(registration.binding, settings.platform),
          label: formatLabel(registration.binding, settings.platform),
          ariaKeyshortcuts: ariaKeyshortcuts(registration.binding, settings.platform),
        }))
    },
    handle(event, context) {
      if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return false
      if (!event.key || MODIFIER_KEYS.has(event.key)) return false
      const state: ShortcutKeyState = {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        altGraph: event.getModifierState?.('AltGraph') ?? false,
      }
      const now = (settings.now ?? Date.now)()
      if (pressed.length && now - last > settings.sequenceTimeout) pressed = []
      if (!event.repeat) {
        pressed.push(state)
        last = now
      }
      const target = event.composedPath?.()[0] ?? event.target
      const candidates = ranked(
        context,
        isEditableElement(target) || isEditableElement(context.focus)
      )
      const platform = settings.platform
      const matches = (steps: ParsedShortcut['steps'], keys: ShortcutKeyState[]) =>
        steps.length <= keys.length &&
        steps.every((step, index) =>
          matchChord(keys[keys.length - steps.length + index]!, step, platform)
        )
      let best: (typeof candidates)[number] | undefined
      for (const candidate of candidates) {
        const { steps } = candidate.entry.parsed
        if (event.repeat) {
          if (!candidate.entry.registration.repeat || steps.length !== 1) continue
          if (!matchChord(state, steps[0]!, platform)) continue
        } else if (!matches(steps, pressed)) continue
        const length = steps.length
        const bestLength = best?.entry.parsed.steps.length ?? 0
        if (!best || length > bestLength || (length === bestLength && beats(candidate, best))) {
          best = candidate
        }
      }
      if (best && best.entry.parsed.steps.length > 1) pressed = []
      else if (!event.repeat) {
        // Keep the longest tail that could still grow into a sequence; anything else resets.
        let keep = 0
        for (const { entry } of candidates) {
          const { steps } = entry.parsed
          for (let size = Math.min(pressed.length, steps.length - 1); size > keep; size--) {
            if (matches(steps.slice(0, size), pressed)) keep = size
          }
        }
        pressed = keep ? pressed.slice(-keep) : []
      }
      if (!best) return false
      if (best.entry.registration.preventDefault !== false) event.preventDefault()
      best.entry.registration.handler(event)
      return true
    },
    configure(next) {
      settings = { ...settings, ...next }
      pressed = []
    },
  }
}
