import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { ShortcutScope, configureShortcuts, createShortcut, useShortcuts } from './index'
import type { CreateShortcutOptions } from './index'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
beforeEach(() => configureShortcuts({ platform: 'other', sequenceTimeout: 1000 }))
function Bind(props: {
  handler: (event: KeyboardEvent) => void
  options?: CreateShortcutOptions
  binding?: string
}) {
  // eslint-disable-next-line solid/reactivity -- registrations belong to the fixed component lifetime.
  createShortcut(props.binding ?? 'j', props.handler, props.options)
  return null
}
function press(target: HTMLElement, key = 'j', init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  flush()
  return event
}
async function settle() {
  await Promise.resolve()
  await Promise.resolve()
  flush()
}

describe('shortcut Solid scope contracts', () => {
  test('nested scopes choose the innermost binding and restore each ancestor on focus changes', async () => {
    const global = vi.fn(),
      outer = vi.fn(),
      inner = vi.fn()
    const view = render(() => (
      <>
        <Bind handler={global} />
        <button>Outside</button>
        <ShortcutScope>
          <Bind handler={outer} />
          <button>Outer</button>
          <ShortcutScope>
            <Bind handler={inner} />
            <button>Inner</button>
          </ShortcutScope>
        </ShortcutScope>
      </>
    ))
    for (const [label, winner] of [
      ['Inner', inner],
      ['Outer', outer],
      ['Outside', global],
    ] as const) {
      const target = view.getByRole('button', { name: label })
      target.focus()
      await settle()
      const before = [global, outer, inner].map((handler) => handler.mock.calls.length)
      expect(press(target).defaultPrevented).toBe(true)
      for (const [index, handler] of [global, outer, inner].entries())
        expect(handler).toHaveBeenCalledTimes(before[index]! + (handler === winner ? 1 : 0))
    }
  })

  test('removing a scoped owner unregisters it while the global binding stays usable', async () => {
    const global = vi.fn(),
      scoped = vi.fn()
    const [present, setPresent] = createSignal(true)
    const view = render(() => (
      <>
        <Bind handler={global} />
        <button>Outside</button>
        <Show when={present()}>
          <ShortcutScope>
            <Bind handler={scoped} />
            <button>Inside</button>
          </ShortcutScope>
        </Show>
      </>
    ))
    const inside = view.getByRole('button', { name: 'Inside' })
    inside.focus()
    press(inside)
    expect(scoped).toHaveBeenCalledOnce()
    setPresent(false)
    flush()
    await settle()
    const outside = view.getByRole('button', { name: 'Outside' })
    outside.focus()
    press(outside)
    expect(global).toHaveBeenCalledOnce()
    expect(scoped).toHaveBeenCalledOnce()
  })

  for (const tag of ['input', 'textarea', 'contenteditable'] as const) {
    test(`allowInEditable overrides plain-key and chord defaults in ${tag}`, () => {
      const plain = vi.fn(),
        chord = vi.fn()
      const view = render(() => (
        <>
          <Bind handler={plain} options={{ allowInEditable: true, preventDefault: false }} />
          <Bind binding="Mod+S" handler={chord} options={{ allowInEditable: false }} />
          {tag === 'input' ? (
            <input aria-label="Editor" />
          ) : tag === 'textarea' ? (
            <textarea aria-label="Editor" />
          ) : (
            <div contenteditable="true" role="textbox" aria-label="Editor" />
          )}
        </>
      ))
      const editor = view.getByRole('textbox', { name: 'Editor' })
      editor.focus()
      expect(press(editor).defaultPrevented).toBe(false)
      expect(plain).toHaveBeenCalledOnce()
      expect(press(editor, 's', { ctrlKey: true }).defaultPrevented).toBe(false)
      expect(chord).not.toHaveBeenCalled()
    })
  }

  test('reconfiguring platform updates rendered display forms and actual modifier matching', async () => {
    const handler = vi.fn()
    function Hint() {
      const handle = createShortcut('Mod+K', handler)
      return (
        <button aria-keyshortcuts={handle.ariaKeyshortcuts()}>
          {handle.label()} {handle.keys().join('')}
        </button>
      )
    }
    const view = render(() => <Hint />)
    const button = view.getByRole('button')
    expect(button).toHaveTextContent('Control K CtrlK')
    configureShortcuts({ platform: 'apple' })
    await settle()
    expect(button).toHaveTextContent('Command K ⌘K')
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Meta+K')
    button.focus()
    press(button, 'k', { ctrlKey: true })
    expect(handler).not.toHaveBeenCalled()
    press(button, 'k', { metaKey: true })
    expect(handler).toHaveBeenCalledOnce()
  })

  test('reactively disabled registration disappears from the help list and returns with its metadata', async () => {
    const [enabled, setEnabled] = createSignal(true)
    let list!: ReturnType<typeof useShortcuts>['list']
    function Help() {
      createShortcut('g n', () => {}, { enabled, description: 'New document', group: 'Files' })
      list = useShortcuts().list
      return <button>Focus</button>
    }
    const view = render(() => <Help />)
    view.getByRole('button').focus()
    await settle()
    expect(list()).toHaveLength(1)
    expect(list()[0]).toMatchObject({ description: 'New document', group: 'Files' })
    setEnabled(false)
    await settle()
    expect(list()).toEqual([])
    setEnabled(true)
    await settle()
    expect(list()).toHaveLength(1)
    expect(list()[0]).toMatchObject({ description: 'New document', group: 'Files' })
  })
})
