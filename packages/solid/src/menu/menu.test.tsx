import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Menu } from './index'
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    new DOMRect(0, 0, 100, 30),
  ] as unknown as DOMRectList)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
function press(el: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}
function click(el: HTMLElement) {
  el.click()
  flush()
}
async function settleFocus(el: HTMLElement) {
  await waitFor(() => {
    flush()
    expect(el).toHaveFocus()
  })
}
describe('Menu', () => {
  test('opens on ArrowUp, roves through disabled items, loops, and selects once', async () => {
    const select = vi.fn()
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item onSelect={select}>Apple</Menu.Item>
            <Menu.Item disabled>Banana</Menu.Item>
            <Menu.Item>Cherry</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    const trigger = view.getByRole('button', { name: 'Actions' })
    expect(trigger).not.toHaveAttribute('aria-controls')
    press(trigger, 'ArrowUp')
    await settleFocus(view.getByText('Cherry'))
    expect(view.getByRole('menu')).toHaveAttribute('aria-labelledby', trigger.id)
    press(view.getByText('Cherry'), 'ArrowUp')
    expect(view.getByText('Banana')).toHaveFocus()
    expect(view.getByText('Banana')).not.toHaveAttribute('disabled')
    press(view.getByText('Banana'), 'Enter')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    press(view.getByText('Banana'), 'Home')
    press(view.getByText('Apple'), 'Enter')
    expect(select).toHaveBeenCalledTimes(1)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
  test('cancelable selection prevents a checkbox commit; checkbox and radio stay open by default', async () => {
    const change = vi.fn()
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.CheckboxItem
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={change}
            >
              Canceled
            </Menu.CheckboxItem>
            <Menu.CheckboxItem>Check</Menu.CheckboxItem>
            <Menu.RadioGroup defaultValue="a" onValueChange={change}>
              <Menu.RadioItem value="a">Radio A</Menu.RadioItem>
              <Menu.RadioItem value="b">Radio B</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('Canceled'))
    click(view.getByText('Canceled'))
    expect(change).not.toHaveBeenCalled()
    click(view.getByText('Check'))
    expect(view.getByText('Check')).toHaveAttribute('aria-checked', 'true')
    click(view.getByText('Radio B'))
    expect(view.getByText('Radio A')).toHaveAttribute('aria-checked', 'false')
    expect(change).toHaveBeenLastCalledWith('b')
    expect(view.getByText('Actions')).toHaveAttribute('aria-expanded', 'true')
  })
  test('typeahead buffers prefixes and skips disabled matches', async () => {
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Apple</Menu.Item>
            <Menu.Item disabled>Apricot</Menu.Item>
            <Menu.Item>Avocado</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('Apple'))
    press(view.getByText('Apple'), 'a')
    expect(view.getByText('Avocado')).toHaveFocus()
    press(view.getByText('Avocado'), 'p')
    expect(view.getByText('Apple')).toHaveFocus()
  })
  test('Tab closes without preventing native movement and leaves focus on the root trigger', async () => {
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Apple</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('Apple'))
    expect(press(view.getByText('Apple'), 'Tab').defaultPrevented).toBe(false)
    expect(view.getByText('Actions')).toHaveFocus()
    expect(view.getByText('Actions')).toHaveAttribute('aria-expanded', 'false')
  })
  test('nested menus open and close with arrows and selection closes the root stack', async () => {
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Sub>
              <Menu.SubTrigger>More</Menu.SubTrigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item>Nested</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('More'))
    press(view.getByText('More'), 'ArrowRight')
    await settleFocus(view.getByText('Nested'))
    press(view.getByText('Nested'), 'ArrowLeft')
    expect(view.getByText('More')).toHaveFocus()
    expect(view.getByText('Actions')).toHaveAttribute('aria-expanded', 'true')
    press(view.getByText('More'), 'ArrowRight')
    await settleFocus(view.getByText('Nested'))
    click(view.getByText('Nested'))
    expect(view.getByText('Actions')).toHaveAttribute('aria-expanded', 'false')
  })
  test('controlled requests respect cancellation and the root trigger is natively disabled', () => {
    const change = vi.fn()
    const view = render(() => (
      <Menu open={false} onOpenChange={change}>
        <Menu.Trigger disabled>Disabled</Menu.Trigger>
        <Menu.Trigger onClick={(event) => event.preventDefault()}>Canceled</Menu.Trigger>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Apple</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Disabled'))
    click(view.getByText('Canceled'))
    expect(change).not.toHaveBeenCalled()
    expect(view.getByText('Disabled')).toHaveAttribute('disabled')
    click(view.getByText('Open'))
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
    expect(view.queryByRole('menu')).toBeNull()
  })
  test('typeahead expires after 700ms, ignores composition, and navigation follows surviving items', async () => {
    const [visible, setVisible] = createSignal(true)
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Apple</Menu.Item>
            <Show when={visible()}>
              <Menu.Item>Banana</Menu.Item>
            </Show>
            <Menu.Item textValue="clementine">Fruit</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('Apple'))
    vi.useFakeTimers()
    press(view.getByText('Apple'), 'c')
    expect(view.getByText('Fruit')).toHaveFocus()
    vi.advanceTimersByTime(700)
    flush()
    press(view.getByText('Fruit'), 'b')
    expect(view.getByText('Banana')).toHaveFocus()
    view
      .getByText('Banana')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'a', isComposing: true, bubbles: true }))
    flush()
    expect(view.getByText('Banana')).toHaveFocus()
    setVisible(false)
    flush()
    press(view.getByText('Apple'), 'End')
    expect(view.getByText('Fruit')).toHaveFocus()
  })
  test('group labels survive replacement and mixed checkbox indicators reflect committed state', async () => {
    const [replacement, setReplacement] = createSignal(false)
    const view = render(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Group>
              <Show
                when={replacement()}
                fallback={<Menu.GroupLabel id="old-label">Old</Menu.GroupLabel>}
              >
                <Menu.GroupLabel id="new-label">New</Menu.GroupLabel>
              </Show>
              <Menu.CheckboxItem defaultChecked="mixed">
                Check<Menu.ItemIndicator data-testid="indicator">✓</Menu.ItemIndicator>
              </Menu.CheckboxItem>
            </Menu.Group>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByRole('menuitemcheckbox', { hidden: true }))
    expect(view.getByRole('group')).toHaveAttribute('aria-labelledby', 'old-label')
    setReplacement(true)
    flush()
    expect(view.getByRole('group')).toHaveAttribute('aria-labelledby', 'new-label')
    expect(view.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'mixed')
    click(view.getByRole('menuitemcheckbox'))
    expect(view.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true')
    expect(view.getByTestId('indicator')).toHaveAttribute('aria-hidden', 'true')
  })
  test('RTL submenu arrows reverse and Escape closes only the submenu', async () => {
    const view = render(() => (
      <Menu dir="rtl">
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Sub>
              <Menu.SubTrigger>More</Menu.SubTrigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item>Nested</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    click(view.getByText('Actions'))
    await settleFocus(view.getByText('More'))
    press(view.getByText('More'), 'ArrowLeft')
    await settleFocus(view.getByText('Nested'))
    press(view.getByText('Nested'), 'Escape')
    expect(view.getByText('More')).toHaveAttribute('aria-expanded', 'false')
    expect(view.getByText('Actions')).toHaveAttribute('aria-expanded', 'true')
  })
})

test('empty disabled attributes block trigger and item selection with nested refs', () => {
  const selected = vi.fn()
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <Menu defaultOpen>
      <Menu.Trigger disabled="" ref={refs}>
        Open
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="Actions">
          <Menu.Item disabled="" onSelect={selected}>
            Blocked
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  expect(host).toHaveBeenCalledWith(view.getByText('Open'))
  expect(view.getByText('Open')).toHaveAttribute('data-disabled')
  expect(view.getByText('Blocked')).toHaveAttribute('aria-disabled', 'true')
  click(view.getByText('Blocked'))
  expect(selected).not.toHaveBeenCalled()
  expect(view.getByRole('menu', { hidden: true })).toBeInTheDocument()
})
