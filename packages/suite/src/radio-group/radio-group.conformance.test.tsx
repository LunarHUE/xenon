import { RadioGroup } from '@tenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'
import { Show, createSignal } from 'solid-js'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function setup(props = {}, as: 'input' | 'button' | 'div' = 'input', disabledItem = false) {
  const m = mount('radio-group', {
    'aria-label': 'Delivery',
    children: () => (
      <>
        <RadioGroup.Item as={as} value="standard" aria-label="Standard" />
        <RadioGroup.Item as={as} value="express" aria-label="Express" disabled={disabledItem} />
        <RadioGroup.Item as={as} value="pickup" aria-label="Pickup" />
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    root: scope.getByRole('radiogroup'),
    standard: scope.getByRole('radio', { name: 'Standard' }),
    express: scope.getByRole('radio', { name: 'Express' }),
    pickup: scope.getByRole('radio', { name: 'Pickup' }),
  }
}

function checked(el: HTMLElement, value: boolean) {
  if (el instanceof HTMLInputElement) expect(el.checked).toBe(value)
  else expect(el).toHaveAttribute('aria-checked', String(value))
  expect(el).toHaveAttribute('data-state', value ? 'checked' : 'unchecked')
}

async function click(m: ReturnType<typeof setup>, item: HTMLElement) {
  fireEvent.click(item)
  await m.settle()
}

const hosts = ['input', 'button', 'div'] as const

describe('radio group conformance', () => {
  spec('radio-group.roles.1', () => {
    const m = setup()
    expect(within(m.root).getAllByRole('radio')).toHaveLength(3)
  })
  spec('radio-group.roles.2', () => expect(setup().root).toHaveAccessibleName('Delivery'))
  spec('radio-group.roles.3', () =>
    expect(setup({ 'aria-describedby': 'delivery-help' }).root).toHaveAttribute(
      'aria-describedby',
      'delivery-help'
    )
  )
  spec('radio-group.roles.7', async () => {
    const m = setup({ disabled: true })
    expect(m.root).toHaveAttribute('aria-disabled', 'true')
    for (const el of [m.standard, m.express, m.pickup]) expect(el).toBeDisabled()
    m.setProps({ disabled: false })
    await m.settle()
    expect(m.root).not.toHaveAttribute('aria-disabled')
    for (const el of [m.standard, m.express, m.pickup]) expect(el).not.toBeDisabled()
  })
  spec('radio-group.roles.8', async () => {
    const m = setup({ readonly: true })
    expect(m.root).toHaveAttribute('aria-readonly', 'true')
    m.setProps({ readonly: false })
    await m.settle()
    expect(m.root).not.toHaveAttribute('aria-readonly')
  })
  spec('radio-group.roles.13', () =>
    expect(setup({ id: 'shipping' }).root).toHaveAttribute('id', 'shipping')
  )
  spec('radio-group.roles.14', () => {
    const m = mount('radio-group', { role: 'group', 'aria-label': 'Delivery' })
    expect(within(m.container).getByRole('group')).toHaveAccessibleName('Delivery')
  })
  spec('radio-group.roles.15', () =>
    expect(setup({ value: 'express' }).root).not.toHaveAttribute('value')
  )
  spec('radio-group.state.2', async () => {
    const first = setup({ defaultValue: 'standard' })
    const second = setup({ defaultValue: 'express' })
    expect(first.standard.getAttribute('name')).not.toBe(second.standard.getAttribute('name'))
    await click(first, first.pickup)
    checked(first.pickup, true)
    checked(second.express, true)
  })
  spec('radio-group.state.3', () => {
    for (const as of hosts) {
      const m = setup({}, as)
      for (const item of [m.standard, m.express, m.pickup]) checked(item, false)
    }
  })
  spec('radio-group.state.5', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ defaultValue: 'standard', onValueChange: change }, as)
      expect(change).not.toHaveBeenCalled()
      checked(m.standard, true)
      await click(m, m.express)
      checked(m.standard, false)
      checked(m.express, true)
      expect(change).toHaveBeenCalledExactlyOnceWith('express')
    }
  })
  spec('radio-group.state.6', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ value: 'standard', onValueChange: change }, as)
      await click(m, m.express)
      expect(change).toHaveBeenCalledExactlyOnceWith('express')
      checked(m.standard, true)
      checked(m.express, false)
      checked(m.pickup, false)
    }
  })
  spec('radio-group.state.8', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change })
    await click(m, m.express)
    await click(m, m.pickup)
    expect(change.mock.calls).toEqual([['express'], ['pickup']])
    checked(m.express, false)
    checked(m.pickup, true)
  })
  spec('radio-group.pointer.1', async () => {
    for (const as of hosts) {
      const m = setup({ defaultValue: 'standard' }, as)
      await click(m, m.express)
      checked(m.standard, false)
      checked(m.express, true)
      expect(m.standard).toHaveAttribute('tabindex', '-1')
      expect(m.express).toHaveAttribute('tabindex', '0')
    }
  })
  spec('radio-group.pointer.3', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ defaultValue: 'express', onValueChange: change }, as)
      await click(m, m.express)
      checked(m.express, true)
      expect(change).not.toHaveBeenCalled()
    }
  })
  spec('radio-group.pointer.5', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ disabled: true, onValueChange: change }, as)
      await click(m, m.standard)
      checked(m.standard, false)
      expect(change).not.toHaveBeenCalled()
    }
  })
  spec('radio-group.pointer.6', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ onValueChange: change }, as, true)
      await click(m, m.express)
      checked(m.express, false)
      expect(change).not.toHaveBeenCalled()
      await click(m, m.standard)
      checked(m.standard, true)
      expect(change).toHaveBeenCalledExactlyOnceWith('standard')
    }
  })
  spec('radio-group.focus.8', () => {
    const m = setup({ defaultValue: 'express' })
    expect(m.standard).toHaveAttribute('tabindex', '-1')
    expect(m.express).toHaveAttribute('tabindex', '0')
    expect(m.pickup).toHaveAttribute('tabindex', '-1')
  })
  spec('radio-group.focus.9', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change })
    m.express.focus()
    await m.settle()
    checked(m.express, false)
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.focus.12', async () => {
    const change = vi.fn()
    const m = setup({ value: 'standard', onValueChange: change })
    m.setProps({ value: 'pickup' })
    await m.settle()
    checked(m.standard, false)
    checked(m.pickup, true)
    expect(m.standard).toHaveAttribute('tabindex', '-1')
    expect(m.pickup).toHaveAttribute('tabindex', '0')
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.forms.4', () => {
    for (const name of [undefined, 'delivery']) {
      const m = setup({ name })
      const names = [m.standard, m.express, m.pickup].map((el) => el.getAttribute('name'))
      expect(names[0]).toBeTruthy()
      expect(new Set(names).size).toBe(1)
      if (name) expect(names[0]).toBe(name)
    }
  })
  spec('radio-group.forms.25', () => {
    const m = setup({ required: true })
    expect(m.root).toHaveAttribute('aria-required', 'true')
    for (const el of [m.standard, m.express, m.pickup])
      expect(el).not.toHaveAttribute('aria-required')
  })
  spec('radio-group.forms.26', () => {
    for (const as of hosts) {
      const m = setup({ name: 'delivery', required: true }, as)
      const inputs = m.container.querySelectorAll('input')
      expect(inputs).toHaveLength(3)
      for (const el of inputs) expect(el).toBeRequired()
    }
  })
  spec('radio-group.forms.28', () => {
    for (const as of ['button', 'div'] as const) {
      const m = setup({ name: 'delivery', defaultValue: 'express' }, as)
      const inputs = [...m.container.querySelectorAll('input')]
      expect(inputs).toHaveLength(3)
      expect(inputs.map((input) => input.name)).toEqual(['delivery', 'delivery', 'delivery'])
      expect(inputs.map((input) => input.value)).toEqual(['standard', 'express', 'pickup'])
      expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
      for (const input of inputs) {
        expect(input).toHaveAttribute('aria-hidden', 'true')
        expect(input).toHaveAttribute('tabindex', '-1')
      }
    }
  })
  spec('radio.roles.10', () => {
    const m = setup({}, 'input', true)
    expect(m.express).toBeDisabled()
    expect(m.standard).not.toBeDisabled()
    expect(m.pickup).not.toBeDisabled()
  })
  spec('radio.roles.17', () => {
    const m = mount('radio-group', {
      'aria-describedby': 'group-help',
      children: () => (
        <RadioGroup.Item value="standard" aria-label="Standard" aria-describedby="author-help" />
      ),
    })
    expect(within(m.container).getByRole('radio')).toHaveAttribute(
      'aria-describedby',
      'author-help group-help'
    )
  })
  spec('radio-group.notes.7', () =>
    expect(within(mount('radio-group', {}).container).getByRole('radiogroup')).toBeEmptyDOMElement()
  )
  test('undefined releases control without clearing the stored default', async () => {
    const change = vi.fn()
    const m = setup({ defaultValue: 'express', value: 'standard', onValueChange: change })
    m.setProps({ value: undefined })
    await m.settle()
    checked(m.express, true)
    checked(m.standard, false)
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.a11y.1', async () => {
    for (const as of hosts) {
      for (const disabled of [false, true]) {
        const m = setup({ name: 'delivery', defaultValue: 'express', disabled }, as)
        await expectNoViolations(m.container)
        m.unmount()
      }
    }
  })
  spec('radio-group.state.1', async () => {
    for (const as of hosts) {
      const m = setup({}, as)
      for (const target of [m.standard, m.express, m.pickup]) {
        await click(m, target)
        for (const item of [m.standard, m.express, m.pickup]) checked(item, item === target)
      }
    }
  })
  spec('radio.roles.1', () => {
    for (const as of hosts)
      expect(within(setup({}, as).container).getAllByRole('radio')).toHaveLength(3)
  })
  spec('radio.roles.2', async () => {
    const m = setup({}, 'button')
    checked(m.standard, false)
    await click(m, m.standard)
    checked(m.standard, true)
    checked(m.express, false)
  })
  spec('radio.roles.3', () => {
    const m = mount('radio-group', {
      children: () => (
        <>
          <RadioGroup.Item as="button" value="content">
            Content name
          </RadioGroup.Item>
          <span id="radio-name">Referenced name</span>
          <RadioGroup.Item value="referenced" aria-labelledby="radio-name" />
          <RadioGroup.Item value="label" aria-label="Explicit name" />
        </>
      ),
    })
    const scope = within(m.container)
    for (const name of ['Content name', 'Referenced name', 'Explicit name'])
      expect(scope.getByRole('radio', { name })).toHaveAccessibleName(name)
  })
  spec('radio.roles.9', () => {
    const m = mount('radio-group', {
      children: () => (
        <>
          <span id="item-help">Arrives tomorrow</span>
          <RadioGroup.Item value="express" aria-label="Express" aria-describedby="item-help" />
        </>
      ),
    })
    expect(within(m.container).getByRole('radio')).toHaveAccessibleDescription('Arrives tomorrow')
  })
  spec('radio.roles.14', () => {
    const m = mount('radio-group', { children: () => <RadioGroup.Item value="standard" /> })
    expect(within(m.container).getByRole('radio')).not.toHaveAttribute('aria-label')
  })
  spec('radio.roles.18', () => {
    const m = setup({ name: 'delivery', defaultValue: 'express' }, 'button')
    expect(m.express).toHaveAttribute('role', 'radio')
    expect(m.express).toHaveAttribute('aria-checked', 'true')
    for (const input of m.container.querySelectorAll('input'))
      expect(input).toHaveAttribute('aria-hidden', 'true')
  })
  spec('radio.notes.2', () => {
    const m = mount('radio-group', {
      name: 'delivery',
      children: () => (
        <RadioGroup.Item as="button" value="standard" aria-label="Standard" data-author="control" />
      ),
    })
    expect(within(m.container).getByRole('radio')).toHaveAttribute('data-author', 'control')
    expect(m.container.querySelector('input')).not.toHaveAttribute('data-author')
  })
  spec('radio-group.pointer.8', async () => {
    for (const stop of [false, true]) {
      const ancestor = vi.fn()
      const change = vi.fn()
      const m = mount('radio-group', {
        onClick: ancestor,
        onValueChange: change,
        children: () => (
          <RadioGroup.Item
            as="button"
            value="standard"
            aria-label="Standard"
            onClick={(event) => {
              if (stop) event.stopPropagation()
            }}
          />
        ),
      })
      fireEvent.click(within(m.container).getByRole('radio'))
      await m.settle()
      expect(ancestor).toHaveBeenCalledTimes(stop ? 0 : 1)
      expect(change).toHaveBeenCalledExactlyOnceWith('standard')
    }
  })
  test('numeric and empty-string values preserve their identity', async () => {
    const change = vi.fn()
    const m = mount('radio-group', {
      onValueChange: change,
      children: () => (
        <>
          <RadioGroup.Item value={0} aria-label="Zero" />
          <RadioGroup.Item value="" aria-label="Empty" />
        </>
      ),
    })
    for (const name of ['Zero', 'Empty']) {
      fireEvent.click(within(m.container).getByRole('radio', { name }))
      await m.settle()
    }
    expect(change.mock.calls).toEqual([[0], ['']])
  })
  test('state flags cascade to items and disappear when cleared', async () => {
    const m = setup({ readonly: true, invalid: true, required: true })
    for (const item of [m.root, m.standard, m.express, m.pickup]) {
      for (const flag of ['readonly', 'invalid', 'required'])
        expect(item).toHaveAttribute('data-' + flag, '')
    }
    m.setProps({ readonly: false, invalid: false, required: false })
    await m.settle()
    for (const item of [m.root, m.standard, m.express, m.pickup]) {
      for (const flag of ['readonly', 'invalid', 'required'])
        expect(item).not.toHaveAttribute('data-' + flag)
    }
  })

  spec('radio-group.focus.16', async () => {
    const [visible, setVisible] = createSignal(true)
    const m = mount('radio-group', {
      defaultValue: 'standard',
      children: () => (
        <>
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <Show when={visible()}>
            <RadioGroup.Item as="button" value="express" aria-label="Express" />
          </Show>
        </>
      ),
    })
    const scope = within(m.container)
    scope.getByRole('radio', { name: 'Express' }).focus()
    setVisible(false)
    await m.settle()
    expect(scope.getByRole('radio', { name: 'Standard' })).toHaveAttribute('tabindex', '0')
    expect(scope.queryByRole('radio', { name: 'Express' })).toBeNull()
  })
  spec('radio-group.focus.17', async () => {
    const [visible, setVisible] = createSignal(false)
    const m = mount('radio-group', {
      children: () => (
        <>
          <Show when={visible()}>
            <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          </Show>
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
          <RadioGroup.Item as="button" value="pickup" aria-label="Pickup" />
        </>
      ),
    })
    setVisible(true)
    await m.settle()
    const scope = within(m.container)
    const express = scope.getByRole('radio', { name: 'Express' })
    express.focus()
    fireEvent.keyDown(express, { key: 'ArrowUp' })
    await m.settle()
    expect(scope.getByRole('radio', { name: 'Standard' })).toHaveFocus()
    setVisible(false)
    await m.settle()
    setVisible(true)
    await m.settle()
    express.focus()
    fireEvent.keyDown(express, { key: 'ArrowUp' })
    await m.settle()
    expect(scope.getByRole('radio', { name: 'Standard' })).toHaveFocus()
  })
  spec('radio-group.keyboard.11', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change }, 'button')
    m.standard.focus()
    for (const modifier of ['metaKey', 'ctrlKey', 'altKey']) {
      fireEvent.keyDown(m.standard, { key: 'ArrowDown', [modifier]: true })
      await m.settle()
      expect(m.standard).toHaveFocus()
    }
    expect(change).not.toHaveBeenCalled()
    const single = mount('radio-group', {
      onValueChange: change,
      children: () => <RadioGroup.Item as="button" value="only" aria-label="Only" />,
    })
    const item = within(single.container).getByRole('radio')
    item.focus()
    fireEvent.keyDown(item, { key: 'ArrowDown' })
    await single.settle()
    expect(item).toHaveFocus()
    checked(item, false)
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.keyboard.13', async () => {
    const m = setup({}, 'button')
    m.standard.focus()
    fireEvent.keyDown(m.standard, { key: 'ArrowDown' })
    await m.settle()
    expect(m.express).toHaveFocus()
    fireEvent.keyDown(m.express, { key: 'ArrowDown', repeat: true })
    await m.settle()
    expect(m.pickup).toHaveFocus()
    checked(m.pickup, true)
  })
})
