import { describe, expect, test, vi } from 'vitest'
import {
  ariaKeyshortcuts,
  createShortcutRegistry,
  formatKeys,
  formatLabel,
  formatSteps,
  parseShortcut,
} from './index'
import type { ShortcutContext, ShortcutRegistryOptions } from './index'

/** Minimal element stand-in: core runs in Node and only uses these members. */
interface FakeElement {
  nodeType: 1
  localName: string
  parentNode: FakeElement | null
  attrs: Record<string, string>
  type: string
}
function element(
  localName = 'div',
  parent: Element | null = null,
  attrs: Record<string, string> = {},
  type = 'text'
): Element {
  const self: FakeElement & Record<string, unknown> = {
    nodeType: 1,
    localName,
    parentNode: parent as unknown as FakeElement | null,
    attrs,
    type,
    contains(other: FakeElement | null) {
      for (let node = other; node; node = node.parentNode) if (node === self) return true
      return false
    },
    matches: () => ['textbox', 'combobox', 'searchbox', 'spinbutton'].includes(attrs.role ?? ''),
    closest() {
      for (let node: FakeElement | null = self; node; node = node.parentNode) {
        const value = node.attrs.contenteditable
        if (value !== undefined && value !== 'false') return node
      }
      return null
    },
  }
  return self as unknown as Element
}

function press(
  key: string,
  init: Partial<
    Pick<
      KeyboardEvent,
      'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat' | 'isComposing' | 'defaultPrevented'
    >
  > & { target?: Element } = {}
): KeyboardEvent {
  let prevented = init.defaultPrevented ?? false
  return {
    type: 'keydown',
    key,
    keyCode: 0,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    isComposing: false,
    ...init,
    get defaultPrevented() {
      return prevented
    },
    preventDefault() {
      prevented = true
    },
    getModifierState: () => false,
    composedPath: () => (init.target ? [init.target] : []),
  } as unknown as KeyboardEvent
}

const idle: ShortcutContext = { focus: null, layers: [], modal: null }

function setup(options: ShortcutRegistryOptions = {}) {
  let time = 0
  const registry = createShortcutRegistry({ now: () => time, ...options })
  return {
    registry,
    advance(ms: number) {
      time += ms
    },
  }
}

describe('formatting', () => {
  test.each([
    ['Mod+K', ['⌘', 'K'], ['Ctrl', 'K'], 'Command K', 'Control K', 'Meta+K', 'Control+K'],
    [
      'Shift+?',
      ['⇧', '?'],
      ['Shift', '?'],
      'Shift Question mark',
      'Shift Question mark',
      'Shift+?',
      'Shift+?',
    ],
    ['Escape', ['Esc'], ['Esc'], 'Escape', 'Escape', 'Escape', 'Escape'],
    ['[', ['['], ['['], 'Left bracket', 'Left bracket', '[', '['],
    [
      'Alt+Shift+ArrowUp',
      ['⌥', '⇧', '↑'],
      ['Alt', 'Shift', '↑'],
      'Option Shift Up arrow',
      'Alt Shift Up arrow',
      'Alt+Shift+ArrowUp',
      'Alt+Shift+ArrowUp',
    ],
    [
      'Control+Space',
      ['⌃', 'Space'],
      ['Ctrl', 'Space'],
      'Control Space',
      'Control Space',
      'Control+Space',
      'Control+Space',
    ],
    ['g n', ['g', 'n'], ['g', 'n'], 'G then N', 'G then N', undefined, undefined],
  ])('%s', (binding, appleKeys, otherKeys, appleLabel, otherLabel, appleAria, otherAria) => {
    expect(formatKeys(binding, 'apple')).toEqual(appleKeys)
    expect(formatKeys(binding, 'other')).toEqual(otherKeys)
    expect(formatLabel(binding, 'apple')).toBe(appleLabel)
    expect(formatLabel(binding, 'other')).toBe(otherLabel)
    expect(ariaKeyshortcuts(binding, 'apple')).toBe(appleAria)
    expect(ariaKeyshortcuts(binding, 'other')).toBe(otherAria)
  })

  test('sequences keep their steps grouped', () => {
    expect(formatSteps('Mod+K Mod+S', 'apple')).toEqual([
      ['⌘', 'K'],
      ['⌘', 'S'],
    ])
    expect(formatSteps('g n', 'other')).toEqual([['g'], ['n']])
  })
})

describe('parseShortcut', () => {
  test('reads modifiers, aliases and sequences', () => {
    expect(parseShortcut('ctrl+shift+esc').steps).toEqual([
      { key: 'Escape', mod: false, meta: false, ctrl: true, alt: false, shift: true },
    ])
    expect(parseShortcut('Plus').steps[0]!.key).toBe('+')
    expect(parseShortcut('+').steps[0]!.key).toBe('+')
    expect(parseShortcut('  g   n ').steps.map((step) => step.key)).toEqual(['g', 'n'])
  })

  test.each([
    ['', 'it is empty'],
    ['Mod+', 'Plus'],
    ['Shift+Shift+A', 'appears twice'],
    ['Hyper+A', 'not a modifier'],
    ['Escpe', 'not a key name'],
    ['Mod+Shift', 'must be a key'],
    ['Mod+Meta+K', 'Mod already means'],
  ])('rejects %j', (binding, reason) => {
    expect(() => parseShortcut(binding)).toThrow(`Invalid shortcut "${binding}"`)
    expect(() => parseShortcut(binding)).toThrow(reason)
  })
})

describe('matching', () => {
  test.each(['apple', 'other'] as const)('Mod+K on %s does not cross-fire', (platform) => {
    const { registry } = setup({ platform })
    const handler = vi.fn()
    registry.register({ binding: 'Mod+K', handler })
    const right = platform === 'apple' ? { metaKey: true } : { ctrlKey: true }
    const wrong = platform === 'apple' ? { ctrlKey: true } : { metaKey: true }
    expect(registry.handle(press('k', wrong), idle)).toBe(false)
    expect(registry.handle(press('k', { metaKey: true, ctrlKey: true }), idle)).toBe(false)
    const event = press('k', right)
    expect(registry.handle(event, idle)).toBe(true)
    expect(handler).toHaveBeenCalledExactlyOnceWith(event)
    expect(event.defaultPrevented).toBe(true)
  })

  test('Shift is implied for punctuation but not for letters', () => {
    const { registry } = setup()
    const help = vi.fn()
    const next = vi.fn()
    registry.register({ binding: '?', handler: help })
    registry.register({ binding: 'j', handler: next })
    registry.handle(press('?', { shiftKey: true }), idle)
    registry.handle(press('J', { shiftKey: true }), idle)
    expect(help).toHaveBeenCalledOnce()
    expect(next).not.toHaveBeenCalled()
    registry.handle(press('J'), idle)
    expect(next).toHaveBeenCalledOnce()
  })

  test('preventDefault can be turned off', () => {
    const { registry } = setup()
    registry.register({ binding: 'f', handler() {}, preventDefault: false })
    const event = press('f')
    expect(registry.handle(event, idle)).toBe(true)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('ignore rules', () => {
  test('plain keys skip editable focus, command chords do not', () => {
    const { registry } = setup({ platform: 'other' })
    const next = vi.fn()
    const find = vi.fn()
    registry.register({ binding: 'j', handler: next })
    registry.register({ binding: 'Mod+K', handler: find })
    const root = element()
    const editable = element('div', root, { contenteditable: '' })
    const targets = [
      element('input', root),
      element('input', root, {}, 'search'),
      element('textarea', root),
      element('select', root),
      element('span', editable),
      element('div', root, { role: 'combobox' }),
    ]
    for (const target of targets) {
      registry.handle(press('j', { target }), { ...idle, focus: target })
      registry.handle(press('k', { ctrlKey: true, target }), { ...idle, focus: target })
    }
    expect(next).not.toHaveBeenCalled()
    expect(find).toHaveBeenCalledTimes(targets.length)

    const checkbox = element('input', root, {}, 'checkbox')
    registry.handle(press('j', { target: checkbox }), { ...idle, focus: checkbox })
    const island = element('span', element('div', root, { contenteditable: 'false' }))
    registry.handle(press('j', { target: island }), { ...idle, focus: island })
    expect(next).toHaveBeenCalledTimes(2)
  })

  test('allowInEditable opts a plain key in and a chord out', () => {
    const { registry } = setup({ platform: 'other' })
    const plain = vi.fn()
    const chord = vi.fn()
    registry.register({ binding: 'Escape', handler: plain, allowInEditable: true })
    registry.register({ binding: 'Mod+S', handler: chord, allowInEditable: false })
    const input = element('input')
    const context = { ...idle, focus: input }
    registry.handle(press('Escape', { target: input }), context)
    registry.handle(press('s', { ctrlKey: true, target: input }), context)
    expect(plain).toHaveBeenCalledOnce()
    expect(chord).not.toHaveBeenCalled()
  })

  test('composition, canceled events and modifier-only presses never fire', () => {
    const { registry } = setup()
    const handler = vi.fn()
    registry.register({ binding: 'j', handler })
    expect(registry.handle(press('j', { isComposing: true }), idle)).toBe(false)
    expect(registry.handle(press('j', { defaultPrevented: true }), idle)).toBe(false)
    expect(registry.handle(press('Shift', { shiftKey: true }), idle)).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  test('auto-repeat fires only with repeat: true', () => {
    const { registry } = setup()
    const once = vi.fn()
    const held = vi.fn()
    registry.register({ binding: 'j', handler: once })
    registry.register({ binding: 'k', handler: held, repeat: true })
    for (let i = 0; i < 3; i++) {
      registry.handle(press('j', { repeat: i > 0 }), idle)
      registry.handle(press('k', { repeat: i > 0 }), idle)
    }
    expect(once).toHaveBeenCalledOnce()
    expect(held).toHaveBeenCalledTimes(3)
  })

  test('enabled can be a reader', () => {
    const { registry } = setup()
    let on = false
    const handler = vi.fn()
    registry.register({ binding: 'j', handler, enabled: () => on })
    registry.handle(press('j'), idle)
    on = true
    registry.handle(press('j'), idle)
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('scopes and layers', () => {
  const page = element('body')
  const dialog = element('dialog', page)
  const inDialog = element('div', dialog)
  const panel = element('section', page)
  const button = element('button', panel)

  test('a modal suppresses globals and keeps bindings scoped inside it', () => {
    const { registry } = setup()
    const global = vi.fn()
    const scoped = vi.fn()
    const outside = vi.fn()
    registry.register({ binding: 'j', handler: global })
    registry.register({ binding: 'j', handler: scoped, scope: inDialog })
    registry.register({ binding: 'k', handler: outside, scope: panel })
    const open = { focus: inDialog, layers: [dialog], modal: dialog }
    registry.handle(press('j'), open)
    registry.handle(press('k'), { ...open, focus: button })
    expect(scoped).toHaveBeenCalledOnce()
    expect(global).not.toHaveBeenCalled()
    expect(outside).not.toHaveBeenCalled()
    registry.handle(press('j'), idle)
    expect(global).toHaveBeenCalledOnce()
    expect(registry.list(open).map((item) => item.registration.handler)).toEqual([scoped])
    expect(registry.list(idle).map((item) => item.registration.handler)).toEqual([global])
  })

  test('a scoped binding needs focus inside or its element in the topmost layer', () => {
    const { registry } = setup()
    const handler = vi.fn()
    registry.register({ binding: 'j', handler, scope: () => inDialog })
    registry.handle(press('j'), idle)
    registry.handle(press('j'), { ...idle, layers: [dialog, element('div', page)] })
    expect(handler).not.toHaveBeenCalled()
    registry.handle(press('j'), { ...idle, layers: [dialog] })
    registry.handle(press('j'), { ...idle, focus: inDialog })
    expect(handler).toHaveBeenCalledTimes(2)
  })

  test('the innermost scope wins, and the scope holding focus beats a deeper one', () => {
    const { registry } = setup()
    const outer = vi.fn()
    const inner = vi.fn()
    const global = vi.fn()
    const deep = element('div', inDialog)
    registry.register({ binding: 'j', handler: inner, scope: deep })
    registry.register({ binding: 'j', handler: outer, scope: dialog })
    registry.register({ binding: 'j', handler: global })
    const focusDeep = element('button', deep)
    registry.handle(press('j'), { ...idle, focus: focusDeep })
    expect(inner).toHaveBeenCalledOnce()
    registry.handle(press('j'), { ...idle, focus: inDialog, layers: [dialog] })
    expect(outer).toHaveBeenCalledOnce()
    expect(global).not.toHaveBeenCalled()
  })

  test('Escape bindings stand down while any layer is open', () => {
    const { registry } = setup()
    const handler = vi.fn()
    registry.register({ binding: 'Escape', handler })
    registry.register({ binding: 'Escape', handler, scope: inDialog })
    const event = press('Escape')
    expect(registry.handle(event, { focus: inDialog, layers: [dialog], modal: null })).toBe(false)
    expect(registry.handle(press('Escape'), { ...idle, modal: dialog })).toBe(false)
    expect(event.defaultPrevented).toBe(false)
    expect(registry.handle(press('Escape'), idle)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('sequences', () => {
  test('g n fires within the timeout and not after a longer gap', () => {
    const { registry, advance } = setup()
    const handler = vi.fn()
    registry.register({ binding: 'g n', handler })
    registry.handle(press('g'), idle)
    advance(900)
    expect(registry.handle(press('n'), idle)).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
    registry.handle(press('g'), idle)
    advance(1100)
    expect(registry.handle(press('n'), idle)).toBe(false)
    expect(handler).toHaveBeenCalledOnce()
  })

  test('a non-matching key resets the sequence', () => {
    const { registry } = setup()
    const handler = vi.fn()
    registry.register({ binding: 'g n', handler })
    for (const key of ['g', 'x', 'n']) registry.handle(press(key), idle)
    expect(handler).not.toHaveBeenCalled()
    for (const key of ['g', 'g', 'n']) registry.handle(press(key), idle)
    expect(handler).toHaveBeenCalledOnce()
  })

  test('the timeout is configurable and modifier presses do not break a sequence', () => {
    const { registry, advance } = setup({ sequenceTimeout: 200 })
    const handler = vi.fn()
    registry.register({ binding: 'g Shift+N', handler })
    registry.handle(press('g'), idle)
    advance(150)
    registry.handle(press('Shift', { shiftKey: true }), idle)
    registry.handle(press('N', { shiftKey: true }), idle)
    expect(handler).toHaveBeenCalledOnce()
    registry.handle(press('g'), idle)
    advance(250)
    registry.handle(press('N', { shiftKey: true }), idle)
    expect(handler).toHaveBeenCalledOnce()
  })

  test('a completed sequence beats a single key it ends with', () => {
    const { registry } = setup()
    const single = vi.fn()
    const sequence = vi.fn()
    registry.register({ binding: 'g n', handler: sequence })
    registry.register({ binding: 'n', handler: single })
    registry.handle(press('g'), idle)
    registry.handle(press('n'), idle)
    expect(sequence).toHaveBeenCalledOnce()
    expect(single).not.toHaveBeenCalled()
    registry.handle(press('n'), idle)
    expect(single).toHaveBeenCalledOnce()
  })
})

describe('registry', () => {
  test('a duplicate warns with both names, wins, and hands back on removal', () => {
    const warn = vi.fn()
    const { registry } = setup({ warn, platform: 'apple' })
    const first = vi.fn()
    const second = vi.fn()
    registry.register({ binding: 'Mod+K', handler: first, description: 'Find anything' })
    const remove = registry.register({ binding: 'mod+k', handler: second })
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      'Shortcut "mod+k" is registered twice in the same scope: "Find anything" and registration #2. The later one wins until it is removed.'
    )
    registry.handle(press('k', { metaKey: true }), idle)
    expect(second).toHaveBeenCalledOnce()
    expect(registry.list(idle)).toHaveLength(1)
    remove()
    remove()
    registry.handle(press('k', { metaKey: true }), idle)
    expect(first).toHaveBeenCalledOnce()
    expect(registry.size).toBe(1)
  })

  test('different scopes do not warn', () => {
    const warn = vi.fn()
    const { registry } = setup({ warn })
    registry.register({ binding: 'j', handler() {} })
    registry.register({ binding: 'j', handler() {}, scope: element() })
    expect(warn).not.toHaveBeenCalled()
  })

  test('list carries descriptions, groups and platform formatting', () => {
    const { registry } = setup({ platform: 'apple' })
    registry.register({ binding: 'Mod+K', handler() {}, description: 'Find', group: 'General' })
    registry.register({ binding: 'j', handler() {}, enabled: false })
    expect(registry.list(idle)).toEqual([
      expect.objectContaining({
        binding: 'Mod+K',
        description: 'Find',
        group: 'General',
        keys: ['⌘', 'K'],
        label: 'Command K',
        ariaKeyshortcuts: 'Meta+K',
      }),
    ])
    registry.configure({ platform: 'other' })
    expect(registry.list(idle)[0]!.keys).toEqual(['Ctrl', 'K'])
  })

  test('list hides plain keys while focus is editable', () => {
    const { registry } = setup()
    registry.register({ binding: 'j', handler() {} })
    registry.register({ binding: 'Mod+K', handler() {} })
    const input = element('input')
    expect(registry.list({ ...idle, focus: input }).map((item) => item.binding)).toEqual(['Mod+K'])
  })

  test('register rejects an invalid binding', () => {
    const { registry } = setup()
    expect(() => registry.register({ binding: 'Mod+', handler() {} })).toThrow('"Mod+"')
    expect(registry.size).toBe(0)
  })
})
