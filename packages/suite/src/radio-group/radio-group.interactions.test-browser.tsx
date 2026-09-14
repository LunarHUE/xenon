import { RadioGroup } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function setup(props = {}, as: 'input' | 'button' | 'div' = 'input', disabledItem = false) {
  const m = mount('radio-group', {
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
          disabled={disabledItem}
        />
        <RadioGroup.Item
          as={as}
          style={{ width: '24px', height: '24px' }}
          value="pickup"
          aria-label="Pickup"
        />
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    standard: scope.getByRole('radio', { name: 'Standard' }),
    express: scope.getByRole('radio', { name: 'Express' }),
    pickup: scope.getByRole('radio', { name: 'Pickup' }),
  }
}

function checked(item: HTMLElement, value: boolean) {
  if (item instanceof HTMLInputElement) expect(item.checked).toBe(value)
  else expect(item).toHaveAttribute('aria-checked', String(value))
}

const hosts = ['input', 'button', 'div'] as const

describe('radio group browser interactions', () => {
  spec('radio-group.pointer.2', async () => {
    const change = vi.fn()
    const m = mount('radio-group', {
      defaultValue: 'standard',
      onValueChange: change,
      children: () => (
        <>
          <RadioGroup.Item value="standard" aria-label="Standard" />
          <RadioGroup.Item
            value="express"
            aria-label="Express"
            onClick={(event) => event.preventDefault()}
          />
        </>
      ),
    })
    await userEvent.click(within(m.container).getByRole('radio', { name: 'Express' }))
    await m.settle()
    checked(within(m.container).getByRole('radio', { name: 'Standard' }), true)
    checked(within(m.container).getByRole('radio', { name: 'Express' }), false)
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.keyboard.2', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ onValueChange: change }, as)
      m.express.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      checked(m.express, true)
      expect(change).toHaveBeenCalledExactlyOnceWith('express')
      await userEvent.keyboard(' ')
      await m.settle()
      checked(m.express, true)
      expect(change).toHaveBeenCalledOnce()
      m.unmount()
    }
  })
  spec('radio-group.keyboard.3', async () => {
    for (const as of hosts) {
      const m = setup({ defaultValue: 'standard' }, as)
      m.standard.focus()
      await userEvent.keyboard('{ArrowDown}')
      await m.settle()
      expect(m.express).toHaveFocus()
      checked(m.standard, false)
      checked(m.express, true)
      await userEvent.keyboard('{ArrowUp}')
      await m.settle()
      expect(m.standard).toHaveFocus()
      checked(m.standard, true)
      checked(m.express, false)
      m.unmount()
    }
  })
  spec('radio-group.keyboard.4', async () => {
    for (const as of hosts) {
      const m = setup({ defaultValue: 'pickup' }, as)
      m.pickup.focus()
      await userEvent.keyboard('{ArrowDown}')
      await m.settle()
      expect(m.standard).toHaveFocus()
      checked(m.standard, true)
      await userEvent.keyboard('{ArrowUp}')
      await m.settle()
      expect(m.pickup).toHaveFocus()
      checked(m.pickup, true)
      m.unmount()
    }
  })
  spec('radio-group.keyboard.9', async () => {
    for (const as of hosts) {
      const m = mount('radio-group', {
        children: () => (
          <>
            <RadioGroup.Item
              as={as}
              style={{ width: '24px', height: '24px' }}
              value="a"
              aria-label="A"
            />
            <RadioGroup.Item
              as={as}
              style={{ width: '24px', height: '24px' }}
              value="b"
              aria-label="B"
              disabled
            />
            <RadioGroup.Item
              as={as}
              style={{ width: '24px', height: '24px' }}
              value="c"
              aria-label="C"
              disabled
            />
            <RadioGroup.Item
              as={as}
              style={{ width: '24px', height: '24px' }}
              value="d"
              aria-label="D"
            />
          </>
        ),
      })
      const scope = within(m.container)
      const first = scope.getByRole('radio', { name: 'A' })
      const last = scope.getByRole('radio', { name: 'D' })
      first.focus()
      await userEvent.keyboard('{ArrowDown}')
      await m.settle()
      expect(last).toHaveFocus()
      checked(last, true)
      await userEvent.keyboard('{ArrowDown}')
      await m.settle()
      expect(first).toHaveFocus()
      checked(first, true)
      m.unmount()
    }
  })
  spec('radio-group.pointer.4', async () => {
    const change = vi.fn()
    const m = mount('radio-group', {
      onValueChange: change,
      children: () => (
        <>
          <label>
            Standard
            <RadioGroup.Item value="standard" />
          </label>
          <RadioGroup.Item id="express-radio" value="express" />
          <label for="express-radio">Express</label>
        </>
      ),
    })
    await userEvent.click(within(m.container).getByText('Standard'))
    await m.settle()
    expect(change).toHaveBeenCalledExactlyOnceWith('standard')
    await userEvent.click(within(m.container).getByText('Express'))
    await m.settle()
    expect(change.mock.calls).toEqual([['standard'], ['express']])
    checked(within(m.container).getByRole('radio', { name: 'Express' }), true)
  })
  spec('radio-group.pointer.7', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ readonly: true, onValueChange: change }, as)
      await userEvent.click(m.express)
      await m.settle()
      checked(m.express, false)
      m.standard.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      checked(m.standard, false)
      expect(change).not.toHaveBeenCalled()
      m.unmount()
    }
  })
  spec('radio-group.focus.19', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ readonly: true, defaultValue: 'standard', onValueChange: change }, as)
      m.standard.focus()
      await userEvent.keyboard('{ArrowDown}{ArrowDown}')
      await m.settle()
      expect(m.pickup).toHaveFocus()
      checked(m.standard, true)
      checked(m.pickup, false)
      expect(change).not.toHaveBeenCalled()
      m.unmount()
    }
  })
  spec('radio-group.rtl.1', async () => {
    for (const as of hosts) {
      const m = setup({ dir: 'rtl', orientation: 'horizontal', defaultValue: 'standard' }, as)
      expect(within(m.container).getByRole('radiogroup')).toHaveAttribute('dir', 'rtl')
      m.standard.focus()
      await userEvent.keyboard('{ArrowLeft}')
      await m.settle()
      expect(m.express).toHaveFocus()
      checked(m.express, true)
      await userEvent.keyboard('{ArrowRight}')
      await m.settle()
      expect(m.standard).toHaveFocus()
      checked(m.standard, true)
      m.unmount()
    }
  })
  test('fixed controlled native selection survives arrow proposals', async () => {
    const change = vi.fn()
    const m = setup({ value: 'standard', onValueChange: change })
    m.standard.focus()
    await userEvent.keyboard('{ArrowDown}')
    await m.settle()
    expect(m.express).toHaveFocus()
    checked(m.standard, true)
    checked(m.express, false)
    expect(change).toHaveBeenCalledExactlyOnceWith('express')
  })
  spec('radio-group.focus.10', async () => {
    const before = document.createElement('button')
    before.textContent = 'Before'
    document.body.append(before)
    onTestFinished(() => before.remove())
    const change = vi.fn()
    const m = setup({ defaultValue: 'express', onValueChange: change })
    const after = document.createElement('button')
    after.textContent = 'After'
    document.body.append(after)
    onTestFinished(() => after.remove())
    before.focus()
    await userEvent.keyboard('{Tab}')
    await m.settle()
    expect(m.express).toHaveFocus()
    await userEvent.keyboard('{Tab}')
    expect(after).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(m.express).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.focus.11', async () => {
    const change = vi.fn()
    const m = setup({ defaultValue: 'express', onValueChange: change })
    const after = document.createElement('button')
    document.body.append(after)
    onTestFinished(() => after.remove())
    m.express.focus()
    await userEvent.keyboard('{Tab}')
    expect(after).toHaveFocus()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    expect(m.express).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })
  spec('radio-group.focus.13', async () => {
    const before = document.createElement('button')
    document.body.append(before)
    onTestFinished(() => before.remove())
    const m = setup({ disabled: true })
    const after = document.createElement('button')
    document.body.append(after)
    onTestFinished(() => after.remove())
    before.focus()
    await userEvent.keyboard('{Tab}')
    await m.settle()
    expect(after).toHaveFocus()
  })
  spec('radio-group.keyboard.14', async () => {
    for (const as of ['button', 'div'] as const) {
      const m = setup({ loop: false }, as)
      m.standard.focus()
      await userEvent.keyboard('{ArrowUp}')
      await m.settle()
      expect(m.standard).toHaveFocus()
      m.pickup.focus()
      await userEvent.keyboard('{ArrowDown}')
      await m.settle()
      expect(m.pickup).toHaveFocus()
      m.unmount()
    }
  })
  spec('radio-group.keyboard.15', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const keydown = vi.fn()
      const m = mount('radio-group', {
        onValueChange: change,
        children: () => (
          <RadioGroup.Item as={as} value="standard" aria-label="Standard" onKeyDown={keydown} />
        ),
      })
      const item = within(m.container).getByRole('radio')
      item.focus()
      await userEvent.keyboard('{Enter}')
      await m.settle()
      checked(item, false)
      expect(change).not.toHaveBeenCalled()
      expect(keydown).toHaveBeenCalledOnce()
      m.unmount()
    }
  })
  spec('radio-group.pointer.11', async () => {
    const click = vi.fn()
    const m = setup({ onClick: click }, 'button')
    m.standard.focus()
    await userEvent.keyboard('{ArrowDown}')
    await m.settle()
    checked(m.express, true)
    expect(click).not.toHaveBeenCalled()
  })
  spec('radio.keyboard.2', async () => {
    for (const as of hosts) {
      const change = vi.fn()
      const m = setup({ onValueChange: change }, as)
      m.standard.focus()
      await userEvent.keyboard('[Space>]')
      await m.settle()
      checked(m.standard, false)
      expect(change).not.toHaveBeenCalled()
      await userEvent.keyboard('[/Space]')
      await m.settle()
      checked(m.standard, true)
      expect(change).toHaveBeenCalledExactlyOnceWith('standard')
      m.unmount()
    }
  })
  spec('radio.roles.15', async () => {
    const change = vi.fn()
    const m = mount('radio-group', {
      name: 'delivery',
      onValueChange: change,
      children: () => (
        <>
          <RadioGroup.Item as="button" id="button-radio" value="standard">
            Standard
          </RadioGroup.Item>
          <label for="button-radio">Choose standard</label>
        </>
      ),
    })
    const item = within(m.container).getByRole('radio')
    expect(item).toHaveAttribute('id', 'button-radio')
    expect(m.container.querySelector('input')).not.toHaveAttribute('id')
    await userEvent.click(within(m.container).getByText('Choose standard'))
    await m.settle()
    checked(item, true)
    expect(change).toHaveBeenCalledExactlyOnceWith('standard')
  })
  spec('radio-group.rtl.2', async () => {
    const previous = document.body.getAttribute('dir')
    document.body.dir = 'rtl'
    onTestFinished(() => {
      if (previous === null) document.body.removeAttribute('dir')
      else document.body.setAttribute('dir', previous)
    })
    const m = setup({ orientation: 'horizontal' })
    m.standard.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await m.settle()
    expect(m.express).toHaveFocus()
    checked(m.express, true)
  })
})
