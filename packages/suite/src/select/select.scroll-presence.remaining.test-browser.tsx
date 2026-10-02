import { Select } from '@xenon-ui/solid/select'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = Array.from({ length: 20 }, (_, index) => ({
  value: `fruit-${index}`,
  label: `Fruit ${index + 1}`,
}))

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function Options() {
  return (
    <For each={items}>
      {(item) => (
        <Select.Item value={item.value} style={{ height: '30px', 'box-sizing': 'border-box' }} />
      )}
    </For>
  )
}

function FruitSelect(props: {
  defaultValue?: string
  innerViewport?: boolean
  forceMount?: boolean
  onValueChange?: (value: string | undefined) => void
}) {
  return (
    <Select
      items={items}
      defaultValue={props.defaultValue}
      forceMount={props.forceMount}
      onValueChange={props.onValueChange}
    >
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Choose fruit" />
      </Select.Trigger>
      <Select.Positioner data-testid="positioner" flip={false} shift={false}>
        <Select.Content
          style={
            props.innerViewport
              ? { background: 'white' }
              : { background: 'white', height: '120px', overflow: 'auto' }
          }
        >
          {props.innerViewport ? (
            <Select.Viewport
              data-testid="scroll-viewport"
              style={{ height: '120px', overflow: 'auto' }}
            >
              <Options />
            </Select.Viewport>
          ) : (
            <Options />
          )}
        </Select.Content>
      </Select.Positioner>
    </Select>
  )
}

function expectVisibleIn(option: HTMLElement, scroller: HTMLElement) {
  const optionRect = option.getBoundingClientRect()
  const scrollRect = scroller.getBoundingClientRect()
  expect(optionRect.height).toBeGreaterThan(0)
  expect(optionRect.top).toBeGreaterThanOrEqual(scrollRect.top - 1)
  expect(optionRect.bottom).toBeLessThanOrEqual(scrollRect.bottom + 1)
}

test('select.keyboard.18: Home and End scroll the highlighted endpoints into an overflowing popup', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitSelect onValueChange={change} />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const popup = m.getByRole('listbox')
  const first = within(popup).getByRole('option', { name: 'Fruit 1' })
  const last = within(popup).getByRole('option', { name: 'Fruit 20' })
  expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight)
  await userEvent.keyboard('{End}')
  await settle()
  expect(trigger).toHaveAttribute('aria-activedescendant', last.id)
  expect(popup.scrollTop).toBeGreaterThan(0)
  expectVisibleIn(last, popup)
  await userEvent.keyboard('{Home}')
  await settle()
  expect(trigger).toHaveAttribute('aria-activedescendant', first.id)
  expect(popup.scrollTop).toBeLessThanOrEqual(1)
  expectVisibleIn(first, popup)
  expect(trigger).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('select.focus.5: opening highlights and reveals the selected option inside the actual inner viewport', async () => {
  const m = mount(() => <FruitSelect defaultValue="fruit-19" innerViewport />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  const viewport = m.getByTestId('scroll-viewport')
  const selected = within(popup).getByRole('option', { name: 'Fruit 20' })
  expect(trigger).toHaveAttribute('aria-activedescendant', selected.id)
  expect(selected).toHaveAttribute('aria-selected', 'true')
  expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
  expect(viewport.scrollTop).toBeGreaterThan(0)
  expect(popup.scrollTop).toBe(0)
  expectVisibleIn(selected, viewport)
  expect(trigger).toHaveFocus()
})

test('select.positioning.9: opening on a scrolled page preserves page position while revealing the selected option', async () => {
  const previousX = window.scrollX
  const previousY = window.scrollY
  onTestFinished(() => window.scrollTo(previousX, previousY))
  const m = mount(() => (
    <>
      <div style={{ height: '1400px' }} />
      <FruitSelect defaultValue="fruit-19" innerViewport />
      <div style={{ height: '1400px' }} />
    </>
  ))
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  window.scrollTo(0, trigger.getBoundingClientRect().top + window.scrollY - 150)
  await settle()
  expect(window.scrollY).toBeGreaterThan(0)
  const beforeX = window.scrollX
  const beforeY = window.scrollY
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  const selected = within(popup).getByRole('option', { name: 'Fruit 20' })
  expect(Math.abs(window.scrollX - beforeX)).toBeLessThanOrEqual(1)
  expect(Math.abs(window.scrollY - beforeY)).toBeLessThanOrEqual(1)
  expectVisibleIn(selected, m.getByTestId('scroll-viewport'))
  expect(trigger).toHaveAttribute('aria-activedescendant', selected.id)
})

test('select.keyboard.10 and select.animation.2: native Tab closes retained content without committing or leaving option tab stops', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <>
      <FruitSelect forceMount onValueChange={change} />
      <button type="button">After</button>
    </>
  ))
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  const retained = m.container.querySelector<HTMLElement>('[role="listbox"]')!
  expect(retained).not.toBeNull()
  expect(retained).not.toBeVisible()
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  await settle()
  expect(m.getByRole('listbox')).toBe(retained)
  expect(retained).toBeVisible()
  await userEvent.tab()
  await settle()
  expect(m.getByRole('button', { name: 'After' })).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveTextContent('Choose fruit')
  expect(retained.isConnected).toBe(true)
  expect(retained).not.toBeVisible()
  for (const option of retained.querySelectorAll('[role="option"]'))
    expect(option).toHaveAttribute('tabindex', '-1')
  expect(change).not.toHaveBeenCalled()
  await userEvent.tab({ shift: true })
  await settle()
  expect(trigger).toHaveFocus()
})

test('select.animation.1: the lazy positioner is absent initially and removed after each close', async () => {
  const m = mount(() => <FruitSelect />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  expect(m.queryByTestId('positioner')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  const first = m.getByTestId('positioner')
  expect(first).toBeVisible()
  trigger.focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByTestId('positioner')).toBeNull()
  expect(first.isConnected).toBe(false)
  await userEvent.click(trigger)
  await settle()
  const second = m.getByTestId('positioner')
  expect(second).not.toBe(first)
  expect(second).toBeVisible()
  trigger.focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByTestId('positioner')).toBeNull()
  expect(second.isConnected).toBe(false)
})
