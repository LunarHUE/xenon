import { render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Accordion } from './accordion'

function three(disabled?: string) {
  return (
    <For each={['one', 'two', 'three']}>
      {(value) => (
        <Accordion.Item value={value} disabled={value === disabled}>
          <h3>
            <Accordion.Trigger>{value}</Accordion.Trigger>
          </h3>
          <Accordion.Panel>{`${value} body`}</Accordion.Panel>
        </Accordion.Item>
      )}
    </For>
  )
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}

function open(props: Record<string, unknown> = {}, disabled?: string) {
  return render(() => <Accordion {...props}>{three(disabled)}</Accordion>)
}

describe('<Accordion />', () => {
  test('wires each trigger to its region', () => {
    const { getByText } = open({ defaultValue: 'one' })
    flush()
    const trigger = getByText('one')
    const panel = getByText('one body')
    expect(trigger).toHaveAttribute('type', 'button')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('role', 'region')
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id)
    expect(getByText('two')).toHaveAttribute('aria-expanded', 'false')
  })

  test('every trigger is its own tab stop', () => {
    const { getByText } = open()
    flush()
    for (const value of ['one', 'two', 'three']) {
      expect(getByText(value)).not.toHaveAttribute('tabindex')
    }
  })

  test('single mode swaps which panel is mounted', () => {
    const onValueChange = vi.fn()
    const { getByText, queryByText } = open({ defaultValue: 'one', onValueChange })
    flush()
    getByText('two').click()
    flush()
    expect(onValueChange).toHaveBeenCalledWith('two')
    expect(getByText('two body')).toBeTruthy()
    expect(queryByText('one body')).toBeNull()
  })

  test('a non-collapsible accordion ignores a click on the open item', () => {
    const onValueChange = vi.fn()
    const { getByText } = open({ defaultValue: 'one', onValueChange })
    flush()
    getByText('one').click()
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(getByText('one body')).toBeTruthy()
    expect(getByText('one')).not.toHaveAttribute('aria-disabled')
  })

  test('collapsible lets the open item close', () => {
    const onValueChange = vi.fn()
    const { getByText, queryByText } = open({
      defaultValue: 'one',
      collapsible: true,
      onValueChange,
    })
    flush()
    getByText('one').click()
    flush()
    expect(onValueChange).toHaveBeenCalledWith(undefined)
    expect(queryByText('one body')).toBeNull()
  })

  test('multiple mode keeps panels open and reports an array', () => {
    const onValueChange = vi.fn()
    const { getByText } = open({ mode: 'multiple', defaultValue: ['one'], onValueChange })
    flush()
    getByText('two').click()
    flush()
    expect(onValueChange).toHaveBeenCalledWith(['one', 'two'])
    expect(getByText('one body')).toBeTruthy()
    expect(getByText('two body')).toBeTruthy()
  })

  test('arrows travel the triggers and wrap', () => {
    const { getByText } = open()
    flush()
    getByText('one').focus()
    expect(press(getByText('one'), 'ArrowDown').defaultPrevented).toBe(true)
    expect(getByText('two')).toHaveFocus()
    press(getByText('two'), 'End')
    expect(getByText('three')).toHaveFocus()
    press(getByText('three'), 'ArrowDown')
    expect(getByText('one')).toHaveFocus()
    press(getByText('one'), 'ArrowRight')
    expect(getByText('one')).toHaveFocus()
  })

  test('arrow navigation skips a disabled item', () => {
    const { getByText } = open({}, 'two')
    flush()
    getByText('one').focus()
    press(getByText('one'), 'ArrowDown')
    expect(getByText('three')).toHaveFocus()
    expect(getByText('two')).toBeDisabled()
    expect(getByText('one')).not.toBeDisabled()
  })

  test('a disabled root disables every trigger', () => {
    const onValueChange = vi.fn()
    const { getByText, queryByText } = open({ disabled: true, onValueChange })
    flush()
    expect(getByText('one')).toBeDisabled()
    getByText('one').click()
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(queryByText('one body')).toBeNull()
  })

  test('a horizontal accordion moves on the other axis', () => {
    const { getByText } = open({ orientation: 'horizontal' })
    flush()
    expect(getByText('one')).toHaveAttribute('data-orientation', 'horizontal')
    getByText('one').focus()
    press(getByText('one'), 'ArrowDown')
    expect(getByText('one')).toHaveFocus()
    press(getByText('one'), 'ArrowRight')
    expect(getByText('two')).toHaveFocus()
  })

  test('force mount keeps closed panels hidden in the DOM', () => {
    const { getByText } = open({ defaultValue: 'one', forceMount: true })
    flush()
    expect(getByText('two body')).toHaveAttribute('hidden')
    expect(getByText('one body')).not.toHaveAttribute('hidden')
  })

  test('the panel publishes its measured size', () => {
    const { getByText } = open({ defaultValue: 'one' })
    flush()
    expect(getByText('one body').style.getPropertyValue('--accordion-panel-height')).toBe('auto')
  })

  test('parts name the ancestor they need', () => {
    expect(() => render(() => <Accordion.Trigger>one</Accordion.Trigger>)).toThrow(
      /Accordion.Trigger must be rendered inside an <Accordion.Item>/
    )
    expect(() => render(() => <Accordion.Item value="one">body</Accordion.Item>)).toThrow(
      /Accordion.Item must be rendered inside an <Accordion>/
    )
  })
})
