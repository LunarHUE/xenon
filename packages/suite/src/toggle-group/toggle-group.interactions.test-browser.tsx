import { ToggleGroup } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function setup(props = {}) {
  const m = mount('toggle-group', {
    'aria-label': 'Formatting',
    children: () => (
      <>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    bold: scope.getByRole('button', { name: 'Bold' }),
    italic: scope.getByRole('button', { name: 'Italic' }),
    underline: scope.getByRole('button', { name: 'Underline' }),
  }
}
async function key(m: ReturnType<typeof setup>, value: string) {
  await userEvent.keyboard(value)
  await m.settle()
}
function after() {
  const el = document.createElement('button')
  el.textContent = 'After'
  document.body.append(el)
  onTestFinished(() => el.remove())
  return el
}

describe('toggle group browser interactions', () => {
  spec('toggle-group.keyboard.1', async () => {
    const m = setup()
    m.bold.focus()
    await key(m, '{ArrowRight}')
    expect(m.italic).toHaveFocus()
    expect(m.italic).toHaveAttribute('tabindex', '0')
    expect(m.bold).toHaveAttribute('tabindex', '-1')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
    await key(m, '{ArrowLeft}')
    expect(m.bold).toHaveFocus()
  })
  spec('toggle-group.keyboard.2', async () => {
    const m = setup({ orientation: 'vertical' })
    m.bold.focus()
    await key(m, '{ArrowDown}')
    expect(m.italic).toHaveFocus()
    await key(m, '{ArrowUp}')
    expect(m.bold).toHaveFocus()
  })
  spec('toggle-group.keyboard.3', async () => {
    for (const orientation of ['horizontal', 'vertical']) {
      const m = setup({ orientation })
      m.bold.focus()
      await key(
        m,
        orientation === 'horizontal' ? '{ArrowUp}{ArrowDown}' : '{ArrowLeft}{ArrowRight}'
      )
      expect(m.bold).toHaveFocus()
      m.unmount()
    }
  })
  spec('toggle-group.keyboard.4', async () => {
    for (const orientation of ['horizontal', 'vertical']) {
      const m = setup({ orientation, dir: 'rtl' })
      m.bold.focus()
      await key(m, orientation === 'horizontal' ? '{ArrowLeft}' : '{ArrowDown}')
      expect(m.italic).toHaveFocus()
      await key(m, orientation === 'horizontal' ? '{ArrowRight}' : '{ArrowUp}')
      expect(m.bold).toHaveFocus()
      m.unmount()
    }
  })
  spec('toggle-group.keyboard.5', async () => {
    const m = setup()
    m.underline.focus()
    await key(m, '{Home}')
    expect(m.bold).toHaveFocus()
    await key(m, '{End}')
    expect(m.underline).toHaveFocus()
  })
  spec('toggle-group.keyboard.6', async () => {
    const m = setup()
    m.underline.focus()
    await m.settle()
    await key(m, '{ArrowRight}')
    expect(m.bold).toHaveFocus()
    await key(m, '{ArrowLeft}')
    expect(m.underline).toHaveFocus()
  })
  spec('toggle-group.keyboard.7', async () => {
    const m = setup({ loop: false })
    m.bold.focus()
    await key(m, '{ArrowLeft}')
    expect(m.bold).toHaveFocus()
    m.underline.focus()
    await m.settle()
    await key(m, '{ArrowRight}')
    expect(m.underline).toHaveFocus()
  })
  spec('toggle-group.keyboard.8', async () => {
    const m = setup()
    m.bold.focus()
    for (const value of ['{Enter}', ' ']) {
      await key(m, value)
      expect(m.bold).toHaveAttribute('aria-pressed', 'true')
      await key(m, value)
      expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    }
  })
  spec('toggle-group.keyboard.9', async () => {
    const m = setup()
    m.bold.focus()
    await key(m, ' {ArrowRight} ')
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle-group.keyboard.10', async () => {
    const m = setup({ mode: 'multiple' })
    m.bold.focus()
    await key(m, ' {ArrowRight} ')
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle-group.keyboard.11', async () => {
    for (const mode of ['single', 'multiple']) {
      const m = setup({ mode })
      m.bold.focus()
      await key(m, ' ')
      expect(m.bold).toHaveAttribute('aria-pressed', 'true')
      await key(m, ' ')
      expect(m.bold).toHaveAttribute('aria-pressed', 'false')
      m.unmount()
    }
  })
  spec('toggle-group.keyboard.12', async () => {
    const m = setup()
    const next = after()
    m.bold.focus()
    await key(m, '{Tab}')
    expect(next).toHaveFocus()
  })
  spec('toggle-group.focus.1', async () => {
    const before = document.createElement('button')
    document.body.append(before)
    onTestFinished(() => before.remove())
    const m = setup()
    before.focus()
    await key(m, '{Tab}')
    expect(m.bold).toHaveFocus()
  })
  spec('toggle-group.focus.6', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change })
    const next = after()
    m.bold.focus()
    await key(m, '{ArrowRight}{Tab}')
    expect(next).toHaveFocus()
    await key(m, '{Shift>}{Tab}{/Shift}')
    expect(m.italic).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })
})
