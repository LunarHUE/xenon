import { cleanup, render } from '@solidjs/testing-library'
import { For, Show, createSignal, flush } from 'solid-js'
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { Dialog } from '../dialog'
import { configureShortcuts, useShortcuts } from '../shortcuts'
import { Command, useCommand } from './index'
import type { CommandItemData } from './index'

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
  vi.useRealTimers()
  vi.restoreAllMocks()
})

/** Let deferred shortcut invalidations and registrations land. */
async function settle() {
  await Promise.resolve()
  await Promise.resolve()
  flush()
}
function press(key: string, init: KeyboardEventInit = {}, target?: EventTarget) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  ;(target ?? document.activeElement ?? document.body).dispatchEvent(event)
  flush()
  return event
}
function type(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  flush()
}
const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!
const option = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')].find(
    (node) => node.dataset.value === name
  )!
const visible = () =>
  [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    .filter((node) => !node.hidden)
    .map((node) => node.dataset.value)
const active = () => input().getAttribute('aria-activedescendant')

function Palette(props: { onSelect?: (value: string) => void }) {
  return (
    <Command>
      <Command.Input aria-label="Search commands" />
      <Command.List>
        <Command.Empty>No results</Command.Empty>
        <Command.Group value="file">
          <Command.GroupHeading>File</Command.GroupHeading>
          <Command.Item value="New file" onSelect={props.onSelect}>
            New file
          </Command.Item>
          <Command.Item value="Open recent" keywords={['history']} onSelect={props.onSelect}>
            Open recent
          </Command.Item>
          <Command.Item value="Save" disabled onSelect={props.onSelect}>
            Save
          </Command.Item>
        </Command.Group>
        <Command.Separator />
        <Command.Group value="view">
          <Command.GroupHeading>View</Command.GroupHeading>
          <Command.Item value="Toggle sidebar" onSelect={props.onSelect}>
            Toggle sidebar
          </Command.Item>
          <Command.Item value="Zoom in" onSelect={props.onSelect}>
            Zoom in
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command>
  )
}

describe('Command', () => {
  test('wires the input to the list and highlights the first item', () => {
    render(() => <Palette />)
    flush()
    const list = document.querySelector('[role="listbox"]')!
    expect(input()).toHaveAttribute('aria-expanded', 'true')
    expect(input()).toHaveAttribute('aria-controls', list.id)
    expect(active()).toBe(option('New file').id)
    expect(option('New file')).toHaveAttribute('data-active')
    expect(option('Save')).toHaveAttribute('aria-disabled', 'true')
    const group = option('New file').closest('[role="group"]')!
    expect(document.getElementById(group.getAttribute('aria-labelledby')!)).toHaveTextContent(
      'File'
    )
    expect(document.querySelector('[data-part="empty"]')).toHaveAttribute('hidden')
  })

  test('filters by value and keywords, hides empty groups and shows Empty', () => {
    render(() => <Palette />)
    flush()
    type(input(), 'zoom')
    expect(visible()).toEqual(['Zoom in'])
    expect(option('New file').closest('[role="group"]')).toHaveAttribute('hidden')
    expect(document.querySelector('[role="separator"]')).toHaveAttribute('hidden')
    expect(active()).toBe(option('Zoom in').id)
    type(input(), 'history')
    expect(visible()).toEqual(['Open recent'])
    type(input(), 'qqqq')
    expect(visible()).toEqual([])
    expect(document.querySelector('[data-part="empty"]')).not.toHaveAttribute('hidden')
    expect(document.querySelector('[data-part="root"]')).toHaveAttribute('data-empty')
    expect(active()).toBeNull()
  })

  test('arrows skip disabled items, wrap, jump and keep focus in the input', () => {
    render(() => <Palette />)
    flush()
    input().focus()
    press('ArrowDown')
    press('ArrowDown')
    expect(active()).toBe(option('Toggle sidebar').id)
    press('End')
    expect(active()).toBe(option('Zoom in').id)
    press('ArrowDown')
    expect(active()).toBe(option('New file').id)
    press('ArrowUp')
    expect(active()).toBe(option('Zoom in').id)
    press('Home')
    expect(active()).toBe(option('New file').id)
    press('ArrowDown', { ctrlKey: true })
    expect(active()).toBe(option('Toggle sidebar').id)
    press('ArrowUp', { metaKey: true })
    expect(active()).toBe(option('New file').id)
    expect(document.activeElement).toBe(input())
  })

  test('loop={false} stops at the ends', () => {
    render(() => (
      <Command loop={false}>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Command.Item value="a">a</Command.Item>
          <Command.Item value="b">b</Command.Item>
        </Command.List>
      </Command>
    ))
    flush()
    input().focus()
    press('ArrowUp')
    expect(active()).toBe(option('a').id)
    press('ArrowDown')
    press('ArrowDown')
    expect(active()).toBe(option('b').id)
  })

  test('Enter and clicks run onSelect for enabled items only', () => {
    const select = vi.fn()
    render(() => <Palette onSelect={select} />)
    flush()
    input().focus()
    press('ArrowDown')
    press('Enter')
    expect(select).toHaveBeenLastCalledWith('Open recent', expect.anything())
    option('Save').click()
    flush()
    expect(select).toHaveBeenCalledTimes(1)
    option('Zoom in').dispatchEvent(new PointerEvent('pointermove', { bubbles: true }))
    flush()
    expect(active()).toBe(option('Zoom in').id)
    const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 })
    option('Zoom in').dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    option('Zoom in').click()
    flush()
    expect(select).toHaveBeenLastCalledWith('Zoom in', expect.anything())
  })

  test('controlled query and highlight report changes', () => {
    const [query, setQuery] = createSignal('')
    const queries = vi.fn((value: string) => setQuery(value))
    const highlights = vi.fn()
    render(() => (
      <Command query={query()} onQueryChange={queries} onActiveChange={highlights}>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Command.Item value="alpha">alpha</Command.Item>
          <Command.Item value="beta">beta</Command.Item>
        </Command.List>
      </Command>
    ))
    flush()
    type(input(), 'be')
    expect(queries).toHaveBeenLastCalledWith('be')
    expect(visible()).toEqual(['beta'])
    setQuery('')
    flush()
    expect(input().value).toBe('')
    input().focus()
    press('ArrowDown')
    expect(highlights).toHaveBeenLastCalledWith('beta')
  })

  test('pages push from onSelect and pop on Backspace and Escape', () => {
    function Pages() {
      const command = useCommand()
      return (
        <Show
          when={command.page() === 'machines'}
          fallback={
            <Command.Item value="Machines" onSelect={() => command.pushPage('machines')}>
              Machines
            </Command.Item>
          }
        >
          <Command.Item value="alpha-01">alpha-01</Command.Item>
          <Command.Item value="beta-02">beta-02</Command.Item>
        </Show>
      )
    }
    const pages = vi.fn()
    render(() => (
      <Command onPagesChange={pages}>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Pages />
        </Command.List>
      </Command>
    ))
    flush()
    const root = document.querySelector('[data-part="root"]')!
    input().focus()
    type(input(), 'mach')
    press('Enter')
    expect(pages).toHaveBeenLastCalledWith(['machines'])
    expect(root).toHaveAttribute('data-page', 'machines')
    expect(input().value).toBe('')
    expect(visible()).toEqual(['alpha-01', 'beta-02'])
    type(input(), 'b')
    press('Backspace')
    expect(root).toHaveAttribute('data-page', 'machines')
    type(input(), '')
    press('Backspace')
    expect(root).not.toHaveAttribute('data-page')
    expect(pages).toHaveBeenLastCalledWith([])
    press('Enter')
    const escape = press('Escape')
    expect(escape.defaultPrevented).toBe(true)
    expect(root).not.toHaveAttribute('data-page')
    expect(press('Escape').defaultPrevented).toBe(false)
  })

  test('item shortcuts announce, render and fire only while the palette is active', async () => {
    const select = vi.fn()
    render(() => (
      <>
        <button>Outside</button>
        <Command>
          <Command.Input aria-label="Search" />
          <Command.List>
            <Command.Item value="Reload" shortcut="Mod+Shift+R" onSelect={select}>
              Reload
              <Command.Shortcut />
            </Command.Item>
            <Command.Item value="Plain">
              Plain
              <Command.Shortcut />
            </Command.Item>
          </Command.List>
        </Command>
      </>
    ))
    await settle()
    expect(option('Reload')).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+R')
    const hint = option('Reload').querySelector('[data-part="shortcut"]')!
    expect(hint).toHaveAttribute('aria-hidden', 'true')
    expect([...hint.querySelectorAll('kbd')].map((node) => node.textContent)).toEqual([
      'Ctrl',
      'Shift',
      'R',
    ])
    expect(option('Plain').querySelector('[data-part="shortcut"]')).toBeNull()
    document.querySelector('button')!.focus()
    await settle()
    press('R', { ctrlKey: true, shiftKey: true })
    expect(select).not.toHaveBeenCalled()
    input().focus()
    await settle()
    press('R', { ctrlKey: true, shiftKey: true })
    expect(select).toHaveBeenCalledWith('Reload', expect.anything())
  })

  test('announces the result count once typing settles', () => {
    vi.useFakeTimers()
    render(() => <Palette />)
    flush()
    const status = document.querySelector('[data-part="announcer"]')!
    expect(status).toHaveAttribute('aria-live', 'polite')
    // Items registering after mount are not a search result.
    vi.advanceTimersByTime(1000)
    flush()
    expect(status).toHaveTextContent('')
    type(input(), 'z')
    type(input(), 'zo')
    vi.advanceTimersByTime(499)
    flush()
    expect(status).toHaveTextContent('')
    vi.advanceTimersByTime(1)
    flush()
    expect(status).toHaveTextContent('1 result')
    type(input(), 'qq')
    vi.advanceTimersByTime(500)
    flush()
    expect(status).toHaveTextContent('No results')
  })

  test('items ranks results and a function child renders them', () => {
    const items: CommandItemData[] = [
      { value: 'Open a long list of things' },
      { value: 'lots' },
      { value: 'Settings' },
    ]
    render(() => (
      <Command items={items}>
        <Command.Input aria-label="Search" />
        <Command.List>
          {(visibleItems) => (
            <For each={visibleItems}>
              {(item) => <Command.Item value={item.value}>{item.value}</Command.Item>}
            </For>
          )}
        </Command.List>
      </Command>
    ))
    flush()
    type(input(), 'lo')
    expect(visible()).toEqual(['lots', 'Open a long list of things'])
    expect(active()).toBe(option('lots').id)
  })

  test('server-side lists skip filtering and Loading marks the list busy', () => {
    const [loading, setLoading] = createSignal(true)
    render(() => (
      <Command shouldFilter={false}>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Show when={loading()}>
            <Command.Loading progress={40} />
          </Show>
          <Command.Item value="anything">anything</Command.Item>
        </Command.List>
      </Command>
    ))
    flush()
    type(input(), 'zzz')
    expect(visible()).toEqual(['anything'])
    expect(document.querySelector('[role="listbox"]')).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '40')
    setLoading(false)
    flush()
    expect(document.querySelector('[role="listbox"]')).not.toHaveAttribute('aria-busy')
  })
})

describe('Command.Dialog', () => {
  // tabbable treats elements without layout boxes as hidden, and jsdom has no layout.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(0, 0, 100, 30),
    ] as unknown as DOMRectList)
  })
  function Shell(props: { onSelect?: (value: string, event: { preventDefault(): void }) => void }) {
    return (
      <>
        <button>Before</button>
        <Command.Dialog>
          <Command.Input aria-label="Search commands" />
          <Command.List>
            <Command.Item value="Run" onSelect={props.onSelect}>
              Run
            </Command.Item>
            <Command.Item value="Stay" onSelect={(_, event) => event.preventDefault()}>
              Stay
            </Command.Item>
          </Command.List>
        </Command.Dialog>
      </>
    )
  }
  const dialog = () => document.querySelector('dialog')

  test('Mod+K opens it with focus in the input; Escape closes and restores focus', async () => {
    render(() => <Shell />)
    await settle()
    const before = document.querySelector('button')!
    before.focus()
    press('k', { ctrlKey: true })
    await settle()
    flush()
    expect(dialog()).toHaveAttribute('open')
    expect(dialog()).toHaveAttribute('aria-label', 'Command palette')
    expect(document.activeElement).toBe(input())
    press('Escape')
    await settle()
    expect(dialog()).toBeNull()
    expect(document.activeElement).toBe(before)
  })

  test('the open shortcut is listed and closes the open palette', async () => {
    let list: ReturnType<typeof useShortcuts>['list'] | undefined
    function Listing() {
      list = useShortcuts().list
      return undefined
    }
    render(() => (
      <>
        <Shell />
        <Listing />
      </>
    ))
    await settle()
    expect(list!().map((item) => [item.binding, item.description])).toContainEqual([
      'Mod+K',
      'Open command palette',
    ])
    press('k', { ctrlKey: true })
    await settle()
    expect(dialog()).not.toBeNull()
    press('k', { ctrlKey: true })
    await settle()
    expect(dialog()).toBeNull()
  })

  test('selecting closes unless the handler cancels', async () => {
    const run = vi.fn()
    render(() => <Shell onSelect={run} />)
    await settle()
    press('k', { ctrlKey: true })
    await settle()
    press('ArrowDown')
    press('Enter')
    await settle()
    expect(dialog()).not.toBeNull()
    press('Home')
    press('Enter')
    await settle()
    expect(run).toHaveBeenCalledWith('Run', expect.anything())
    expect(dialog()).toBeNull()
  })

  test('openShortcut={false} registers nothing and a handle trigger opens it', async () => {
    const handle = Dialog.createHandle()
    render(() => (
      <>
        <Dialog.Trigger handle={handle}>Open palette</Dialog.Trigger>
        <Command.Dialog handle={handle} openShortcut={false} label="Actions">
          <Command.Input aria-label="Search" />
          <Command.List />
        </Command.Dialog>
      </>
    ))
    await settle()
    press('k', { ctrlKey: true })
    await settle()
    expect(dialog()).toBeNull()
    const trigger = document.querySelector('button')!
    trigger.focus()
    trigger.click()
    await settle()
    expect(dialog()).toHaveAttribute('aria-label', 'Actions')
    press('Escape')
    await settle()
    expect(document.activeElement).toBe(trigger)
  })

  test('removing an open palette through a list does not throw', async () => {
    const [rows, setRows] = createSignal([0])
    render(() => (
      <For each={rows()}>
        {() => (
          <Command.Dialog open>
            <Command.Input aria-label="Search" />
            <Command.List>
              <Command.Item value="a" shortcut="Mod+J">
                a
              </Command.Item>
            </Command.List>
          </Command.Dialog>
        )}
      </For>
    ))
    await settle()
    expect(dialog()).not.toBeNull()
    setRows([])
    flush()
    await settle()
    expect(dialog()).toBeNull()
  })
})
