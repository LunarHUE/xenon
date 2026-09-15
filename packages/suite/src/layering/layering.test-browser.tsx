import { registerLayer } from '@xenon/dom'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function content() {
  const element = document.createElement('div')
  const input = document.createElement('input')
  element.append(input)
  document.body.append(element)
  onTestFinished(() => element.remove())
  return { element, input }
}

test('real Escape unwinds one logical layer per key press across portal siblings', async () => {
  const parent = content()
  const child = content()
  const lowerDismiss = vi.fn()
  const lower = registerLayer(parent.element, { onDismiss: lowerDismiss })
  const upperDismiss = vi.fn(() => upper.dispose())
  const upper = registerLayer(child.element, { parent: lower, onDismiss: upperDismiss })
  onTestFinished(() => {
    upper.dispose()
    lower.dispose()
  })
  child.input.focus()
  await userEvent.keyboard('{Escape}')
  expect(upperDismiss).toHaveBeenCalledOnce()
  expect(lowerDismiss).not.toHaveBeenCalled()
  await userEvent.keyboard('{Escape}')
  expect(lowerDismiss).toHaveBeenCalledOnce()
})

test('focused widgets can cancel or stop Escape before layer dismissal', async () => {
  const { element, input } = content()
  const dismiss = vi.fn()
  const layer = registerLayer(element, { onDismiss: dismiss })
  onTestFinished(() => layer.dispose())
  input.focus()
  input.addEventListener('keydown', (event) => event.preventDefault(), { once: true })
  await userEvent.keyboard('{Escape}')
  expect(dismiss).not.toHaveBeenCalled()
  input.addEventListener('keydown', (event) => event.stopPropagation(), { once: true })
  await userEvent.keyboard('{Escape}')
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.keyboard('{Escape}')
  expect(dismiss).toHaveBeenCalledOnce()
})

test('real shadow-root pointer events resolve content and registered portal branches', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  onTestFinished(() => host.remove())
  const shadow = host.attachShadow({ mode: 'open' })
  const inside = document.createElement('button')
  inside.textContent = 'Inside'
  const outside = document.createElement('button')
  outside.textContent = 'Outside'
  shadow.append(inside, outside)
  const branch = content()
  const layer = registerLayer(inside)
  const unregister = layer.registerBranch(branch.element)
  onTestFinished(() => layer.dispose())
  const contained: boolean[] = []
  const pointer = (event: PointerEvent) => contained.push(layer.contains(event))
  document.addEventListener('pointerdown', pointer)
  onTestFinished(() => document.removeEventListener('pointerdown', pointer))
  await userEvent.click(inside)
  await userEvent.click(outside)
  await userEvent.click(branch.input)
  unregister()
  await userEvent.click(branch.input)
  expect(contained).toEqual([true, false, true, false])
})
