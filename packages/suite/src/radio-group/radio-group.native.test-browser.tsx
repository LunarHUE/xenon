/**
 * Native browser axis navigation, disabled ring transitions, form reset, and
 * implicit-label activation for RadioGroup.
 *
 * Native hosts resolve arrows in the browser, so the axis cases use the button
 * host, whose left/right and up/down handling is the library's own. Form cases
 * use a real enclosing form and a real second form to observe native reset and
 * FormData association rather than synthetic events. These cases are distinct
 * from the shared suite: interactions/forms only cover the vertical default
 * axis, statically disabled items, and an explicit external form ID.
 */
import { RadioGroup } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

/** Assert the host's native checked property or its custom-host aria-checked state. */
function checked(item: HTMLElement, value: boolean) {
  if (item instanceof HTMLInputElement) expect(item.checked).toBe(value)
  else expect(item).toHaveAttribute('aria-checked', String(value))
}

/** Append a disposable form to the body; the caller places a fixture inside it. */
function form(id: string) {
  const el = document.createElement('form')
  el.id = id
  document.body.append(el)
  onTestFinished(() => el.remove())
  return el
}

describe('radio group native axis, disabled, form, and label behavior', () => {
  test('an LTR horizontal group navigates on left and right only', async () => {
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      orientation: 'horizontal',
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
          <RadioGroup.Item as="button" value="pickup" aria-label="Pickup" />
        </>
      ),
    })
    const scope = within(m.container)
    const standard = scope.getByRole('radio', { name: 'Standard' })
    const express = scope.getByRole('radio', { name: 'Express' })

    standard.focus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(express).toHaveFocus()
    checked(express, true)
    checked(standard, false)
    expect(express).toHaveAttribute('tabindex', '0')
    expect(standard).toHaveAttribute('tabindex', '-1')

    await userEvent.keyboard('{ArrowLeft}')
    await m.settle()
    expect(standard).toHaveFocus()
    checked(standard, true)
    checked(express, false)

    // Vertical keys do not move a horizontal group.
    for (const key of ['{ArrowDown}', '{ArrowUp}']) {
      await userEvent.keyboard(key)
      await m.settle()
      expect(standard).toHaveFocus()
      checked(standard, true)
    }
  })

  test('a vertical group keeps up and down independent of RTL direction', async () => {
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      dir: 'rtl',
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
        </>
      ),
    })
    const scope = within(m.container)
    expect(scope.getByRole('radiogroup')).toHaveAttribute('dir', 'rtl')
    const standard = scope.getByRole('radio', { name: 'Standard' })
    const express = scope.getByRole('radio', { name: 'Express' })

    standard.focus()
    await userEvent.keyboard('{ArrowDown}')
    await m.settle()
    expect(express).toHaveFocus()
    checked(express, true)

    await userEvent.keyboard('{ArrowUp}')
    await m.settle()
    expect(standard).toHaveFocus()
    checked(standard, true)

    // Horizontal keys do not move a vertical group even in RTL.
    for (const key of ['{ArrowLeft}', '{ArrowRight}']) {
      await userEvent.keyboard(key)
      await m.settle()
      expect(standard).toHaveFocus()
      checked(standard, true)
    }
  })

  test('disabling the checked radio keeps it checked and moves the tab stop to the first enabled radio', async () => {
    const [blocked, setBlocked] = createSignal(false)
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item
            as="button"
            value="standard"
            aria-label="Standard"
            disabled={blocked()}
          />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
          <RadioGroup.Item as="button" value="pickup" aria-label="Pickup" />
        </>
      ),
    })
    const scope = within(m.container)
    const standard = scope.getByRole('radio', { name: 'Standard' })
    const express = scope.getByRole('radio', { name: 'Express' })
    const pickup = scope.getByRole('radio', { name: 'Pickup' })
    expect(standard).toHaveAttribute('tabindex', '0')

    // The checked radio keeps its state but leaves the ring for the first enabled radio.
    setBlocked(true)
    await m.settle()
    checked(standard, true)
    expect(standard).toBeDisabled()
    expect(standard).toHaveAttribute('data-disabled', '')
    expect(standard).toHaveAttribute('tabindex', '-1')
    expect(express).toHaveAttribute('tabindex', '0')

    // Navigation then skips the disabled radio in both directions.
    express.focus()
    await userEvent.keyboard('{ArrowDown}')
    await m.settle()
    expect(pickup).toHaveFocus()
    checked(pickup, true)
    await userEvent.keyboard('{ArrowUp}')
    await m.settle()
    expect(express).toHaveFocus()
    checked(express, true)

    // Re-enabling hands the ring back to whichever radio is checked.
    setBlocked(false)
    await m.settle()
    expect(express).toHaveAttribute('tabindex', '0')
    expect(standard).toHaveAttribute('tabindex', '-1')
    expect(standard).not.toHaveAttribute('data-disabled')
  })

  test('a disabled group removes every tab stop and re-enabling restores the checked radio tab stop', async () => {
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      defaultValue: 'express',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
          <RadioGroup.Item as="button" value="pickup" aria-label="Pickup" />
        </>
      ),
    })
    const scope = within(m.container)
    const standard = scope.getByRole('radio', { name: 'Standard' })
    const express = scope.getByRole('radio', { name: 'Express' })
    const pickup = scope.getByRole('radio', { name: 'Pickup' })
    expect(express).toHaveAttribute('tabindex', '0')

    m.setProps({ disabled: true })
    await m.settle()
    for (const item of [standard, express, pickup]) {
      expect(item).toBeDisabled()
      expect(item).toHaveAttribute('tabindex', '-1')
    }
    checked(express, true)

    m.setProps({ disabled: false })
    await m.settle()
    expect(express).toHaveAttribute('tabindex', '0')
    expect(standard).toHaveAttribute('tabindex', '-1')
    expect(pickup).toHaveAttribute('tabindex', '-1')
    checked(express, true)
  })

  test('a canceled native reset leaves the uncontrolled selection in place', async () => {
    const owner = form('delivery-form')
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      name: 'delivery',
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item value="standard" aria-label="Standard" />
          <RadioGroup.Item value="express" aria-label="Express" />
        </>
      ),
    })
    owner.append(m.container)
    const scope = within(m.container)
    const standard = scope.getByRole('radio', { name: 'Standard' }) as HTMLInputElement
    const express = scope.getByRole('radio', { name: 'Express' }) as HTMLInputElement

    await userEvent.click(express)
    await m.settle()
    expect(express.checked).toBe(true)

    // A canceled reset must not snap the uncontrolled selection back to the default.
    const cancel = (event: Event) => event.preventDefault()
    owner.addEventListener('reset', cancel)
    owner.reset()
    await m.settle()
    expect(express.checked).toBe(true)
    expect(standard.checked).toBe(false)
    expect(express).toHaveAttribute('data-state', 'checked')

    owner.removeEventListener('reset', cancel)
    owner.reset()
    await m.settle()
    expect(standard.checked).toBe(true)
    expect(express.checked).toBe(false)
  })

  test('an explicit form attribute takes precedence over the enclosing form', async () => {
    const enclosing = form('enclosing-form')
    const target = form('external-delivery-form')
    const m = mount('radio-group', {
      'aria-label': 'Delivery',
      name: 'delivery',
      form: target.id,
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item value="standard" aria-label="Standard" />
          <RadioGroup.Item value="express" aria-label="Express" />
        </>
      ),
    })
    enclosing.append(m.container)
    const scope = within(m.container)
    const standard = scope.getByRole('radio', { name: 'Standard' }) as HTMLInputElement
    const express = scope.getByRole('radio', { name: 'Express' }) as HTMLInputElement

    expect(new FormData(enclosing).has('delivery')).toBe(false)
    expect(new FormData(target).get('delivery')).toBe('standard')

    await userEvent.click(express)
    await m.settle()
    expect(new FormData(target).get('delivery')).toBe('express')
    expect(new FormData(enclosing).has('delivery')).toBe(false)

    // Only the associated form drives the group.
    enclosing.reset()
    await m.settle()
    expect(express.checked).toBe(true)
    expect(standard.checked).toBe(false)

    target.reset()
    await m.settle()
    expect(standard.checked).toBe(true)
    expect(express.checked).toBe(false)
    expect(new FormData(target).get('delivery')).toBe('standard')
  })

  test('implicit labels cannot select a disabled radio or any radio in a readonly group', async () => {
    const change = vi.fn()
    const disabled = mount('radio-group', {
      'aria-label': 'Delivery',
      onValueChange: change,
      children: () => (
        <>
          <label>
            Standard
            <RadioGroup.Item value="standard" />
          </label>
          <label>
            Express
            <RadioGroup.Item value="express" disabled />
          </label>
        </>
      ),
    })
    const disabledScope = within(disabled.container)
    await userEvent.click(disabledScope.getByText('Express'), { force: true })
    await disabled.settle()
    checked(disabledScope.getByRole('radio', { name: 'Express' }), false)
    expect(change).not.toHaveBeenCalled()

    await userEvent.click(disabledScope.getByText('Standard'))
    await disabled.settle()
    checked(disabledScope.getByRole('radio', { name: 'Standard' }), true)
    expect(change).toHaveBeenCalledExactlyOnceWith('standard')

    change.mockClear()
    const readonly = mount('radio-group', {
      'aria-label': 'Delivery',
      readonly: true,
      onValueChange: change,
      children: () => (
        <label>
          Standard
          <RadioGroup.Item value="standard" />
        </label>
      ),
    })
    const readonlyScope = within(readonly.container)
    await userEvent.click(readonlyScope.getByText('Standard'))
    await readonly.settle()
    checked(readonlyScope.getByRole('radio', { name: 'Standard' }), false)
    expect(change).not.toHaveBeenCalled()
  })
})
