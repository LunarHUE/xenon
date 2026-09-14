import { within } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

async function keyboard(key: string) {
  for (const as of ['button', 'div'] as const) {
    const change = vi.fn()
    const m = mount('toggle', { as, children: 'Mute', onPressedChange: change })
    const button = within(m.container).getByRole('button')
    button.focus()
    await userEvent.keyboard(key)
    await m.settle()
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAttribute('data-state', 'on')
    expect(button).toHaveFocus()
    await userEvent.keyboard(key)
    await m.settle()
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('data-state', 'off')
    expect(change.mock.calls).toEqual([[true], [false]])
    m.unmount()
  }
}

describe('toggle browser interactions', () => {
  spec('toggle.keyboard.1', () => keyboard(' '))
  spec('toggle.keyboard.2', () => keyboard('{Enter}'))
  spec('toggle.keyboard.3', async () => {
    await keyboard(' ')
    await keyboard('{Enter}')
  })
  spec('toggle.focus.1', async () => {
    const m = mount('toggle', { children: 'Mute' })
    const button = within(m.container).getByRole('button')
    await userEvent.click(button)
    await m.settle()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.focus.2', async () => {
    const m = mount('toggle', { children: 'Mute' })
    const button = within(m.container).getByRole('button')
    button.focus()
    await userEvent.keyboard(' ')
    await m.settle()
    expect(button).toHaveAccessibleName('Mute')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.pointer.1', async () => {
    const m = mount('toggle', { children: 'Mute' })
    const button = within(m.container).getByRole('button')
    await userEvent.click(button)
    await m.settle()
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle.pointer.2', async () => {
    const m = mount('toggle', { children: 'Mute', defaultPressed: true })
    const button = within(m.container).getByRole('button')
    await userEvent.click(button)
    await m.settle()
    expect(button).toHaveAttribute('aria-pressed', 'false')
  })
})
