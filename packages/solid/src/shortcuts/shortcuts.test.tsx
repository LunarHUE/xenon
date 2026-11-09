import { cleanup, render } from '@solidjs/testing-library'
import { For, Show, createSignal, flush } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { Dialog } from '../dialog'
import { PinInput } from '../pin-input'
import { ShortcutScope, configureShortcuts, createShortcut, useShortcuts } from './index'
import type { CreateShortcutOptions, ShortcutHandle } from './index'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})
beforeEach(() => configureShortcuts({ platform: 'other', sequenceTimeout: 1000 }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** Let deferred list invalidations land, then flush Solid. */
async function settle() {
  await Promise.resolve()
  await Promise.resolve()
  flush()
}

function press(
  key: string,
  init: KeyboardEventInit = {},
  target: EventTarget = document.activeElement ?? document.body
) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  flush()
  return event
}

/** Register inside a component and expose the handle to the test. */
function Bind(props: {
  binding: string
  handler: (event: KeyboardEvent) => void
  options?: CreateShortcutOptions
  handle?: (handle: ShortcutHandle) => void
  children?: JSX.Element
}) {
  // eslint-disable-next-line solid/reactivity -- registration is fixed for the component's lifetime.
  const handle = createShortcut(props.binding, props.handler, props.options)
  // eslint-disable-next-line solid/reactivity -- reports the handle once, at setup.
  props.handle?.(handle)
  return <>{props.children}</>
}

describe('platform', () => {
  test.each(['apple', 'other'] as const)(
    'Mod+K on %s fires only on its own modifier',
    (platform) => {
      configureShortcuts({ platform })
      const handler = vi.fn()
      let handle!: ShortcutHandle
      render(() => <Bind binding="Mod+K" handler={handler} handle={(value) => (handle = value)} />)
      const apple = platform === 'apple'
      press('k', apple ? { ctrlKey: true } : { metaKey: true })
      expect(handler).not.toHaveBeenCalled()
      press('k', apple ? { metaKey: true } : { ctrlKey: true })
      expect(handler).toHaveBeenCalledOnce()
      expect(handle.keys()).toEqual(apple ? ['⌘', 'K'] : ['Ctrl', 'K'])
      expect(handle.label()).toBe(apple ? 'Command K' : 'Control K')
      expect(handle.ariaKeyshortcuts()).toBe(apple ? 'Meta+K' : 'Control+K')
    }
  )

  test('the handle drives a button hint and its aria-keyshortcuts', () => {
    const open = vi.fn()
    function Find() {
      const find = createShortcut('Mod+K', open, { description: 'Find anything' })
      return (
        <button aria-keyshortcuts={find.ariaKeyshortcuts()} onClick={open}>
          Find anything <kbd>{find.keys().join('')}</kbd>
        </button>
      )
    }
    const view = render(() => <Find />)
    const button = view.getByRole('button')
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K')
    expect(button).toHaveTextContent('CtrlK')
  })
})

describe('focus and input', () => {
  test('j skips inputs, pin input slots and contenteditable; Mod+K does not', () => {
    const next = vi.fn()
    const find = vi.fn()
    const view = render(() => (
      <>
        <Bind binding="j" handler={next} />
        <Bind binding="Mod+K" handler={find} />
        <input aria-label="name" />
        <PinInput length={2}>
          <PinInput.Input index={0} />
          <PinInput.Input index={1} />
        </PinInput>
        <div contenteditable="true" data-testid="editor">
          <span data-testid="inner">text</span>
        </div>
        <button>plain</button>
      </>
    ))
    const targets = [
      view.getByRole('textbox', { name: 'name' }),
      view.getByRole('textbox', { name: 'Pin code 1 of 2' }),
      view.getByTestId('inner'),
    ]
    for (const target of targets) {
      if (target instanceof HTMLElement && target.tabIndex >= -1) target.focus()
      press('j', {}, target)
      press('k', { ctrlKey: true }, target)
    }
    expect(next).not.toHaveBeenCalled()
    expect(find).toHaveBeenCalledTimes(3)
    view.getByRole('button').focus()
    press('j')
    expect(next).toHaveBeenCalledOnce()
  })

  test('a composing keydown never fires', () => {
    const handler = vi.fn()
    render(() => <Bind binding="j" handler={handler} />)
    press('j', { isComposing: true })
    expect(handler).not.toHaveBeenCalled()
  })

  test('held-key repeats are ignored unless repeat is set', () => {
    const once = vi.fn()
    const held = vi.fn()
    render(() => (
      <>
        <Bind binding="j" handler={once} />
        <Bind binding="k" handler={held} options={{ repeat: true }} />
      </>
    ))
    for (const repeat of [false, true, true]) {
      press('j', { repeat })
      press('k', { repeat })
    }
    expect(once).toHaveBeenCalledOnce()
    expect(held).toHaveBeenCalledTimes(3)
  })

  test('enabled accepts an accessor', () => {
    const handler = vi.fn()
    const [enabled, setEnabled] = createSignal(false)
    render(() => <Bind binding="j" handler={handler} options={{ enabled }} />)
    press('j')
    setEnabled(true)
    flush()
    press('j')
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('layers', () => {
  function Page(props: { global: () => void; scoped: () => void; escape?: () => void }) {
    const [open, setOpen] = createSignal(false)
    return (
      <>
        <Bind binding="j" handler={props.global} />
        <Bind binding="Escape" handler={props.escape ?? (() => {})} />
        <button onClick={() => setOpen(true)}>Open</button>
        <Dialog open={open()} onOpenChange={setOpen}>
          <Dialog.Content aria-label="Peek">
            <ShortcutScope>
              <Bind binding="j" handler={props.scoped} />
              <button>Inside</button>
            </ShortcutScope>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </>
    )
  }

  test('a modal dialog suppresses globals and keeps its scoped bindings', async () => {
    const global = vi.fn()
    const scoped = vi.fn()
    const view = render(() => <Page global={global} scoped={scoped} />)
    view.getByText('Open').click()
    flush()
    view.getByText('Inside').focus()
    press('j')
    expect(scoped).toHaveBeenCalledOnce()
    expect(global).not.toHaveBeenCalled()
    view.getByText('Close').click()
    flush()
    await settle()
    view.getByText('Open').focus()
    press('j')
    expect(global).toHaveBeenCalledOnce()
    expect(scoped).toHaveBeenCalledOnce()
  })

  test('Escape closes the dialog once and the global Escape binding stays quiet', () => {
    const escape = vi.fn()
    const change = vi.fn()
    const view = render(() => (
      <>
        <Bind binding="Escape" handler={escape} />
        <Dialog defaultOpen onOpenChange={change}>
          <Dialog.Content aria-label="Peek">
            <button>Inside</button>
          </Dialog.Content>
        </Dialog>
      </>
    ))
    view.getByText('Inside').focus()
    press('Escape')
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
    expect(view.queryByRole('dialog')).toBeNull()
    expect(escape).not.toHaveBeenCalled()
    press('Escape', {}, document.body)
    expect(escape).toHaveBeenCalledOnce()
  })
})

describe('sequences', () => {
  test('g n fires within 1000 ms, not after 1100 ms, and not as g x n', () => {
    let now = 0
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const handler = vi.fn()
    render(() => <Bind binding="g n" handler={handler} />)
    press('g')
    now += 900
    press('n')
    expect(handler).toHaveBeenCalledOnce()
    press('g')
    now += 1100
    press('n')
    for (const key of ['g', 'x', 'n']) press(key)
    expect(handler).toHaveBeenCalledOnce()
  })
})

describe('registry', () => {
  test('a duplicate warns in development, wins, and hands back on removal', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = vi.fn()
    const second = vi.fn()
    const [later, setLater] = createSignal(true)
    render(() => (
      <>
        <Bind binding="Mod+K" handler={first} options={{ description: 'Find' }} />
        <Show when={later()}>
          <Bind binding="Mod+K" handler={second} options={{ description: 'Palette' }} />
        </Show>
      </>
    ))
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]![0]).toContain('"Find" and "Palette"')
    press('k', { ctrlKey: true })
    expect(second).toHaveBeenCalledOnce()
    setLater(false)
    flush()
    press('k', { ctrlKey: true })
    expect(first).toHaveBeenCalledOnce()
  })

  test('list and active follow registrations, focus and modals', async () => {
    const [extra, setExtra] = createSignal(false)
    let list!: ReturnType<typeof useShortcuts>['list']
    let help!: ShortcutHandle
    function Help() {
      list = useShortcuts().list
      return (
        <ul>
          <For each={list()}>{(item) => <li>{item.description}</li>}</For>
        </ul>
      )
    }
    const view = render(() => (
      <>
        <Bind
          binding="?"
          handler={() => {}}
          options={{ description: 'Help', group: 'General' }}
          handle={(value) => (help = value)}
        />
        <Show when={extra()}>
          <Bind binding="g n" handler={() => {}} options={{ description: 'New' }} />
        </Show>
        <input aria-label="search" />
        <Dialog>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Content aria-label="Peek">
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Content>
        </Dialog>
        <Help />
      </>
    ))
    await settle()
    expect(list().map((item) => item.description)).toEqual(['Help'])
    expect(list()[0]).toMatchObject({ group: 'General', keys: ['?'], label: 'Question mark' })
    expect(help.active()).toBe(true)

    setExtra(true)
    await settle()
    expect(view.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Help', 'New'])

    view.getByRole('textbox').focus()
    await settle()
    expect(list()).toEqual([])
    expect(help.active()).toBe(false)

    view.getByText('Open').click()
    flush()
    await settle()
    expect(list()).toEqual([])
    view.getByText('Close').click()
    flush()
    view.getByText('Open').focus()
    await settle()
    expect(list().map((item) => item.description)).toEqual(['Help', 'New'])
  })

  test('disposing the owner unregisters and removes the document listener', async () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const handler = vi.fn()
    const view = render(() => (
      <>
        <Bind binding="j" handler={handler} />
        <Bind binding="k" handler={handler} />
      </>
    ))
    const keydowns = add.mock.calls.filter(([type]) => type === 'keydown')
    expect(keydowns).toHaveLength(1)
    view.unmount()
    expect(remove).toHaveBeenCalledWith('keydown', keydowns[0]![1])
    expect(remove.mock.calls.filter(([type]) => type === 'focusin')).toHaveLength(1)
    press('j', {}, document.body)
    expect(handler).not.toHaveBeenCalled()
    await settle()
  })
})

describe('physical keys', () => {
  afterEach(() => configureShortcuts({ layout: undefined }))

  test('Shift+Digit1 fires on the key, skips text fields and lists like any binding', async () => {
    const fit = vi.fn()
    let view!: ReturnType<typeof useShortcuts>
    const { getByRole } = render(() => {
      view = useShortcuts()
      return (
        <Bind binding="Shift+Digit1" handler={fit} options={{ description: 'Fit everything' }}>
          <input aria-label="Search" />
        </Bind>
      )
    })
    await settle()
    expect(view.list()).toEqual([
      expect.objectContaining({
        binding: 'Shift+Digit1',
        description: 'Fit everything',
        keys: ['Shift', '1'],
        label: 'Shift 1',
        ariaKeyshortcuts: 'Shift+1',
      }),
    ])
    press('!', { code: 'Digit1', shiftKey: true })
    press('1', { code: 'Digit1', shiftKey: true })
    expect(fit).toHaveBeenCalledTimes(2)
    press('!', { code: 'Digit1', shiftKey: true, ctrlKey: true })
    press('!', { code: 'Digit1', shiftKey: true, repeat: true })
    press('!', { code: 'Digit8', shiftKey: true })
    getByRole('textbox').focus()
    press('!', { code: 'Digit1', shiftKey: true })
    expect(fit).toHaveBeenCalledTimes(2)
  })

  test('the hint follows the keyboard layout once one is known', async () => {
    let handle!: ShortcutHandle
    const { getByRole } = render(() => (
      <Bind binding="Alt+KeyQ" handler={() => {}} handle={(value) => (handle = value)}>
        <button aria-keyshortcuts={handle.ariaKeyshortcuts()}>{handle.keys().join('+')}</button>
      </Bind>
    ))
    const button = getByRole('button')
    expect(button).toHaveTextContent('Alt+Q')
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+Q')
    configureShortcuts({ layout: new Map([['KeyQ', 'a']]) })
    await settle()
    expect(button).toHaveTextContent('Alt+A')
    expect(button).toHaveAttribute('aria-keyshortcuts', 'Alt+A')
    expect(handle.label()).toBe('Alt A')
  })
})
