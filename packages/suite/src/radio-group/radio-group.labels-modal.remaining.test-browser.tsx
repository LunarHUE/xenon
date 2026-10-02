import { Dialog, RadioGroup } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
})

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

function selected(control: HTMLElement, value: boolean) {
  if (control instanceof HTMLInputElement) expect(control.checked).toBe(value)
  else expect(control).toHaveAttribute('aria-checked', String(value))
}

for (const as of ['input', 'button', 'div'] as const) {
  for (const wrapping of [false, true]) {
    // Generic hosts are not labelable; their native mirror is reached by a wrapping label.
    if (as === 'div' && !wrapping) continue
    test(`radio-group.pointer.5 disabled ${as} ignores native ${wrapping ? 'wrapping' : 'explicit'} label activation`, async () => {
      const change = vi.fn()
      const view = mount(() => (
        <form>
          <RadioGroup disabled name="delivery" aria-label="Delivery" onValueChange={change}>
            {wrapping ? (
              <label>
                Standard label
                <RadioGroup.Item as={as} value="standard" aria-label="Standard" />
              </label>
            ) : (
              <>
                <label for="disabled-delivery-standard">Standard label</label>
                <RadioGroup.Item as={as} id="disabled-delivery-standard" value="standard" aria-label="Standard" />
              </>
            )}
            <RadioGroup.Item as={as} value="express" aria-label="Express" />
          </RadioGroup>
        </form>
      ))
      const label = view.getByText('Standard label')
      const clicks: boolean[] = []
      label.addEventListener('click', (event) => clicks.push(event.isTrusted))
      await userEvent.click(label, { force: true })
      await expect.poll(() => clicks).toEqual([true])
      for (const control of view.getAllByRole('radio')) selected(control, false)
      expect(change).not.toHaveBeenCalled()
      expect(new FormData(view.container.querySelector('form')!).getAll('delivery')).toEqual([])
    })
  }
}

test('radio-group.pointer.2 canceling trusted activation after removing the selected native radio leaves no checked or submitted radio', async () => {
  const [previous, setPrevious] = createSignal(true)
  const change = vi.fn()
  const clicks: boolean[] = []
  const view = mount(() => (
    <form>
      <RadioGroup name="delivery" defaultValue="standard" aria-label="Delivery" onValueChange={change}>
        <Show when={previous()}>
          <RadioGroup.Item value="standard" aria-label="Standard" />
        </Show>
        <RadioGroup.Item value="express" aria-label="Express" onClick={(event) => {
          clicks.push(event.isTrusted)
          event.preventDefault()
          setPrevious(false)
          flush()
        }} />
      </RadioGroup>
    </form>
  ))
  const original = view.getByRole('radio', { name: 'Standard' })
  const candidate = view.getByRole('radio', { name: 'Express' })
  selected(original, true)
  expect(new FormData(view.container.querySelector('form')!).getAll('delivery')).toEqual(['standard'])
  await userEvent.click(candidate)
  await expect.poll(() => original.isConnected).toBe(false)
  await expect.poll(() => (candidate as HTMLInputElement).checked).toBe(false)
  expect(clicks).toEqual([true])
  expect(change).not.toHaveBeenCalled()
  expect(new FormData(view.container.querySelector('form')!).getAll('delivery')).toEqual([])
})

for (const as of ['input', 'button', 'div'] as const) {
  test(`radio-group.keyboard.10 ${as} Tab exits the group inside a modal and Shift+Tab returns to its selected item`, async () => {
    const change = vi.fn()
    const view = mount(() => (
      <>
        <Dialog>
          <Dialog.Trigger>Open delivery</Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Title>Delivery choices</Dialog.Title>
            <Dialog.Description>Choose a delivery method.</Dialog.Description>
            <form>
              <RadioGroup name="delivery" defaultValue="express" aria-label="Delivery" onValueChange={change}>
                <RadioGroup.Item as={as} value="standard" aria-label="Standard" />
                <RadioGroup.Item as={as} value="express" aria-label="Express" />
                <RadioGroup.Item as={as} value="pickup" aria-label="Pickup" />
              </RadioGroup>
              <button type="button">After group</button>
            </form>
            <Dialog.Close>Close delivery</Dialog.Close>
          </Dialog.Content>
        </Dialog>
        <button>Outside modal</button>
      </>
    ))
    const outside = view.getByRole('button', { name: 'Outside modal' })
    await userEvent.click(view.getByRole('button', { name: 'Open delivery' }))
    const express = view.getByRole('radio', { name: 'Express' })
    const dialog = view.getByRole('dialog', { name: 'Delivery choices' })
    await expect.poll(() => dialog.contains(document.activeElement)).toBe(true)
    express.focus()
    const keys: boolean[] = []
    dialog.addEventListener('keydown', (event) => {
      if ((event as KeyboardEvent).key === 'Tab') keys.push(event.isTrusted)
    })
    await userEvent.tab()
    expect(view.getByRole('button', { name: 'After group' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(express).toHaveFocus()
    expect(keys).toEqual([true, true])
    selected(express, true)
    selected(view.getByRole('radio', { name: 'Standard' }), false)
    selected(view.getByRole('radio', { name: 'Pickup' }), false)
    expect(change).not.toHaveBeenCalled()
    expect(new FormData(view.container.querySelector('form')!).getAll('delivery')).toEqual(['express'])
    expect(outside).not.toHaveFocus()
    expect(outside.closest('[inert], [aria-hidden="true"]')).not.toBeNull()
  })
}
