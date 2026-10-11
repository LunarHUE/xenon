import { parseShortcut } from './binding'
import type { ShortcutChord, ShortcutPlatform } from './binding'

type Modifier = 'ctrl' | 'alt' | 'shift' | 'meta'

/** Apple's menu order (⌃⌥⇧⌘), which also gives the usual Ctrl+Alt+Shift elsewhere. */
const ORDER: readonly Modifier[] = ['ctrl', 'alt', 'shift', 'meta']

const SYMBOLS: Record<ShortcutPlatform, Record<Modifier, string>> = {
  apple: { ctrl: '⌃', alt: '⌥', shift: '⇧', meta: '⌘' },
  other: { ctrl: 'Ctrl', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
}
const SPOKEN: Record<ShortcutPlatform, Record<Modifier, string>> = {
  apple: { ctrl: 'Control', alt: 'Option', shift: 'Shift', meta: 'Command' },
  other: { ctrl: 'Control', alt: 'Alt', shift: 'Shift', meta: 'Meta' },
}
const ARIA: Record<Modifier, string> = {
  ctrl: 'Control',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
}

const KEY_TOKENS: Record<string, string> = {
  Escape: 'Esc',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  ' ': 'Space',
}
const APPLE_KEY_TOKENS: Record<string, string> = {
  Enter: '↩',
  Backspace: '⌫',
  Delete: '⌦',
  Tab: '⇥',
}
const KEY_NAMES: Record<string, string> = {
  ArrowUp: 'Up arrow',
  ArrowDown: 'Down arrow',
  ArrowLeft: 'Left arrow',
  ArrowRight: 'Right arrow',
  PageUp: 'Page up',
  PageDown: 'Page down',
  ContextMenu: 'Context menu',
  PrintScreen: 'Print screen',
  ' ': 'Space',
  '?': 'Question mark',
  '/': 'Slash',
  '\\': 'Backslash',
  '[': 'Left bracket',
  ']': 'Right bracket',
  '{': 'Left brace',
  '}': 'Right brace',
  '(': 'Left parenthesis',
  ')': 'Right parenthesis',
  '<': 'Less than',
  '>': 'Greater than',
  ',': 'Comma',
  '.': 'Period',
  ';': 'Semicolon',
  ':': 'Colon',
  "'": 'Apostrophe',
  '"': 'Quote',
  '`': 'Backtick',
  '~': 'Tilde',
  '!': 'Exclamation mark',
  '@': 'At',
  '#': 'Hash',
  $: 'Dollar',
  '%': 'Percent',
  '^': 'Caret',
  '&': 'Ampersand',
  '*': 'Asterisk',
  '-': 'Minus',
  _: 'Underscore',
  '=': 'Equals',
  '+': 'Plus',
  '|': 'Vertical bar',
}

/** Modifiers held for one chord with Mod resolved for the platform, in display order. */
function modifiers(chord: ShortcutChord, platform: ShortcutPlatform): Modifier[] {
  const held = {
    ctrl: chord.ctrl || (chord.mod && platform !== 'apple'),
    alt: chord.alt,
    shift: chord.shift,
    meta: chord.meta || (chord.mod && platform === 'apple'),
  }
  return ORDER.filter((modifier) => held[modifier])
}

/**
 * Display tokens per step, one array per chord, for rendering nested `<kbd>` groups.
 *
 * @example
 * formatSteps('Mod+K', 'apple') // [['⌘', 'K']]
 * formatSteps('g n', 'other') // [['g'], ['n']]
 */
export function formatSteps(binding: string, platform: ShortcutPlatform): string[][] {
  return parseShortcut(binding).steps.map((chord) => [
    ...modifiers(chord, platform).map((modifier) => SYMBOLS[platform][modifier]),
    (platform === 'apple' && APPLE_KEY_TOKENS[chord.key]) || KEY_TOKENS[chord.key] || chord.key,
  ])
}

/**
 * Display tokens for a `<kbd>` hint: ⌘ and ⌥ on Apple, Ctrl and Alt elsewhere.
 * Letters keep the case written in the binding. Sequences list every step's
 * tokens in order; use {@link formatSteps} to keep the steps grouped.
 *
 * @example
 * formatKeys('Mod+K', 'apple') // ['⌘', 'K']
 * formatKeys('Mod+K', 'other') // ['Ctrl', 'K']
 */
export function formatKeys(binding: string, platform: ShortcutPlatform): string[] {
  return formatSteps(binding, platform).flat()
}

/**
 * Spoken name for a visually hidden label or tooltip. Punctuation is named and
 * letters are upper case so screen readers announce them as letters.
 *
 * @example
 * formatLabel('Mod+K', 'apple') // 'Command K'
 * formatLabel('g n', 'other') // 'G then N'
 */
export function formatLabel(binding: string, platform: ShortcutPlatform): string {
  return parseShortcut(binding)
    .steps.map((chord) =>
      [
        ...modifiers(chord, platform).map((modifier) => SPOKEN[platform][modifier]),
        KEY_NAMES[chord.key] ?? ([...chord.key].length === 1 ? chord.key.toUpperCase() : chord.key),
      ].join(' ')
    )
    .join(' then ')
}

/**
 * Value for `aria-keyshortcuts`, such as `Meta+K` on Apple and `Control+K` elsewhere.
 *
 * @remarks
 * ARIA reads spaces in this attribute as alternative shortcuts, not as a sequence,
 * so a multi-step binding returns undefined and the attribute should be omitted.
 */
export function ariaKeyshortcuts(binding: string, platform: ShortcutPlatform): string | undefined {
  const { steps } = parseShortcut(binding)
  if (steps.length !== 1) return undefined
  const chord = steps[0]!
  const key =
    chord.key === ' '
      ? 'Space'
      : chord.key === '+'
        ? 'Plus'
        : [...chord.key].length === 1
          ? chord.key.toUpperCase()
          : chord.key
  return [...modifiers(chord, platform).map((modifier) => ARIA[modifier]), key].join('+')
}
