import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Listbox } from './listbox'
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
function press(el: HTMLElement, key: string, init: KeyboardEventInit = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
  flush()
}
describe('Listbox', () => {
  test('roves enabled options and commits once on click, never pointerdown', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox aria-label="Fruit" onValueChange={change}>
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b" disabled>
          Banana
        </Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple'),
      cherry = view.getByText('Cherry')
    expect(apple).toHaveAttribute('tabindex', '0')
    apple.focus()
    press(apple, 'ArrowDown')
    expect(cherry).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
    cherry.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }))
    flush()
    expect(change).not.toHaveBeenCalled()
    cherry.click()
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    expect(cherry).toHaveAttribute('aria-selected', 'true')
  })
  test('virtual focus retains root focus and publishes active descendant', () => {
    const view = render(() => (
      <Listbox virtualFocus aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    const root = view.getByRole('listbox')
    root.focus()
    press(root, 'ArrowDown')
    expect(root).toHaveFocus()
    expect(root).toHaveAttribute('aria-activedescendant', view.getByText('Banana').id)
    expect(view.getByText('Banana')).toHaveAttribute('tabindex', '-1')
    press(root, 'Enter')
    expect(view.getByText('Banana')).toHaveAttribute('aria-selected', 'true')
  })
  test('multiple selection toggles and supports ranges without duplicate bubbled handling', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox selectionMode="multiple" onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple')
    apple.focus()
    press(apple, ' ')
    expect(change).toHaveBeenCalledExactlyOnceWith(['a'])
    press(apple, 'ArrowDown', { shiftKey: true })
    expect(change).toHaveBeenLastCalledWith(['a', 'b'])
  })
  test('controlled selection stays controlled and unregisters removed options', () => {
    const [show, setShow] = createSignal(true)
    const change = vi.fn()
    const view = render(() => (
      <Listbox value="a" onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Show when={show()}>
          <Listbox.Item value="b">Banana</Listbox.Item>
        </Show>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    view.getByText('Banana').click()
    flush()
    expect(change).toHaveBeenCalledWith('b')
    expect(view.getByText('Apple')).toHaveAttribute('aria-selected', 'true')
    setShow(false)
    flush()
    const apple = view.getByText('Apple')
    apple.focus()
    press(apple, 'ArrowDown')
    expect(view.getByText('Cherry')).toHaveFocus()
  })
  test('typeahead expires after 700ms and author cancellation prevents selection', () => {
    vi.useFakeTimers()
    const clear = vi.spyOn(globalThis, 'clearTimeout')
    const change = vi.fn()
    const view = render(() => (
      <Listbox onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b" onClick={(event) => event.preventDefault()}>
          Banana
        </Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple')
    apple.focus()
    press(apple, 'b')
    expect(view.getByText('Banana')).toHaveFocus()
    vi.advanceTimersByTime(700)
    flush()
    press(view.getByText('Banana'), 'c')
    expect(view.getByText('Cherry')).toHaveFocus()
    view.getByText('Banana').click()
    flush()
    expect(change).not.toHaveBeenCalled()
    const clearedBefore = clear.mock.calls.length
    cleanup()
    flush()
    expect(clear.mock.calls.length).toBeGreaterThan(clearedBefore)
    clear.mockRestore()
  })
})

describe('Listbox regressions', () => {
  test('disabling the active option removes its tab stop and skips it in both directions', () => {
    const [disabled, setDisabled] = createSignal(false)
    const view = render(() => (
      <Listbox defaultActiveValue="b" aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b" disabled={disabled()}>
          Banana
        </Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const banana = view.getByText('Banana')
    banana.focus()
    setDisabled(true)
    flush()
    expect(banana).toHaveAttribute('tabindex', '-1')
    expect(view.getByText('Apple')).toHaveAttribute('tabindex', '0')
    view.getByText('Apple').focus()
    press(view.getByText('Apple'), 'ArrowDown')
    expect(view.getByText('Cherry')).toHaveFocus()
    press(view.getByText('Cherry'), 'ArrowUp')
    expect(view.getByText('Apple')).toHaveFocus()
  })
  test('removing the active virtual option updates the reference to a mounted fallback', () => {
    const [show, setShow] = createSignal(true)
    const view = render(() => (
      <Listbox virtualFocus defaultActiveValue="b" aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Show when={show()}>
          <Listbox.Item value="b">Banana</Listbox.Item>
        </Show>
      </Listbox>
    ))
    flush()
    const root = view.getByRole('listbox')
    root.focus()
    setShow(false)
    flush()
    expect(root).toHaveAttribute('aria-activedescendant', view.getByText('Apple').id)
    expect(root).toHaveFocus()
  })
  test('navigation follows moved DOM options after the mutation settles', async () => {
    const view = render(() => (
      <Listbox aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const root = view.getByRole('listbox'),
      apple = view.getByText('Apple'),
      cherry = view.getByText('Cherry')
    root.insertBefore(cherry, view.getByText('Banana'))
    await Promise.resolve()
    flush()
    apple.focus()
    press(apple, 'ArrowDown')
    expect(cherry).toHaveFocus()
  })
  test('releasing control restores the last internal selection and accepts future changes', () => {
    const [controlled, setControlled] = createSignal<string | undefined>('b')
    const change = vi.fn()
    const view = render(() => (
      <Listbox value={controlled()} defaultValue="a" onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    view.getByText('Cherry').click()
    flush()
    expect(view.getByText('Banana')).toHaveAttribute('aria-selected', 'true')
    setControlled(undefined)
    flush()
    expect(view.getByText('Apple')).toHaveAttribute('aria-selected', 'true')
    view.getByText('Cherry').click()
    flush()
    expect(view.getByText('Cherry')).toHaveAttribute('aria-selected', 'true')
    expect(change).toHaveBeenCalledTimes(2)
  })
  test('controlled virtual focus proposes navigation without changing the reference', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox virtualFocus activeValue="a" onActiveChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    const root = view.getByRole('listbox')
    root.focus()
    press(root, 'ArrowDown')
    expect(change).toHaveBeenCalledExactlyOnceWith('b')
    expect(root).toHaveAttribute('aria-activedescendant', view.getByText('Apple').id)
    expect(root).toHaveFocus()
  })
  test('author keydown cancellation and host refs survive prop merging', () => {
    const rootRef = vi.fn(),
      itemRef = vi.fn(),
      change = vi.fn()
    const view = render(() => (
      <Listbox ref={rootRef} onValueChange={change} aria-label="Fruit">
        <Listbox.Item ref={itemRef} value="a" onKeyDown={(event) => event.preventDefault()}>
          Apple
        </Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple')
    apple.focus()
    press(apple, 'ArrowDown')
    press(apple, 'Enter')
    expect(apple).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
    expect(rootRef).toHaveBeenCalledWith(view.getByRole('listbox'))
    expect(itemRef).toHaveBeenCalledWith(apple)
  })
  test('repeated letters cycle enabled labels and the 700ms deadline restarts each time', () => {
    vi.useFakeTimers()
    const view = render(() => (
      <Listbox aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b" disabled>
          Apricot
        </Listbox.Item>
        <Listbox.Item value="c">Avocado</Listbox.Item>
        <Listbox.Item value="d">Cherry</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple'),
      avocado = view.getByText('Avocado')
    apple.focus()
    press(apple, 'a')
    expect(avocado).toHaveFocus()
    vi.advanceTimersByTime(600)
    press(avocado, 'a')
    expect(apple).toHaveFocus()
    vi.advanceTimersByTime(600)
    press(apple, 'c')
    expect(apple).toHaveFocus()
    vi.advanceTimersByTime(700)
    flush()
    press(apple, 'c')
    expect(view.getByText('Cherry')).toHaveFocus()
  })
  test('Shift range retains its anchor while extending and shrinking, then Ctrl+A selects enabled options', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox selectionMode="multiple" onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
        <Listbox.Item value="c" disabled>
          Cherry
        </Listbox.Item>
        <Listbox.Item value="d">Date</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple'),
      banana = view.getByText('Banana'),
      date = view.getByText('Date')
    apple.click()
    flush()
    press(apple, 'ArrowDown', { shiftKey: true })
    press(banana, 'ArrowDown', { shiftKey: true })
    expect(change).toHaveBeenLastCalledWith(['a', 'b', 'd'])
    press(date, 'ArrowUp', { shiftKey: true })
    expect(change).toHaveBeenLastCalledWith(['a', 'b'])
    press(banana, 'a', { ctrlKey: true })
    expect(change).toHaveBeenLastCalledWith(['a', 'b', 'd'])
    date.click()
    flush()
    press(date, 'ArrowUp', { shiftKey: true })
    expect(change).toHaveBeenLastCalledWith(['b', 'd'])
  })
  test('range selection clamps even when ordinary arrow navigation loops', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox
        selectionMode="multiple"
        defaultValue={['a']}
        onValueChange={change}
        aria-label="Fruit"
      >
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple')
    apple.focus()
    press(apple, 'ArrowUp', { shiftKey: true })
    expect(apple).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
    press(apple, 'ArrowUp')
    expect(view.getByText('Banana')).toHaveFocus()
  })
  test('focus entering the root lands on the selected item without changing selection', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox defaultValue="b" onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    view.getByRole('listbox').focus()
    flush()
    expect(view.getByText('Banana')).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })
  test('nested presentation targets select their owning option only once', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">
          <span>Apple label</span>
        </Listbox.Item>
        <Listbox.Item value="b">
          <span>Banana label</span>
        </Listbox.Item>
      </Listbox>
    ))
    flush()
    view.getByText('Banana label').click()
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith('b')
    expect(view.getByRole('option', { name: 'Banana label' })).toHaveFocus()
    press(view.getByText('Banana label'), 'ArrowUp')
    expect(view.getByRole('option', { name: 'Apple label' })).toHaveFocus()
  })
  test('virtual pointerdown is canceled without selecting and root tabindex can be overridden', () => {
    const change = vi.fn()
    const view = render(() => (
      <Listbox virtualFocus tabindex={-1} onValueChange={change} aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
      </Listbox>
    ))
    flush()
    const root = view.getByRole('listbox')
    root.focus()
    const event = new MouseEvent('pointerdown', { bubbles: true, cancelable: true })
    view.getByText('Apple').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(change).not.toHaveBeenCalled()
    expect(root).toHaveFocus()
    expect(root).toHaveAttribute('tabindex', '-1')
  })
  test('readonly preserves selection while navigating; root disabled blocks both', () => {
    const [disabled, setDisabled] = createSignal(false)
    const change = vi.fn()
    const view = render(() => (
      <Listbox
        readonly
        disabled={disabled()}
        defaultValue="a"
        onValueChange={change}
        aria-label="Fruit"
      >
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    flush()
    const apple = view.getByText('Apple'),
      banana = view.getByText('Banana')
    apple.focus()
    press(apple, 'ArrowDown')
    expect(banana).toHaveFocus()
    press(banana, 'Enter')
    banana.click()
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(apple).toHaveAttribute('aria-selected', 'true')
    setDisabled(true)
    flush()
    press(banana, 'ArrowUp')
    expect(banana).toHaveFocus()
    expect(apple).toHaveAttribute('tabindex', '-1')
    expect(banana).toHaveAttribute('tabindex', '-1')
  })
})

test('controlled roving focus emits one navigation request even when the owner declines it', () => {
  const active = vi.fn()
  const view = render(() => (
    <Listbox activeValue="a" onActiveChange={active} aria-label="Fruit">
      <Listbox.Item value="a">Apple</Listbox.Item>
      <Listbox.Item value="b">Banana</Listbox.Item>
    </Listbox>
  ))
  flush()
  const apple = view.getByText('Apple')
  apple.focus()
  press(apple, 'ArrowDown')
  expect(active).toHaveBeenCalledExactlyOnceWith('b')
})
