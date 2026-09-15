import type { ButtonProps } from '../harness'
import userEvent from '@testing-library/user-event'
import { expect, onTestFinished, test, vi } from 'vitest'

import { mount } from '../harness/solid'

const host = (m: { container: HTMLElement }) => m.container.firstElementChild as HTMLElement

test('button.forms.3 form owner recomputes when a matching form id appears and disappears', () => {
  const m = mount('button', { children: 'Go', form: 'late-owner' })
  const el = host(m)
  expect('form' in el && (el as HTMLButtonElement).form).toBe(null)
  const form = document.createElement('form')
  form.id = 'late-owner'
  document.body.append(form)
  onTestFinished(() => form.remove())
  expect((el as HTMLButtonElement).form).toBe(form)
  form.remove()
  expect((el as HTMLButtonElement).form).toBe(null)
  m.unmount()
})

test('button.forms.16 nested disabled fieldsets propagate while the first legend remains enabled', () => {
  const outer = document.createElement('fieldset')
  outer.disabled = true
  const legend = document.createElement('legend')
  const nested = document.createElement('fieldset')
  const legendButton = mount('button', { children: 'Legend' })
  const nestedButton = mount('button', { children: 'Nested' })
  legend.append(legendButton.container)
  nested.append(nestedButton.container)
  outer.append(legend, nested)
  document.body.append(outer)
  onTestFinished(() => outer.remove())
  expect(host(legendButton).matches(':disabled')).toBe(false)
  expect(host(nestedButton).matches(':disabled')).toBe(true)
  outer.remove()
})

test('button.roles.15 input reset preserves the author type', () => {
  const m = mount('button', { as: 'input', type: 'reset', value: 'Reset' } as ButtonProps)
  expect(host(m)).toHaveAttribute('type', 'reset')
})

test('button.roles.18 disabled markers apply consistently to native and generic hosts', () => {
  const native = mount('button', { children: 'Native', disabled: true })
  const generic = mount('button', { as: 'div', children: 'Generic', disabled: true } as ButtonProps)
  const input = mount('button', { as: 'input', disabled: true } as ButtonProps)
  const link = mount('button', { as: 'a', href: '#target', disabled: true } as ButtonProps)
  for (const item of [input, link]) {
    expect(host(item)).toHaveAttribute('data-disabled', '')
    item.setProps({ disabled: false })
    expect(host(item)).not.toHaveAttribute('data-disabled')
  }
  const enabled = mount('button', { children: 'Enabled' })
  expect(host(native)).toHaveAttribute('data-disabled', '')
  expect(host(generic)).toHaveAttribute('data-disabled', '')
  expect(host(enabled)).not.toHaveAttribute('data-disabled')
  native.setProps({ disabled: false })
  generic.setProps({ disabled: false })
  expect(host(native)).not.toHaveAttribute('data-disabled')
  expect(host(generic)).not.toHaveAttribute('data-disabled')
})

test('button.notes.5 polymorphic native host mismatch warning suggests the as prop', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  onTestFinished(() => error.mockRestore())
  const Mismatch = (props: Record<string, unknown>) => <button {...props} />
  const m = mount('button', { as: Mismatch, children: 'Mismatch' } as ButtonProps)
  await m.settle()
  const messages = error.mock.calls.map((call) => String(call[0])).join('\n')
  error.mockRestore()
  expect(messages).toMatch(/button/i)
  expect(messages).toContain('pass as="button"')
  m.unmount()
})

test('button.keyboard.12 generic role link uses Enter only and ignores Space', async () => {
  const user = userEvent.setup()
  const clicks = vi.fn()
  const m = mount('button', {
    as: 'div',
    role: 'link',
    children: 'Go',
    onClick: clicks,
  } as ButtonProps)
  host(m).focus()
  await user.keyboard(' ')
  expect(clicks).not.toHaveBeenCalled()
  await user.keyboard('{Enter}')
  expect(clicks).toHaveBeenCalledOnce()

  m.setProps({ role: 'button' })
  await user.keyboard(' ')
  expect(clicks).toHaveBeenCalledTimes(2)
  m.setProps({ role: 'link', disabled: true, focusableWhenDisabled: true })
  await user.keyboard(' {Enter}')
  expect(clicks).toHaveBeenCalledTimes(2)
  m.setProps({ disabled: false, onKeyDown: (event: KeyboardEvent) => event.preventDefault() })
  await user.keyboard('{Enter}')
  expect(clicks).toHaveBeenCalledTimes(2)
})
