import { cleanup, render } from '@solidjs/testing-library'
import { For, Show, createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Command } from './index'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}
function press(input: HTMLInputElement, key: string) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flush()
}
function type(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  flush()
}
function active(input: HTMLInputElement) {
  const id = input.getAttribute('aria-activedescendant')
  return id ? document.getElementById(id) : null
}

describe('Command mounted collection lifecycle', () => {
  test('removing the highlighted item selects a surviving item and unregisters its callback', async () => {
    const [shown, setShown] = createSignal(true)
    const removed = vi.fn()
    const survivor = vi.fn()
    const view = render(() => (
      <Command>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Show when={shown()}>
            <Command.Item value="alpha" onSelect={removed}>
              Alpha
            </Command.Item>
          </Show>
          <Command.Item value="beta" onSelect={survivor}>
            Beta
          </Command.Item>
        </Command.List>
      </Command>
    ))
    await settle()
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(active(input)).toHaveTextContent('Alpha')
    setShown(false)
    await settle()
    expect(view.queryByText('Alpha')).toBeNull()
    expect(active(input)).toHaveTextContent('Beta')
    press(input, 'Enter')
    expect(removed).not.toHaveBeenCalled()
    expect(survivor).toHaveBeenCalledOnce()
    setShown(true)
    await settle()
    press(input, 'Home')
    press(input, 'Enter')
    expect(removed).toHaveBeenCalledOnce()
  })

  test('moving keyed items updates keyboard order while retaining their DOM nodes', async () => {
    const [items, setItems] = createSignal(['alpha', 'beta', 'gamma'])
    const view = render(() => (
      <Command>
        <Command.Input aria-label="Search" />
        <Command.List>
          <For each={items()}>{(value) => <Command.Item value={value}>{value}</Command.Item>}</For>
        </Command.List>
      </Command>
    ))
    await settle()
    const input = view.getByRole('combobox') as HTMLInputElement
    const beta = view.getByText('beta')
    setItems(['gamma', 'beta', 'alpha'])
    await settle()
    expect(view.getByText('beta')).toBe(beta)
    press(input, 'Home')
    expect(active(input)).toHaveTextContent('gamma')
    press(input, 'ArrowDown')
    expect(active(input)).toBe(beta)
    press(input, 'End')
    expect(active(input)).toHaveTextContent('alpha')
  })

  test('a function child keeps keyed nodes when ranking reorders the visible items', async () => {
    const view = render(() => (
      <Command items={[{ value: 'Open a long list of things' }, { value: 'lots' }]}>
        <Command.Input aria-label="Search" />
        <Command.List>
          {(visible) => (
            <For each={visible}>
              {(item) => <Command.Item value={item.value}>{item.value}</Command.Item>}
            </For>
          )}
        </Command.List>
      </Command>
    ))
    await settle()
    const order = () => view.getAllByRole('option').map((option) => option.textContent)
    const input = view.getByRole('combobox') as HTMLInputElement
    const lots = view.getByText('lots')
    const open = view.getByText('Open a long list of things')
    expect(order()).toEqual(['Open a long list of things', 'lots'])
    type(input, 'lo')
    await settle()
    expect(order()).toEqual(['lots', 'Open a long list of things'])
    expect(view.getByText('lots')).toBe(lots)
    expect(view.getByText('Open a long list of things')).toBe(open)
  })

  test('disabled updates immediately prevent selection and restore activation when enabled', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const select = vi.fn()
    const view = render(() => (
      <Command>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Command.Item value="alpha" disabled={disabled()} onSelect={select}>
            Alpha
          </Command.Item>
          <Command.Item value="beta">Beta</Command.Item>
        </Command.List>
      </Command>
    ))
    await settle()
    const input = view.getByRole('combobox') as HTMLInputElement
    const alpha = view.getByText('Alpha')
    setDisabled(true)
    await settle()
    expect(alpha).toHaveAttribute('aria-disabled', 'true')
    expect(active(input)).toHaveTextContent('Beta')
    alpha.click()
    expect(select).not.toHaveBeenCalled()
    setDisabled(false)
    await settle()
    press(input, 'Home')
    press(input, 'Enter')
    expect(select).toHaveBeenCalledExactlyOnceWith('alpha', expect.anything())
  })

  test('reactive item keywords and values update filtering and the selected value', async () => {
    const [keywords, setKeywords] = createSignal(['old-keyword'])
    const [value, setValue] = createSignal('original')
    const select = vi.fn()
    const view = render(() => (
      <Command onSelect={select}>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Command.Item value={value()} keywords={keywords()}>
            Action
          </Command.Item>
        </Command.List>
        <Command.Empty>Nothing found</Command.Empty>
      </Command>
    ))
    await settle()
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'new-keyword')
    expect(view.queryByRole('option')).toBeNull()
    setKeywords(['new-keyword'])
    setValue('renamed')
    await settle()
    expect(active(input)).toBe(view.getByRole('option'))
    expect(view.getByText('Nothing found')).toHaveAttribute('hidden')
    press(input, 'Enter')
    expect(select).toHaveBeenCalledExactlyOnceWith('renamed', expect.anything())
  })

  test('multiple loading owners keep the list busy until the last owner is removed', async () => {
    const [first, setFirst] = createSignal(true)
    const [second, setSecond] = createSignal(true)
    const view = render(() => (
      <Command>
        <Command.Input aria-label="Search" />
        <Command.List>
          <Show when={first()}>
            <Command.Loading />
          </Show>
          <Show when={second()}>
            <Command.Loading />
          </Show>
          <Command.Item value="alpha">Alpha</Command.Item>
        </Command.List>
      </Command>
    ))
    await settle()
    const list = view.getByRole('listbox')
    expect(list).toHaveAttribute('aria-busy', 'true')
    setFirst(false)
    await settle()
    expect(list).toHaveAttribute('aria-busy', 'true')
    setSecond(false)
    await settle()
    expect(list).not.toHaveAttribute('aria-busy')
    setFirst(true)
    await settle()
    expect(list).toHaveAttribute('aria-busy', 'true')
  })

  test('unmounting cancels pending result announcements before a replacement palette mounts', () => {
    vi.useFakeTimers()
    const announce = vi.fn((count: number) => `${count} matches`)
    const view = render(() => (
      <Command announce={announce} announceDelay={100}>
        <Command.Input aria-label="First search" />
        <Command.List>
          <Command.Item value="alpha">Alpha</Command.Item>
        </Command.List>
      </Command>
    ))
    flush()
    type(view.getByRole('combobox') as HTMLInputElement, 'al')
    view.unmount()
    const replacement = render(() => (
      <Command>
        <Command.Input aria-label="Second search" />
        <Command.List />
      </Command>
    ))
    flush()
    vi.advanceTimersByTime(1000)
    flush()
    expect(announce).not.toHaveBeenCalled()
    expect(replacement.getByRole('status')).toHaveTextContent('')
  })
})
