import type { ButtonProps } from '../harness'
import axe from 'axe-core'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { Button } from '@xenon/solid'

import { mount } from '../harness/solid'

const host = (m: { container: HTMLElement }) => m.container.firstElementChild as HTMLElement

test('button.forms.22 popover target actions perform native toggle show and hide', async () => {
  const popover = document.createElement('div')
  popover.id = 'coverage-popover'
  popover.setAttribute('popover', '')
  document.body.append(popover)
  onTestFinished(() => popover.remove())
  const toggle = mount('button', { children: 'Toggle', popovertarget: popover.id })
  const show = mount('button', {
    children: 'Show',
    popovertarget: popover.id,
    popovertargetaction: 'show',
  })
  const hide = mount('button', {
    children: 'Hide',
    popovertarget: popover.id,
    popovertargetaction: 'hide',
  })
  await userEvent.click(host(toggle))
  expect(popover).toBeVisible()
  await userEvent.click(host(hide))
  expect(popover).not.toBeVisible()
  await userEvent.click(host(show))
  expect(popover).toBeVisible()
  popover.hidePopover()
  popover.remove()
})

test('button.forms.33 trusted native keyboard activation submits a form', async () => {
  const form = document.createElement('form')
  const submit = mount('button', { children: 'Submit', type: 'submit' })
  form.append(submit.container)
  document.body.append(form)
  onTestFinished(() => form.remove())
  const submits: SubmitEvent[] = []
  form.addEventListener('submit', (event) => {
    submits.push(event)
    event.preventDefault()
  })
  host(submit).focus()
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard(' ')
  expect(submits).toHaveLength(2)
})

test('button.keyboard.20 native button inside Toolbar activates exactly once on Space', async () => {
  const clicks = vi.fn()
  const m = mount('toolbar', {
    children: () => <Button onClick={clicks}>Action</Button>,
  })
  const button = m.container.querySelector('button')!
  button.focus()
  await userEvent.keyboard(' ')
  await m.settle()
  expect(clicks).toHaveBeenCalledOnce()
})

test('button.pointer.6 target-size axe rule uses real rendered 24px geometry', async () => {
  const m = mount('button', { children: 'Go', style: { width: '24px', height: '24px' } })
  const rect = host(m).getBoundingClientRect()
  expect(rect.width).toBeGreaterThanOrEqual(24)
  expect(rect.height).toBeGreaterThanOrEqual(24)
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['target-size'] },
    rules: { 'target-size': { enabled: true } },
  })
  expect(results.violations.map((v) => v.id)).toEqual([])
})

test('button.pointer.9 auxclick records cancellation flags on tab-role hosts', async () => {
  const seen: MouseEvent[] = []
  const capture = (event: Event) => seen.push(event as MouseEvent)
  document.addEventListener('auxclick', capture, true)
  onTestFinished(() => document.removeEventListener('auxclick', capture, true))
  const enabled = mount('button', {
    as: 'div',
    role: 'tab',
    children: 'Open',
    onAuxClick: (event: MouseEvent) => event.preventDefault(),
  } as ButtonProps)
  const disabled = mount('button', {
    as: 'div',
    role: 'tab',
    disabled: true,
    children: 'Closed',
  } as ButtonProps)
  await userEvent.click(host(enabled), { button: 'middle' })
  host(disabled).dispatchEvent(
    new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 })
  )
  document.removeEventListener('auxclick', capture, true)
  expect(seen).toHaveLength(2)
  expect(seen[0]?.defaultPrevented).toBe(true)
  expect(seen[1]?.defaultPrevented).toBe(false)
})
