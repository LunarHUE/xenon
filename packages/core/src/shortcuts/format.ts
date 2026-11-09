import { CODE_LEGENDS, parseShortcut } from './binding'
import type { ShortcutChord, ShortcutPlatform } from './binding'

/**
 * The character each physical key types on the user's keyboard, by
 * `KeyboardEvent.code`. A `Map` works, and so does the `KeyboardLayoutMap` from
 * `navigator.keyboard.getLayoutMap()`.
 */
export interface ShortcutLayout {
  get(code: string): string | undefined
}

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
 * Legend of a physical key. Digits and numpad keys read the same on every layout.
 * A letter or punctuation key shows what the user's layout types there when a
 * layout is known, and the US legend otherwise.
 */
function legend(code: string, layout?: ShortcutLayout): string {
  const us = CODE_LEGENDS[code]!
  if (/^(Digit|Numpad)/.test(code)) return us
  const typed = layout?.get(code)
  if (!typed || [...typed].length !== 1) return us
  const upper = typed.toUpperCase()
  return [...upper].length === 1 ? upper : typed
}

const numpad = (chord: ShortcutChord) => !!chord.code?.startsWith('Numpad')

/** The key part of one chord as a display token. */
function keyToken(chord: ShortcutChord, platform: ShortcutPlatform, layout?: ShortcutLayout) {
  if (chord.code) return (numpad(chord) ? 'Num ' : '') + legend(chord.code, layout)
  return (platform === 'apple' && APPLE_KEY_TOKENS[chord.key]) || KEY_TOKENS[chord.key] || chord.key
}

/**
 * Display tokens per step, one array per chord, for rendering nested `<kbd>` groups.
 *
 * @example
 * formatSteps('Mod+K', 'apple') // [['⌘', 'K']]
 * formatSteps('g n', 'other') // [['g'], ['n']]
 * formatSteps('Shift+Digit1', 'other') // [['Shift', '1']]
 */
export function formatSteps(
  binding: string,
  platform: ShortcutPlatform,
  layout?: ShortcutLayout
): string[][] {
  return parseShortcut(binding).steps.map((chord) => [
    ...modifiers(chord, platform).map((modifier) => SYMBOLS[platform][modifier]),
    keyToken(chord, platform, layout),
  ])
}

/**
 * Display tokens for a `<kbd>` hint: ⌘ and ⌥ on Apple, Ctrl and Alt elsewhere.
 * Letters keep the case written in the binding. Sequences list every step's
 * tokens in order; use {@link formatSteps} to keep the steps grouped. A physical
 * key shows its legend: the digit for `Digit1`, and for a letter or punctuation
 * key the character `layout` gives it, or its US legend without a layout.
 *
 * @example
 * formatKeys('Mod+K', 'apple') // ['⌘', 'K']
 * formatKeys('Mod+K', 'other') // ['Ctrl', 'K']
 */
export function formatKeys(
  binding: string,
  platform: ShortcutPlatform,
  layout?: ShortcutLayout
): string[] {
  return formatSteps(binding, platform, layout).flat()
}

/**
 * Spoken name for a visually hidden label or tooltip. Punctuation is named and
 * letters are upper case so screen readers announce them as letters.
 *
 * @example
 * formatLabel('Mod+K', 'apple') // 'Command K'
 * formatLabel('g n', 'other') // 'G then N'
 */
export function formatLabel(
  binding: string,
  platform: ShortcutPlatform,
  layout?: ShortcutLayout
): string {
  return parseShortcut(binding)
    .steps.map((chord) => {
      const key = chord.code ? legend(chord.code, layout) : chord.key
      return [
        ...modifiers(chord, platform).map((modifier) => SPOKEN[platform][modifier]),
        ...(numpad(chord) ? ['Numpad'] : []),
        KEY_NAMES[key] ?? ([...key].length === 1 ? key.toUpperCase() : key),
      ].join(' ')
    })
    .join(' then ')
}

/**
 * Value for `aria-keyshortcuts`, such as `Meta+K` on Apple and `Control+K` elsewhere.
 *
 * @remarks
 * ARIA reads spaces in this attribute as alternative shortcuts, not as a sequence,
 * so a multi-step binding returns undefined and the attribute should be omitted.
 * A physical key is written as its legend, so `Shift+Digit1` is `Shift+1`: ARIA asks
 * for the keys to press, not the character they produce.
 */
export function ariaKeyshortcuts(
  binding: string,
  platform: ShortcutPlatform,
  layout?: ShortcutLayout
): string | undefined {
  const { steps } = parseShortcut(binding)
  if (steps.length !== 1) return undefined
  const chord = steps[0]!
  const value = chord.code ? legend(chord.code, layout) : chord.key
  const key =
    value === ' '
      ? 'Space'
      : value === '+'
        ? 'Plus'
        : [...value].length === 1
          ? value.toUpperCase()
          : value
  return [...modifiers(chord, platform).map((modifier) => ARIA[modifier]), key].join('+')
}
