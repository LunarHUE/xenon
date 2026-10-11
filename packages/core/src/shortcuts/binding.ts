/** Display platform. Apple resolves Mod to Meta (⌘); every other platform resolves it to Control. */
export type ShortcutPlatform = 'apple' | 'other'

/** One key press with its modifiers. Mod stays unresolved until a platform is known. */
export interface ShortcutChord {
  /** `KeyboardEvent.key` value; letters keep the case the author wrote. */
  key: string
  /** Meta on Apple platforms, Control elsewhere. */
  mod: boolean
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
}

/** A parsed binding: one chord, or several pressed in order. */
export interface ParsedShortcut {
  /** Original binding text. */
  binding: string
  /** Chords in press order; length one for a plain shortcut. */
  steps: readonly ShortcutChord[]
}

/** Key state read from a keydown, independent of the DOM event object. */
export interface ShortcutKeyState {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
  /** AltGr reports Control and Alt on Windows; such presses type characters, not chords. */
  altGraph?: boolean
}

const MODIFIERS: Record<string, 'mod' | 'meta' | 'ctrl' | 'alt' | 'shift'> = {
  mod: 'mod',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  control: 'ctrl',
  ctrl: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
}

/** Keydowns for these keys alone never start, continue or reset a shortcut. */
export const MODIFIER_KEYS: ReadonlySet<string> = new Set([
  'Shift',
  'Control',
  'Alt',
  'AltGraph',
  'Meta',
  'OS',
  'Super',
  'Hyper',
  'Fn',
  'FnLock',
  'CapsLock',
  'NumLock',
  'ScrollLock',
])

const NAMED_KEYS = [
  'Escape',
  'Enter',
  'Tab',
  'Backspace',
  'Delete',
  'Insert',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ContextMenu',
  'PrintScreen',
  'Pause',
]
const NAMED = new Map(NAMED_KEYS.map((name) => [name.toLowerCase(), name]))
const ALIASES: Record<string, string> = {
  esc: 'Escape',
  return: 'Enter',
  del: 'Delete',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  space: ' ',
  plus: '+',
}

const cache = new Map<string, ParsedShortcut>()

/**
 * Parse a binding such as `Mod+K`, `Shift+?`, `Escape`, `[` or the sequence `g n`.
 *
 * @remarks
 * Steps are separated by whitespace and keys within a step by `+`. Modifiers are
 * Mod, Meta, Control, Alt and Shift (Cmd, Ctrl and Option are accepted aliases).
 * Write the plus key as `Plus` and the space bar as `Space`. Named keys use their
 * `KeyboardEvent.key` value and match case-insensitively, as do letters.
 *
 * @throws An error naming the binding when it is empty, repeats a modifier, has no
 * key, or names an unknown key.
 */
export function parseShortcut(binding: string): ParsedShortcut {
  const cached = cache.get(binding)
  if (cached) return cached
  const fail = (reason: string): never => {
    throw new Error(`Invalid shortcut "${binding}": ${reason}`)
  }
  const words = binding.trim().split(/\s+/)
  if (!words[0]) fail('it is empty')
  const steps = words.map((word): ShortcutChord => {
    const parts = word === '+' ? ['+'] : word.split('+')
    if (parts.some((part) => !part)) fail('write the plus key as "Plus"')
    const chord: ShortcutChord = {
      key: '',
      mod: false,
      meta: false,
      ctrl: false,
      alt: false,
      shift: false,
    }
    parts.forEach((part, index) => {
      const modifier = MODIFIERS[part.toLowerCase()]
      if (index < parts.length - 1) {
        if (!modifier) fail(`"${part}" is not a modifier`)
        if (chord[modifier!]) fail(`"${part}" appears twice`)
        chord[modifier!] = true
        return
      }
      if (modifier) fail('the last part must be a key, not a modifier')
      chord.key = key(part) ?? fail(`"${part}" is not a key name`)
    })
    if (chord.mod && (chord.meta || chord.ctrl)) {
      fail('Mod already means Meta or Control; use one of them')
    }
    return chord
  })
  const parsed = { binding, steps }
  cache.set(binding, parsed)
  return parsed
}

/** Canonical key value for one binding token, or undefined when unknown. */
function key(token: string): string | undefined {
  if ([...token].length === 1) return token
  const lower = token.toLowerCase()
  if (ALIASES[lower]) return ALIASES[lower]
  if (NAMED.has(lower)) return NAMED.get(lower)
  if (/^f([1-9]|1[0-9]|2[0-4])$/.test(lower)) return lower.toUpperCase()
  return undefined
}

const letter = (key: string) => /^\p{L}$/u.test(key)
const printable = (key: string) => [...key].length === 1

/** Same key, ignoring letter case. */
export function sameKey(a: string, b: string): boolean {
  return a === b || (printable(a) && printable(b) && a.toLowerCase() === b.toLowerCase())
}

/**
 * Whether a key press matches one chord on the given platform.
 *
 * @remarks
 * Mod is Meta on Apple and Control elsewhere, and the other one must be up, so
 * `Mod+K` never cross-fires. Shift is implied for printable characters that are
 * not letters: `?` matches Shift+/ on a US layout. Letters need Shift written out.
 */
export function matchChord(
  state: ShortcutKeyState,
  chord: ShortcutChord,
  platform: ShortcutPlatform
): boolean {
  if (!sameKey(state.key, chord.key)) return false
  const ctrl = state.altGraph ? false : state.ctrlKey
  const alt = state.altGraph ? false : state.altKey
  const apple = platform === 'apple'
  if (ctrl !== (chord.ctrl || (chord.mod && !apple))) return false
  if (state.metaKey !== (chord.meta || (chord.mod && apple))) return false
  if (alt !== chord.alt) return false
  if (state.shiftKey === chord.shift) return true
  return state.shiftKey && !chord.shift && printable(chord.key) && !letter(chord.key)
}

/** Whether any step carries Control, Meta or Mod, which makes it safe to fire while typing. */
export function hasCommandModifier(parsed: ParsedShortcut): boolean {
  return parsed.steps.some((step) => step.mod || step.meta || step.ctrl)
}

/** Canonical text used to detect duplicate registrations. */
export function normalizeShortcut(parsed: ParsedShortcut): string {
  return parsed.steps
    .map((step) =>
      [
        step.mod && 'Mod',
        step.ctrl && 'Control',
        step.alt && 'Alt',
        step.shift && 'Shift',
        step.meta && 'Meta',
        printable(step.key) ? step.key.toLowerCase() : step.key,
      ]
        .filter(Boolean)
        .join('+')
    )
    .join(' ')
}
