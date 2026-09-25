import { RadioGroup } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('radio group coverage', () => {
  spec('radio-group.state.12', async () => {
    const change = vi.fn()
    const mounted = mount('radio-group', {
      'aria-label': 'Delivery',
      onValueChange: change,
      children: () => (
        <>
          <RadioGroup.Item value="standard" aria-label="Standard" />
          <RadioGroup.Item value="express" aria-label="Express" />
        </>
      ),
    })
    const radios = within(mounted.container).getAllByRole('radio')
    expect(radios).toHaveLength(2)
    expect(radios.every((radio) => (radio as HTMLInputElement).checked === false)).toBe(true)
    expect(change).not.toHaveBeenCalled()
    mounted.unmount()
  })

  test('radio-group.roles.2: visible label names group; radio-group.roles.3: rendered description names group', () => {
    const mounted = mount('radio-group', {
      'aria-labelledby': 'delivery-label',
      'aria-describedby': 'delivery-help',
      children: () => (
        <>
          <span id="delivery-label">Delivery</span>
          <span id="delivery-help">Choose one</span>
          <RadioGroup.Item value="standard" aria-label="Standard" />
        </>
      ),
    })
    const group = within(mounted.container).getByRole('radiogroup')
    expect(group).toHaveAccessibleName('Delivery')
    expect(group).toHaveAccessibleDescription('Choose one')
    mounted.unmount()
  })

  test('radio-group.forms.28: named custom radios submit one checked backing input', () => {
    const mounted = mount('radio-group', {
      name: 'delivery',
      defaultValue: 'express',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
        </>
      ),
    })
    const form = document.createElement('form')
    form.append(mounted.container)
    expect([...new FormData(form).entries()]).toEqual([['delivery', 'express']])
    mounted.unmount()
  })

  test('radio-group.keyboard.11: refocusing a sole radio does not select it', async () => {
    const change = vi.fn()
    const mounted = mount('radio-group', {
      'aria-label': 'Only',
      onValueChange: change,
      children: () => <RadioGroup.Item as="button" value="only" aria-label="Only" />,
    })
    const radio = within(mounted.container).getByRole('radio')
    radio.focus()
    fireEvent.keyDown(radio, { key: 'ArrowDown' })
    await mounted.settle()
    radio.blur()
    radio.focus()
    expect(radio).toHaveAttribute('aria-checked', 'false')
    expect(change).not.toHaveBeenCalled()
    mounted.unmount()
  })

  test('radio-group.focus.1: one roving tab stop; radio-group.pointer.1: pointer and keyboard move it', async () => {
    const mounted = mount('radio-group', {
      'aria-label': 'Delivery',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
          <RadioGroup.Item as="button" value="pickup" aria-label="Pickup" />
        </>
      ),
    })
    const radios = () => within(mounted.container).getAllByRole('radio')
    const assertOne = () =>
      expect(radios().filter((radio) => radio.getAttribute('tabindex') === '0')).toHaveLength(1)
    assertOne()
    fireEvent.click(radios()[1]!)
    await mounted.settle()
    assertOne()
    fireEvent.keyDown(radios()[1]!, { key: 'ArrowDown' })
    await mounted.settle()
    assertOne()
    expect(radios()[2]).toHaveAttribute('tabindex', '0')
    mounted.unmount()
  })
})
