import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'pear', label: 'Pear' },
]

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

function Fruit(props: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string | undefined) => void
}) {
  return (
    <form>
      <Combobox
        items={items}
        name="fruit"
        open={props.open}
        onOpenChange={props.onOpenChange}
        onValueChange={props.onValueChange}
      >
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Positioner data-testid="positioner">
          <Combobox.Content
            data-testid="popup"
            aria-label="Fruit suggestions"
            style={{ background: 'white', padding: '12px' }}
          />
        </Combobox.Positioner>
      </Combobox>
    </form>
  )
}

for (const path of ['typing', 'arrow', 'external'] as const) {
  test(`combobox.positioning.12: opening by ${path} preserves an already-scrolled native document`, async () => {
    const previousX = window.scrollX
    const previousY = window.scrollY
    onTestFinished(() => window.scrollTo(previousX, previousY))
    const [open, setOpen] = createSignal(false)
    const changed = vi.fn()
    const opened = vi.fn()
    const m = mount(() => (
      <>
        <div style={{ height: '1400px' }} />
        <Fruit
          open={path === 'external' ? open() : undefined}
          onOpenChange={opened}
          onValueChange={changed}
        />
        <div style={{ height: '1400px' }} />
      </>
    ))
    const input = m.getByRole('combobox') as HTMLInputElement
    window.scrollTo(0, input.getBoundingClientRect().top + window.scrollY - 150)
    await settle()
    expect(window.scrollY).toBeGreaterThan(0)
    input.focus({ preventScroll: true })
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    const beforeX = window.scrollX
    const beforeY = window.scrollY
    if (path === 'typing') await userEvent.keyboard('ap')
    else if (path === 'arrow') await userEvent.keyboard('{ArrowDown}')
    else setOpen(true)
    await settle()
    expect(m.getByRole('listbox')).toBeVisible()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveFocus()
    expect(input).toHaveValue(path === 'typing' ? 'ap' : '')
    expect(Math.abs(window.scrollX - beforeX)).toBeLessThanOrEqual(1)
    expect(Math.abs(window.scrollY - beforeY)).toBeLessThanOrEqual(1)
    expect(changed).not.toHaveBeenCalled()
    expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
    expect(opened.mock.calls).toEqual(path === 'external' ? [] : [[true]])
  })
}

test('combobox.animation.1: default lazy mounting omits initial options and removes the positioner after native dismissal', async () => {
  const changed = vi.fn()
  const m = mount(() => <Fruit onValueChange={changed} />)
  const input = m.getByRole('combobox')
  expect(m.queryByTestId('positioner')).toBeNull()
  expect(m.queryAllByRole('option')).toHaveLength(0)
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const first = m.getByTestId('positioner')
  expect(m.getAllByRole('option')).toHaveLength(3)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(first.isConnected).toBe(false)
  expect(m.queryByTestId('positioner')).toBeNull()
  expect(m.queryAllByRole('option')).toHaveLength(0)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(m.getByTestId('positioner')).not.toBe(first)
  expect(m.getAllByRole('option')).toHaveLength(3)
  expect(changed).not.toHaveBeenCalled()
})

function pausedExit(content: HTMLElement) {
  const animation = content.animate([{ opacity: 1 }, { opacity: 0.5 }], {
    duration: 1000,
    fill: 'both',
  })
  animation.pause()
  animation.currentTime = 400
  onTestFinished(() => animation.cancel())
  return animation
}

test('combobox.animation.3: real paused exit animation retains the filtered content and ending marker until explicitly finished', async () => {
  const [open, setOpen] = createSignal(false)
  const changed = vi.fn()
  const m = mount(() => <Fruit open={open()} onOpenChange={setOpen} onValueChange={changed} />)
  setOpen(true)
  flush()
  const content = m.getByTestId('popup')
  expect(content).toHaveAttribute('data-starting-style')
  await settle()
  expect(content).not.toHaveAttribute('data-starting-style')
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('ap')
  await settle()
  const options = m.getAllByRole('option')
  expect(options.map((option) => option.textContent)).toEqual(['Apple', 'Apricot'])
  const animation = pausedExit(content)
  await userEvent.keyboard('{Escape}')
  await settle()
  // eslint-disable-next-line solid/reactivity -- Assert the current controlled state after the native event.
  expect(open()).toBe(false)
  expect(animation.playState).toBe('paused')
  expect(content.isConnected).toBe(true)
  expect(m.getByTestId('popup')).toBe(content)
  expect(content).toHaveAttribute('data-ending-style')
  expect(content).toHaveAttribute('inert')
  expect(Array.from(content.querySelectorAll('[role="option"]'))).toEqual(options)
  expect(input).toHaveValue('ap')
  expect(changed).not.toHaveBeenCalled()
  animation.finish()
  await animation.finished
  await settle()
  expect(content.isConnected).toBe(false)
  expect(m.queryByTestId('positioner')).toBeNull()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('ap')
  expect(changed).not.toHaveBeenCalled()
})

test('combobox.animation.3: reopening during a held real exit preserves the content owner after the stale animation finishes', async () => {
  const [open, setOpen] = createSignal(false)
  const changed = vi.fn()
  const m = mount(() => <Fruit open={open()} onOpenChange={setOpen} onValueChange={changed} />)
  setOpen(true)
  await settle()
  const content = m.getByTestId('popup')
  const animation = pausedExit(content)
  setOpen(false)
  await settle()
  expect(content).toHaveAttribute('data-ending-style')
  expect(content.isConnected).toBe(true)
  setOpen(true)
  await settle()
  expect(m.getByRole('listbox')).toBe(content)
  expect(content).not.toHaveAttribute('data-ending-style')
  expect(content).not.toHaveAttribute('inert')
  animation.finish()
  await animation.finished
  await settle()
  expect(m.getByRole('listbox')).toBe(content)
  // eslint-disable-next-line solid/reactivity -- Assert the current controlled state after stale completion.
  expect(open()).toBe(true)
  expect(changed).not.toHaveBeenCalled()
})
