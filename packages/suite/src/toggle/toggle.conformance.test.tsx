import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function setup(props = {}) {
  const m = mount('toggle', { children: 'Mute', ...props })
  return { ...m, button: within(m.container).getByRole('button', { name: 'Mute' }) }
}

describe('toggle conformance', () => {
  spec('toggle.roles.1', () => {
    for (const as of ['button', 'div'] as const) {
      const m = setup({ as })
      expect(m.button).toHaveAttribute('aria-pressed', 'false')
    }
  })
  spec('toggle.roles.3', () => {
    expect(setup().button).toHaveAttribute('aria-pressed', 'false')
    expect(setup({ defaultPressed: true }).button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.roles.4', async () => {
    const m = setup()
    fireEvent.click(m.button)
    await m.settle()
    expect(within(m.container).getByRole('button')).toBe(m.button)
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.roles.5', async () => {
    const m = setup()
    fireEvent.click(m.button)
    await m.settle()
    expect(m.button).toHaveAccessibleName('Mute')
  })
  spec('toggle.roles.9', () => {
    const m = setup({ disabled: true, defaultPressed: true })
    expect(m.button).toBeDisabled()
    expect(m.button).toHaveAttribute('data-disabled', '')
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.roles.10', () => expect(setup().button).toHaveAttribute('type', 'button'))
  spec('toggle.roles.11', async () => {
    const m = setup()
    expect(m.button).toHaveAttribute('data-state', 'off')
    fireEvent.click(m.button)
    await m.settle()
    expect(m.button).toHaveAttribute('data-state', 'on')
  })
  spec('toggle.roles.12', async () => {
    const m = setup({ defaultPressed: true })
    expect(m.button).toHaveAttribute('data-pressed', '')
    fireEvent.click(m.button)
    await m.settle()
    expect(m.button).not.toHaveAttribute('data-pressed')
  })
  spec('toggle.roles.15', () =>
    expect(setup({ 'data-author': 'yes' }).button).toHaveAttribute('data-author', 'yes')
  )
  spec('toggle.state.1', async () => {
    const m = setup()
    fireEvent.click(m.button)
    await m.settle()
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(m.button)
    await m.settle()
    expect(m.button).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle.state.2', () =>
    expect(setup({ defaultPressed: true }).button).toHaveAttribute('aria-pressed', 'true')
  )
  spec('toggle.state.3', () => expect(setup().button).toHaveAttribute('aria-pressed', 'false'))
  spec('toggle.state.4', async () => {
    const change = vi.fn()
    const m = setup({ pressed: false, onPressedChange: change })
    fireEvent.click(m.button)
    await m.settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
    expect(m.button).toHaveAttribute('aria-pressed', 'false')
    expect(m.button).toHaveAttribute('data-state', 'off')
  })
  spec('toggle.state.5', async () => {
    const change = vi.fn()
    const m = setup({ pressed: true, onPressedChange: change })
    fireEvent.click(m.button)
    await m.settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
  })
  spec('toggle.state.6', async () => {
    const change = vi.fn()
    const m = setup({ pressed: false, onPressedChange: change })
    for (const pressed of [true, false]) {
      m.setProps({ pressed })
      await m.settle()
      expect(m.button).toHaveAttribute('aria-pressed', String(pressed))
    }
    expect(change).not.toHaveBeenCalled()
  })
  spec('toggle.state.7', async () => {
    const change = vi.fn()
    const m = setup({ onPressedChange: change })
    expect(change).not.toHaveBeenCalled()
    fireEvent.click(m.button)
    await m.settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
  })
  spec('toggle.pointer.3', async () => {
    const change = vi.fn()
    const click = vi.fn()
    for (const as of ['button', 'div'] as const) {
      const m = setup({ as, disabled: true, onPressedChange: change, onClick: click })
      fireEvent.click(m.button)
      await m.settle()
      expect(m.button).toHaveAttribute('aria-pressed', 'false')
    }
    expect(change).not.toHaveBeenCalled()
    expect(click).not.toHaveBeenCalled()
  })
  spec('toggle.notes.2', async () => {
    const ref = vi.fn()
    const click = vi.fn()
    const m = setup({ ref, onClick: click, class: 'author', style: { color: 'red' } })
    expect(ref).toHaveBeenCalledWith(m.button)
    expect(m.button).toHaveClass('author')
    expect(m.button).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    fireEvent.click(m.button)
    await m.settle()
    expect(click).toHaveBeenCalledOnce()
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
  })
  test('author preventDefault cancels selection before the callback', async () => {
    const change = vi.fn()
    const m = setup({ onClick: (event: Event) => event.preventDefault(), onPressedChange: change })
    fireEvent.click(m.button)
    await m.settle()
    expect(change).not.toHaveBeenCalled()
    expect(m.button).toHaveAttribute('aria-pressed', 'false')
  })
  test('undefined releases control to the preserved internal value', async () => {
    const m = setup({ defaultPressed: true, pressed: false })
    m.setProps({ pressed: undefined })
    await m.settle()
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.a11y.1', async () => {
    for (const as of ['button', 'div'] as const) {
      for (const disabled of [false, true]) {
        const m = setup({ as, disabled, defaultPressed: true })
        await expectNoViolations(m.container)
        m.unmount()
      }
    }
  })
  spec('toggle.roles.2', async () => {
    const m = setup()
    expect(m.button).toHaveAttribute('aria-pressed', 'false')
    m.setProps({ pressed: true })
    await m.settle()
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.notes.4', () => {
    const m = setup({ defaultPressed: true })
    expect(m.button).toHaveAttribute('data-state', 'on')
    expect(m.button).toHaveAttribute('aria-pressed', 'true')
    expect(m.button).not.toHaveAttribute('aria-checked')
  })
})
