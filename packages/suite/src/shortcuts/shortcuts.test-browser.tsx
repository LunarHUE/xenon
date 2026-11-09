import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Dialog } from '@xenon-ui/solid/dialog'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { Popover } from '@xenon-ui/solid/popover'
import {
  ShortcutScope,
  configureShortcuts,
  createShortcut,
  useShortcuts,
} from '@xenon-ui/solid/shortcuts'
import type { CreateShortcutOptions, ShortcutHandle } from '@xenon-ui/solid/shortcuts'
import { Slider } from '@xenon-ui/solid/slider'
import { For, Show, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
/** Let deferred list updates, mutation observers and a frame land. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
beforeEach(() => configureShortcuts({ platform: 'other', sequenceTimeout: 1000 }))
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
  vi.restoreAllMocks()
  // Leave the keyboard idle for the next test.
  await userEvent.keyboard('{/Shift}{/Control}{/Meta}{/Alt}')
})

/** Register for the component's lifetime and report the handle. */
function Bind(props: {
  binding: string
  handler: (event: KeyboardEvent) => void
  options?: CreateShortcutOptions
  handle?: (handle: ShortcutHandle) => void
}) {
  // eslint-disable-next-line solid/reactivity -- registration is fixed for the component's lifetime.
  const handle = createShortcut(props.binding, props.handler, props.options)
  // eslint-disable-next-line solid/reactivity -- reports the handle once, at setup.
  props.handle?.(handle)
  return null
}

test.each(['apple', 'other'] as const)(
  'shortcuts.keyboard.1 Mod+K fires on its own platform modifier only (%s)',
  async (platform) => {
    configureShortcuts({ platform })
    const handler = vi.fn()
    const m = mount(() => (
      <>
        <Bind binding="Mod+K" handler={handler} />
        <button>Focus</button>
      </>
    ))
    await userEvent.click(m.getByRole('button'))
    const [own, other] = platform === 'apple' ? ['Meta', 'Control'] : ['Control', 'Meta']
    await userEvent.keyboard(`{${other}>}k{/${other}}`)
    await userEvent.keyboard('{Control>}{Meta>}k{/Meta}{/Control}')
    expect(handler).not.toHaveBeenCalled()
    await userEvent.keyboard(`{${own}>}k{/${own}}`)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0]![0].defaultPrevented).toBe(true)
  }
)

test('shortcuts.keyboard.2 ? fires on Shift+/ and j does not fire on Shift+J', async () => {
  const help = vi.fn()
  const next = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="?" handler={help} />
      <Bind binding="j" handler={next} />
      <button>Focus</button>
    </>
  ))
  await userEvent.click(m.getByRole('button'))
  await userEvent.keyboard('{Shift>}?{/Shift}')
  await userEvent.keyboard('{Shift>}J{/Shift}')
  expect(help).toHaveBeenCalledOnce()
  expect(next).not.toHaveBeenCalled()
  await userEvent.keyboard('j')
  expect(next).toHaveBeenCalledOnce()
})

test('shortcuts.keyboard.5 g n fires within 1000 ms, not after 1100 ms, and not as g x n', async () => {
  let now = 0
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  const handler = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="g n" handler={handler} />
      <button>Focus</button>
    </>
  ))
  await userEvent.click(m.getByRole('button'))
  await userEvent.keyboard('g')
  now += 900
  await userEvent.keyboard('n')
  expect(handler).toHaveBeenCalledOnce()
  await userEvent.keyboard('g')
  now += 1100
  await userEvent.keyboard('n')
  await userEvent.keyboard('gxn')
  expect(handler).toHaveBeenCalledOnce()
})

test('shortcuts.keyboard.8 held-key repeats fire only with repeat: true', async () => {
  const once = vi.fn()
  const held = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={once} />
      <Bind binding="k" handler={held} options={{ repeat: true }} />
      <button>Focus</button>
    </>
  ))
  await userEvent.click(m.getByRole('button'))
  await userEvent.keyboard('{j>3/}{k>3/}')
  expect(once).toHaveBeenCalledOnce()
  expect(held).toHaveBeenCalledTimes(3)
})

test('shortcuts.keyboard.10 an author-prevented keydown never reaches shortcuts', async () => {
  const handler = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={handler} />
      <button onKeyDown={(event) => event.preventDefault()}>Focus</button>
    </>
  ))
  await userEvent.click(m.getByRole('button'))
  await userEvent.keyboard('j')
  expect(handler).not.toHaveBeenCalled()
})

test('shortcuts.focus.1 plain keys skip text fields, pin slots, contenteditable and textbox roles; Mod+K does not', async () => {
  const next = vi.fn()
  const find = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={next} />
      <Bind binding="Mod+K" handler={find} />
      <input aria-label="Name" />
      <textarea aria-label="Notes" />
      <select aria-label="Size">
        <option>S</option>
      </select>
      <PinInput length={2}>
        <PinInput.Input index={0} />
        <PinInput.Input index={1} />
      </PinInput>
      <div contenteditable="true" aria-label="Editor" role="region">
        <p>text</p>
      </div>
      <div role="combobox" tabindex="0" aria-label="Picker" aria-expanded="false" />
    </>
  ))
  const fields = [
    m.getByRole('textbox', { name: 'Name' }),
    m.getByRole('textbox', { name: 'Notes' }),
    m.getByRole('combobox', { name: 'Size' }),
    m.getByRole('textbox', { name: 'Pin code 1 of 2' }),
    m.getByRole('region', { name: 'Editor' }),
    m.getByRole('combobox', { name: 'Picker' }),
  ]
  for (const field of fields) {
    field.focus()
    await userEvent.keyboard('j')
    await userEvent.keyboard('{Control>}k{/Control}')
  }
  expect(next).not.toHaveBeenCalled()
  expect(find).toHaveBeenCalledTimes(fields.length)
})

test('shortcuts.focus.2 single keys still fire on checkboxes and button-type inputs', async () => {
  const next = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={next} />
      <input type="checkbox" aria-label="Agree" />
      <input type="radio" aria-label="Choice" />
      <input type="range" aria-label="Volume" />
      <input type="button" value="Go" />
    </>
  ))
  const controls = [
    m.getByRole('checkbox'),
    m.getByRole('radio'),
    m.getByRole('slider'),
    m.getByRole('button', { name: 'Go' }),
  ]
  for (const control of controls) {
    control.focus()
    await userEvent.keyboard('j')
  }
  expect(next).toHaveBeenCalledTimes(controls.length)
})

test('shortcuts.focus.4 a scoped binding fires only while focus is inside its scope', async () => {
  const scoped = vi.fn()
  const m = mount(() => (
    <>
      <button>Outside</button>
      <ShortcutScope>
        <Bind binding="j" handler={scoped} />
        <button>Inside</button>
      </ShortcutScope>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Outside' }))
  await userEvent.keyboard('j')
  expect(scoped).not.toHaveBeenCalled()
  await userEvent.click(m.getByRole('button', { name: 'Inside' }))
  await userEvent.keyboard('j')
  expect(scoped).toHaveBeenCalledOnce()
})

test('shortcuts.focus.5 the focused innermost scope beats outer scopes and globals', async () => {
  const global = vi.fn()
  const outer = vi.fn()
  const inner = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={global} />
      <ShortcutScope>
        <Bind binding="j" handler={outer} />
        <button>Outer</button>
        <ShortcutScope>
          <Bind binding="j" handler={inner} />
          <button>Inner</button>
        </ShortcutScope>
      </ShortcutScope>
      <button>Page</button>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Inner' }))
  await userEvent.keyboard('j')
  await userEvent.click(m.getByRole('button', { name: 'Outer' }))
  await userEvent.keyboard('j')
  await userEvent.click(m.getByRole('button', { name: 'Page' }))
  await userEvent.keyboard('j')
  expect([inner, outer, global].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1])
})

test('shortcuts.focus.6 focus inside an open shadow root decides the editable check', async () => {
  const next = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={next} />
      <div data-testid="host" />
    </>
  ))
  const root = m.getByTestId('host').attachShadow({ mode: 'open' })
  root.innerHTML = '<input aria-label="Shadow field"><button>Shadow button</button>'
  root.querySelector('input')!.focus()
  await userEvent.keyboard('j')
  expect(next).not.toHaveBeenCalled()
  root.querySelector('button')!.focus()
  await userEvent.keyboard('j')
  expect(next).toHaveBeenCalledOnce()
})

test('shortcuts.state.4 list and active follow mounts, focus, dialogs and enabled', async () => {
  const [extra, setExtra] = createSignal(false)
  const [enabled, setEnabled] = createSignal(true)
  let list!: ReturnType<typeof useShortcuts>['list']
  let help!: ShortcutHandle
  function Footer() {
    list = useShortcuts().list
    return (
      <ul aria-label="Hints">
        <For each={list()}>{(item) => <li>{item.description}</li>}</For>
      </ul>
    )
  }
  const m = mount(() => (
    <>
      <Bind
        binding="?"
        handler={() => {}}
        options={{ description: 'Help', enabled }}
        handle={(value) => (help = value)}
      />
      <Show when={extra()}>
        <Bind binding="g n" handler={() => {}} options={{ description: 'New' }} />
      </Show>
      <input aria-label="Search" />
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Peek">
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog>
      <Footer />
    </>
  ))
  const hints = () =>
    within(m.getByRole('list'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)
  await settle()
  expect(hints()).toEqual(['Help'])
  expect(help.active()).toBe(true)
  setExtra(true)
  await settle()
  expect(hints()).toEqual(['Help', 'New'])
  setEnabled(false)
  await settle()
  expect(hints()).toEqual(['New'])
  setEnabled(true)
  await userEvent.click(m.getByRole('textbox', { name: 'Search' }))
  await settle()
  expect(hints()).toEqual([])
  expect(help.active()).toBe(false)
  await userEvent.click(m.getByRole('button', { name: 'Open' }))
  await settle()
  expect(list()).toEqual([])
  await userEvent.click(m.getByRole('button', { name: 'Close' }))
  await settle()
  expect(hints()).toEqual(['Help', 'New'])
})

test('shortcuts.state.5 a duplicate warns, wins, and hands back when removed', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const first = vi.fn()
  const second = vi.fn()
  const [later, setLater] = createSignal(true)
  const m = mount(() => (
    <>
      <Bind binding="Mod+K" handler={first} options={{ description: 'Find' }} />
      <Show when={later()}>
        <Bind binding="Mod+K" handler={second} options={{ description: 'Palette' }} />
      </Show>
      <button>Focus</button>
    </>
  ))
  expect(warn).toHaveBeenCalledOnce()
  expect(warn.mock.calls[0]![0]).toContain('"Find" and "Palette"')
  await userEvent.click(m.getByRole('button'))
  await userEvent.keyboard('{Control>}k{/Control}')
  expect(second).toHaveBeenCalledOnce()
  setLater(false)
  flush()
  await userEvent.keyboard('{Control>}k{/Control}')
  expect(first).toHaveBeenCalledOnce()
})

test('shortcuts.dismissal.1 a modal dialog suppresses globals and keeps its scoped bindings', async () => {
  const global = vi.fn()
  const scoped = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={global} />
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Peek">
          <ShortcutScope>
            <Bind binding="j" handler={scoped} />
            <button>Inside</button>
          </ShortcutScope>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Open' }))
  await settle()
  expect(m.getByRole('dialog').matches(':modal')).toBe(true)
  await userEvent.click(m.getByRole('button', { name: 'Close' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Open' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Inside' }))
  await userEvent.keyboard('j')
  expect(scoped).toHaveBeenCalledOnce()
  expect(global).not.toHaveBeenCalled()
  await userEvent.click(m.getByRole('button', { name: 'Close' }))
  await settle()
  await userEvent.keyboard('j')
  expect(global).toHaveBeenCalledOnce()
  expect(scoped).toHaveBeenCalledOnce()
})

test('shortcuts.dismissal.2 Escape closes a Xenon dialog once and the global Escape stays quiet', async () => {
  const escape = vi.fn()
  const change = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="Escape" handler={escape} />
      <Dialog onOpenChange={change}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Peek">
          <button>Inside</button>
        </Dialog.Content>
      </Dialog>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Open' }))
  await settle()
  change.mockClear()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith(false)
  expect(m.queryByRole('dialog')).toBeNull()
  expect(escape).not.toHaveBeenCalled()
  await userEvent.keyboard('{Escape}')
  expect(escape).toHaveBeenCalledOnce()
})

test('shortcuts.dismissal.3 an open popover keeps globals but silences Escape bindings', async () => {
  const next = vi.fn()
  const escape = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={next} />
      <Bind binding="Escape" handler={escape} />
      <Popover>
        <Popover.Trigger>Details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details">
            <button>Inside</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Details' }))
  await settle()
  await userEvent.keyboard('j')
  expect(next).toHaveBeenCalledOnce()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(escape).not.toHaveBeenCalled()
  expect(m.queryByRole('button', { name: 'Inside' })).toBeNull()
  await userEvent.keyboard('{Escape}')
  expect(escape).toHaveBeenCalledOnce()
})

test('shortcuts.dismissal.4 a native modal dialog opened outside Xenon suppresses globals', async () => {
  const global = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="j" handler={global} />
      <dialog aria-label="Native">
        <button>Inside</button>
      </dialog>
    </>
  ))
  const dialog = m.container.querySelector('dialog')!
  dialog.showModal()
  await userEvent.click(m.getByRole('button', { name: 'Inside' }))
  await userEvent.keyboard('j')
  expect(global).not.toHaveBeenCalled()
  dialog.close()
  await userEvent.keyboard('j')
  expect(global).toHaveBeenCalledOnce()
})

test('shortcuts.dismissal.5 nested modals only run bindings scoped inside the newest one', async () => {
  const outer = vi.fn()
  const inner = vi.fn()
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Outer">
        <ShortcutScope>
          <Bind binding="j" handler={outer} />
          <Dialog>
            <Dialog.Trigger>Nested</Dialog.Trigger>
            <Dialog.Content aria-label="Inner">
              <ShortcutScope>
                <Bind binding="k" handler={inner} />
                <button>Inner button</button>
              </ShortcutScope>
            </Dialog.Content>
          </Dialog>
        </ShortcutScope>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Nested' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Inner button' }))
  await userEvent.keyboard('jk')
  expect(inner).toHaveBeenCalledOnce()
  expect(outer).not.toHaveBeenCalled()
})

test('shortcuts.roles.4 shortcuts.a11y.1 a hint button carries the aria-keyshortcuts that fires and passes axe', async () => {
  const open = vi.fn()
  function Find() {
    const find = createShortcut('Mod+K', open, { description: 'Find anything' })
    return (
      <button aria-keyshortcuts={find.ariaKeyshortcuts()} onClick={() => open()}>
        Find anything <kbd>{find.keys().join(' ')}</kbd>
      </button>
    )
  }
  const m = mount(() => <Find />)
  const button = m.getByRole('button')
  expect(button).toHaveAttribute('aria-keyshortcuts', 'Control+K')
  await userEvent.click(button)
  open.mockClear()
  await userEvent.keyboard('{Control>}k{/Control}')
  expect(open).toHaveBeenCalledOnce()
  await expectNoViolations(m.container)
})

test('shortcuts.notes.1 shortcuts.notes.2 one keydown listener while registered and none after disposal', async () => {
  const add = vi.spyOn(document, 'addEventListener')
  const remove = vi.spyOn(document, 'removeEventListener')
  mount(() => (
    <>
      <Bind binding="j" handler={() => {}} />
      <Bind binding="k" handler={() => {}} />
      <Bind binding="Mod+K" handler={() => {}} />
    </>
  ))
  const added = (type: string) => add.mock.calls.filter(([name]) => name === type)
  expect(added('keydown')).toHaveLength(1)
  expect(added('focusin')).toHaveLength(1)
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
  for (const type of ['keydown', 'focusin', 'focusout']) {
    const [, listener] = added(type)[0]!
    expect(remove.mock.calls.some(([name, fn]) => name === type && fn === listener)).toBe(true)
  }
})

test('shortcuts.notes.3 a slider that handles an arrow key keeps it from a global binding', async () => {
  const arrow = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="ArrowRight" handler={arrow} />
      <Slider defaultValue={[20]} aria-label="Volume">
        <Slider.Control>
          <Slider.Thumb index={0} aria-label="Volume" />
        </Slider.Control>
      </Slider>
      <button>Page</button>
    </>
  ))
  m.getByRole('slider').focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(m.getByRole('slider')).toHaveAttribute('aria-valuenow', '21')
  expect(arrow).not.toHaveBeenCalled()
  await userEvent.click(m.getByRole('button', { name: 'Page' }))
  await userEvent.keyboard('{ArrowRight}')
  expect(arrow).toHaveBeenCalledOnce()
})

test('shortcuts.keyboard.13 Shift+Digit1 fires on the physical key with exact modifiers', async () => {
  const fit = vi.fn()
  const bare = vi.fn()
  const m = mount(() => (
    <>
      <Bind binding="Shift+Digit1" handler={fit} />
      <Bind binding="Digit0" handler={bare} />
      <button>Focus</button>
    </>
  ))
  await userEvent.click(m.getByRole('button'))
  // A US layout types "!" on Shift+1, so the character binding `Shift+1` never fires there.
  await userEvent.keyboard('{Shift>}!{/Shift}')
  expect(fit).toHaveBeenCalledOnce()
  expect(fit.mock.calls[0]![0]).toMatchObject({ code: 'Digit1', key: '!', defaultPrevented: true })
  // A layout that types "1" there, as French AZERTY does, fires it too.
  await userEvent.keyboard('{Shift>}[Digit1]{/Shift}')
  expect(fit).toHaveBeenCalledTimes(2)
  expect(fit.mock.calls[1]![0]).toMatchObject({ code: 'Digit1', key: '1' })
  await userEvent.keyboard('1')
  await userEvent.keyboard('{Control>}{Shift>}!{/Shift}{/Control}')
  await userEvent.keyboard('{Shift>}8{/Shift}')
  expect(fit).toHaveBeenCalledTimes(2)
  // Shift is never implied for a physical key.
  await userEvent.keyboard('{Shift>}0{/Shift}')
  expect(bare).not.toHaveBeenCalled()
  await userEvent.keyboard('0')
  expect(bare).toHaveBeenCalledOnce()
})

test('shortcuts.keyboard.15 a physical-key binding follows the editable, modal, repeat and listing rules', async () => {
  const fit = vi.fn()
  const inside = vi.fn()
  const held = vi.fn()
  let view!: ReturnType<typeof useShortcuts>
  let dialog!: HTMLDialogElement
  const m = mount(() => {
    view = useShortcuts()
    return (
      <>
        <Bind binding="Shift+Digit1" handler={fit} options={{ description: 'Fit everything' }} />
        <Bind binding="KeyJ" handler={held} options={{ repeat: true }} />
        <button>Focus</button>
        <input aria-label="Name" />
        <dialog ref={(el) => (dialog = el)} aria-label="Settings">
          <ShortcutScope>
            <Bind binding="Shift+Digit1" handler={inside} />
            <button>Inside</button>
          </ShortcutScope>
        </dialog>
      </>
    )
  })
  await userEvent.click(m.getByRole('button', { name: 'Focus' }))
  await settle()
  expect(view.list().map((item) => [item.binding, item.description, item.keys])).toEqual([
    ['Shift+Digit1', 'Fit everything', ['Shift', '1']],
    ['KeyJ', undefined, ['J']],
  ])
  await userEvent.keyboard('{Shift>}[Digit1>3/]{/Shift}')
  expect(fit).toHaveBeenCalledOnce()
  await userEvent.keyboard('{j>3/}')
  expect(held).toHaveBeenCalledTimes(3)
  await userEvent.click(m.getByRole('textbox'))
  await userEvent.keyboard('{Shift>}!{/Shift}')
  expect(fit).toHaveBeenCalledOnce()
  expect(m.getByRole('textbox')).toHaveValue('!')
  dialog.showModal()
  await settle()
  await userEvent.keyboard('{Shift>}!{/Shift}')
  expect(fit).toHaveBeenCalledOnce()
  expect(inside).toHaveBeenCalledOnce()
  dialog.close()
})

test('shortcuts.roles.5 shortcuts.state.8 a physical key shows its legend, relabelled by the keyboard layout', async () => {
  onTestFinished(() => configureShortcuts({ layout: undefined }))
  configureShortcuts({ layout: new Map() })
  let digit!: ShortcutHandle
  let letter!: ShortcutHandle
  const m = mount(() => (
    <>
      <Bind binding="Shift+Digit1" handler={() => {}} handle={(handle) => (digit = handle)} />
      <Bind binding="Alt+KeyQ" handler={() => {}} handle={(handle) => (letter = handle)} />
      <button aria-keyshortcuts={digit.ariaKeyshortcuts()}>
        Fit <kbd>{digit.keys().join(' ')}</kbd>
      </button>
      <button aria-keyshortcuts={letter.ariaKeyshortcuts()}>
        Quit <kbd>{letter.keys().join(' ')}</kbd>
      </button>
    </>
  ))
  await settle()
  const fit = m.getByRole('button', { name: /Fit/ })
  const quit = m.getByRole('button', { name: /Quit/ })
  expect(fit).toHaveAttribute('aria-keyshortcuts', 'Shift+1')
  expect(fit).toHaveTextContent('Fit Shift 1')
  expect(quit).toHaveAttribute('aria-keyshortcuts', 'Alt+Q')
  expect(quit).toHaveTextContent('Quit Alt Q')
  expect(digit.label()).toBe('Shift 1')
  // French AZERTY: the Q position types "a" and the 1 key types "&".
  configureShortcuts({
    layout: new Map([
      ['KeyQ', 'a'],
      ['Digit1', '&'],
    ]),
  })
  await settle()
  expect(quit).toHaveAttribute('aria-keyshortcuts', 'Alt+A')
  expect(quit).toHaveTextContent('Quit Alt A')
  expect(letter.label()).toBe('Alt A')
  expect(fit).toHaveAttribute('aria-keyshortcuts', 'Shift+1')
  expect(fit).toHaveTextContent('Fit Shift 1')
})
