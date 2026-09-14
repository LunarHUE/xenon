import { RadioGroup } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function form() {
  const el = document.createElement('form')
  el.id = 'delivery-form'
  document.body.append(el)
  onTestFinished(() => el.remove())
  return el
}
function setup(props = {}, as: 'input' | 'button' | 'div' = 'input') {
  const owner = form()
  const m = mount('radio-group', {
    name: 'delivery',
    form: owner.id,
    'aria-label': 'Delivery',
    children: () => (
      <>
        <RadioGroup.Item
          as={as}
          style={{ width: '24px', height: '24px' }}
          value="standard"
          aria-label="Standard"
        />
        <RadioGroup.Item
          as={as}
          style={{ width: '24px', height: '24px' }}
          value="express"
          aria-label="Express"
        />
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    owner,
    standard: scope.getByRole('radio', { name: 'Standard' }),
    express: scope.getByRole('radio', { name: 'Express' }),
  }
}
const hosts = ['input', 'button', 'div'] as const

describe('radio group native forms', () => {
  spec('radio-group.forms.2', async () => {
    for (const as of hosts) {
      const m = setup({ required: true }, as)
      expect(m.owner.checkValidity()).toBe(false)
      for (const input of m.container.querySelectorAll('input'))
        expect(input.validity.valueMissing).toBe(true)
      await userEvent.click(m.express)
      await m.settle()
      expect(m.owner.checkValidity()).toBe(true)
      m.unmount()
      m.owner.remove()
    }
  })
  spec('radio-group.forms.6', async () => {
    for (const as of hosts) {
      const m = setup({}, as)
      expect(new FormData(m.owner).get('delivery')).toBeNull()
      await userEvent.click(m.express)
      await m.settle()
      expect([...new FormData(m.owner).entries()]).toEqual([['delivery', 'express']])
      m.unmount()
      m.owner.remove()
    }
  })
  spec('radio-group.forms.8', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ defaultValue: 'standard', onValueChange: change }, as)
      await userEvent.click(m.express)
      await m.settle()
      expect(new FormData(m.owner).get('delivery')).toBe('express')
      m.owner.reset()
      await m.settle()
      expect(new FormData(m.owner).get('delivery')).toBe('standard')
      expect(m.standard).toHaveAttribute('data-state', 'checked')
      expect(m.express).toHaveAttribute('data-state', 'unchecked')
      expect(change).toHaveBeenCalledExactlyOnceWith('express')
      m.unmount()
      m.owner.remove()
    }
  })
  test('reset restores an empty default and preserves fixed controlled values', async () => {
    for (const value of [undefined, 'standard']) {
      const m = setup({ value })
      await userEvent.click(m.express)
      await m.settle()
      m.owner.reset()
      await m.settle()
      expect(new FormData(m.owner).get('delivery')).toBe(value ?? null)
      m.unmount()
      m.owner.remove()
    }
  })
  spec('radio-group.forms.9', async () => {
    const m = setup({ defaultValue: 'express', disabled: true })
    expect(new FormData(m.owner).get('delivery')).toBeNull()
    m.setProps({ disabled: false })
    await m.settle()
    expect(new FormData(m.owner).get('delivery')).toBe('express')
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    m.container.append(fieldset)
    const root = within(m.container).getByRole('radiogroup')
    fieldset.append(root)
    expect((m.express as HTMLInputElement).disabled).toBe(false)
    expect(new FormData(m.owner).get('delivery')).toBeNull()
    fieldset.disabled = false
    expect(new FormData(m.owner).get('delivery')).toBe('express')
  })
  spec('radio-group.forms.13', () => {
    const owner = form()
    const m = mount('radio-group', {
      name: 'delivery',
      form: owner.id,
      required: true,
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item value="standard" aria-label="Standard" disabled />
          <RadioGroup.Item value="express" aria-label="Express" />
        </>
      ),
    })
    expect(owner.checkValidity()).toBe(true)
    expect(
      (within(m.container).getByRole('radio', { name: 'Express' }) as HTMLInputElement).validity
        .valueMissing
    ).toBe(false)
    expect(new FormData(owner).get('delivery')).toBeNull()
  })
  spec('radio-group.forms.12', async () => {
    const m = setup()
    m.owner.append(m.container)
    const values: string[] = []
    m.owner.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement) values.push(event.target.value)
    })
    await userEvent.click(m.express)
    await m.settle()
    expect(values).toEqual(['express'])
  })
})
