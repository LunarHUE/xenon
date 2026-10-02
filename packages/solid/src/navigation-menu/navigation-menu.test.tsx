import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { NavigationMenu as Nav } from './navigation-menu'
afterEach(cleanup)

test('disclosures keep native links, selected state and custom panel IDs', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Nav onValueChange={changed}>
      <Nav.List>
        <Nav.Item value="">
          <Nav.Trigger>Products</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="docs">
          <Nav.Trigger>Docs</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Viewport>
          <Nav.Content value="" id="products">
            <Nav.Link href="#one" current>
              One
            </Nav.Link>
          </Nav.Content>
          <Nav.Content value="docs">
            <Nav.Link href="#two">Two</Nav.Link>
          </Nav.Content>
        </Nav.Viewport>
      </Nav.Positioner>
    </Nav>
  ))
  expect(changed).not.toHaveBeenCalled()
  expect(m.getByRole('navigation')).not.toHaveAttribute('aria-orientation')
  expect(m.container.querySelector('[role=menu],[role=menubar],[role=dialog]')).toBeNull()
  m.getByText('Products').click()
  flush()
  expect(m.getByText('Products')).toHaveAttribute('aria-controls', 'products')
  expect(m.getByText('One')).toHaveAttribute('aria-current', 'page')
  expect(m.getByText('One')).toHaveAttribute('href', '#one')
  m.getByText('Docs').click()
  flush()
  expect(m.getByText('Products')).toHaveAttribute('aria-expanded', 'false')
  expect(m.getByText('One').closest('[data-navigation-panel]')).toHaveAttribute('hidden')
  m.getByText('Docs').click()
  flush()
  expect(changed.mock.calls).toEqual([[''], ['docs'], [null]])
})
test('controlled null stays closed and author cancellation preserves state', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Nav value={null} onValueChange={changed}>
      <Nav.List>
        <Nav.Item value="x">
          <Nav.Trigger>Open</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="y">
          <Nav.Trigger onClick={(e) => e.preventDefault()}>Veto</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="z">
          <Nav.Trigger disabled>Disabled</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
    </Nav>
  ))
  m.getByText('Veto').click()
  m.getByText('Disabled').click()
  flush()
  expect(changed).not.toHaveBeenCalled()
  m.getByText('Open').click()
  flush()
  expect(changed).toHaveBeenCalledWith('x')
  expect(m.getByText('Open')).toHaveAttribute('aria-expanded', 'false')
})
test('hover timers honor delays, cancel sweeps, switch instantly, and ignore touch', () => {
  vi.useFakeTimers()
  try {
    const m = render(() => (
      <Nav openDelay={100} closeDelay={70}>
        <Nav.List>
          <Nav.Item value="a">
            <Nav.Trigger>A</Nav.Trigger>
          </Nav.Item>
          <Nav.Item value="b">
            <Nav.Trigger>B</Nav.Trigger>
          </Nav.Item>
        </Nav.List>
      </Nav>
    ))
    const enter = (name: string, type = 'mouse') => {
      const event = new Event('pointerenter')
      Object.defineProperty(event, 'pointerType', { value: type })
      m.getByText(name).dispatchEvent(event)
      flush()
    }
    enter('A', 'touch')
    vi.advanceTimersByTime(101)
    flush()
    expect(m.getByText('A')).toHaveAttribute('aria-expanded', 'false')
    enter('A')
    vi.advanceTimersByTime(99)
    flush()
    expect(m.getByText('A')).toHaveAttribute('aria-expanded', 'false')
    vi.advanceTimersByTime(1)
    flush()
    expect(m.getByText('A')).toHaveAttribute('aria-expanded', 'true')
    enter('B')
    flush()
    expect(m.getByText('B')).toHaveAttribute('aria-expanded', 'true')
  } finally {
    vi.useRealTimers()
  }
})

test('delayed hover rechecks trigger lifetime, disabled state and hover policy', () => {
  vi.useFakeTimers()
  try {
    const [visible, setVisible] = createSignal(true)
    const [disabled, setDisabled] = createSignal(false)
    const [hover, setHover] = createSignal(true)
    const change = vi.fn()
    const m = render(() => (
      <Nav openDelay={100} openOnHover={hover()} onValueChange={change}>
        <Nav.List>
          <Show when={visible()}>
            <Nav.Item value="a">
              <Nav.Trigger disabled={disabled()}>A</Nav.Trigger>
            </Nav.Item>
          </Show>
        </Nav.List>
      </Nav>
    ))
    const enter = () => {
      const event = new Event('pointerenter')
      Object.defineProperty(event, 'pointerType', { value: 'mouse' })
      m.getByText('A').dispatchEvent(event)
      flush()
    }
    enter()
    setDisabled(true)
    flush()
    vi.advanceTimersByTime(101)
    flush()
    expect(change).not.toHaveBeenCalled()
    setDisabled(false)
    flush()
    enter()
    setHover(false)
    flush()
    vi.advanceTimersByTime(101)
    flush()
    expect(change).not.toHaveBeenCalled()
    setHover(true)
    flush()
    enter()
    setVisible(false)
    flush()
    vi.advanceTimersByTime(101)
    flush()
    expect(change).not.toHaveBeenCalled()
  } finally {
    vi.useRealTimers()
  }
})

test('empty disabled triggers block pointer intent and nested refs attach', () => {
  vi.useFakeTimers()
  const change = vi.fn()
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <Nav onValueChange={change}>
      <Nav.List>
        <Nav.Item value="blocked">
          <Nav.Trigger disabled="" ref={refs}>
            Blocked
          </Nav.Trigger>
        </Nav.Item>
      </Nav.List>
    </Nav>
  ))
  const event = new Event('pointerenter', { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  view.getByText('Blocked').dispatchEvent(event)
  vi.runAllTimers()
  flush()
  expect(host).toHaveBeenCalledTimes(2)
  expect(view.getByText('Blocked')).toHaveAttribute('data-disabled')
  expect(change).not.toHaveBeenCalled()
  vi.useRealTimers()
})
