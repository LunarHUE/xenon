import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Tabs } from './tabs'

function three(props: { disabled?: string } = {}) {
  return (
    <>
      <Tabs.List aria-label="Sections">
        <Tabs.Tab value="one" disabled={props.disabled === 'one'}>
          one
        </Tabs.Tab>
        <Tabs.Tab value="two" disabled={props.disabled === 'two'}>
          two
        </Tabs.Tab>
        <Tabs.Tab value="three">three</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="one">first</Tabs.Panel>
      <Tabs.Panel value="two">second</Tabs.Panel>
      <Tabs.Panel value="three">third</Tabs.Panel>
    </>
  )
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}

function stops(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="tab"]')].map(
    (el) => `${el.textContent}=${el.getAttribute('tabindex')}:${el.getAttribute('aria-selected')}`
  )
}

describe('<Tabs />', () => {
  test('wires every tab to its panel and selects the first one', () => {
    const { getByText, getByRole, container } = render(() => <Tabs>{three()}</Tabs>)
    flush()
    const list = getByRole('tablist')
    expect(list).not.toHaveAttribute('aria-orientation')
    expect(list).toHaveAttribute('data-orientation', 'horizontal')

    for (const name of ['one', 'two', 'three']) {
      const tab = getByText(name)
      const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '')
      expect(panel).not.toBeNull()
      expect(panel).toHaveAttribute('aria-labelledby', tab.id)
      expect(panel).toHaveAttribute('role', 'tabpanel')
    }

    expect(stops(container)).toEqual(['one=0:true', 'two=-1:false', 'three=-1:false'])
    expect(getByText('first')).not.toHaveAttribute('hidden')
    expect(getByText('second')).toHaveAttribute('hidden')
    expect(getByText('first')).toHaveAttribute('data-state', 'active')
  })

  test('a vertical list names its orientation and swaps the arrow axis', () => {
    const { getByRole, getByText } = render(() => <Tabs orientation="vertical">{three()}</Tabs>)
    expect(getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')

    getByText('one').focus()
    expect(press(getByText('one'), 'ArrowRight').defaultPrevented).toBe(false)
    expect(getByText('one')).toHaveAttribute('aria-selected', 'true')

    press(getByText('one'), 'ArrowDown')
    expect(getByText('two')).toHaveFocus()
    expect(getByText('two')).toHaveAttribute('aria-selected', 'true')
  })

  test('automatic activation moves selection with focus and wraps', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(() => (
      <Tabs onValueChange={onValueChange}>{three()}</Tabs>
    ))
    getByText('one').focus()

    press(getByText('one'), 'ArrowLeft')
    expect(getByText('three')).toHaveFocus()
    expect(stops(container)).toEqual(['one=-1:false', 'two=-1:false', 'three=0:true'])
    expect(getByText('third')).not.toHaveAttribute('hidden')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('three')
  })

  test('manual activation moves focus alone until a click commits', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(() => (
      <Tabs activationMode="manual" onValueChange={onValueChange}>
        {three()}
      </Tabs>
    ))
    getByText('one').focus()

    press(getByText('one'), 'End')
    expect(getByText('three')).toHaveFocus()
    expect(stops(container)).toEqual(['one=-1:true', 'two=-1:false', 'three=0:false'])
    expect(onValueChange).not.toHaveBeenCalled()

    getByText('three').click()
    flush()
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('three')
    expect(getByText('three')).toHaveAttribute('aria-selected', 'true')
  })

  test('re-clicking the selected tab fires nothing', () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => <Tabs onValueChange={onValueChange}>{three()}</Tabs>)
    getByText('one').click()
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a disabled tab is skipped and selects nothing on click', () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <Tabs onValueChange={onValueChange}>{three({ disabled: 'two' })}</Tabs>
    ))
    expect(getByText('two')).toBeDisabled()
    expect(getByText('two')).toHaveAttribute('data-disabled', '')

    getByText('one').focus()
    press(getByText('one'), 'ArrowRight')
    expect(getByText('three')).toHaveFocus()

    getByText('two').click()
    flush()
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('three')
  })

  test('a leading disabled tab hands the initial selection to the next one', () => {
    const { container } = render(() => <Tabs>{three({ disabled: 'one' })}</Tabs>)
    expect(stops(container)).toEqual(['one=-1:false', 'two=0:true', 'three=-1:false'])
  })

  test('the panel takes a tab stop only when it holds nothing focusable', () => {
    const { getByText } = render(() => (
      <Tabs>
        <Tabs.List>
          <Tabs.Tab value="one">one</Tabs.Tab>
          <Tabs.Tab value="two">two</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one">plain text</Tabs.Panel>
        <Tabs.Panel value="two">
          <button>inside</button>
        </Tabs.Panel>
      </Tabs>
    ))
    flush()
    expect(getByText('plain text')).toHaveAttribute('tabindex', '0')

    getByText('two').click()
    flush()
    expect(getByText('inside').parentElement).not.toHaveAttribute('tabindex')
    expect(getByText('plain text')).not.toHaveAttribute('tabindex')
  })

  test('a controlled value ignores clicks its handler does not honor', () => {
    const [value, setValue] = createSignal('one')
    const { getByText } = render(() => <Tabs value={value()}>{three()}</Tabs>)
    getByText('two').click()
    flush()
    expect(getByText('one')).toHaveAttribute('aria-selected', 'true')

    setValue('three')
    flush()
    expect(getByText('three')).toHaveAttribute('aria-selected', 'true')
    expect(getByText('third')).not.toHaveAttribute('hidden')
  })

  test('the tab stop returns to the selection once focus leaves the list', () => {
    const { container, getByText } = render(() => <Tabs activationMode="manual">{three()}</Tabs>)
    getByText('one').focus()
    press(getByText('one'), 'End')
    expect(stops(container)).toEqual(['one=-1:true', 'two=-1:false', 'three=0:false'])

    getByText('three').blur()
    flush()
    expect(stops(container)).toEqual(['one=0:true', 'two=-1:false', 'three=-1:false'])
  })

  test('two widgets on one page mint distinct ids', () => {
    const { container } = render(() => (
      <>
        <Tabs>{three()}</Tabs>
        <Tabs>{three()}</Tabs>
      </>
    ))
    const ids = [...container.querySelectorAll('[role="tab"],[role="tabpanel"]')].map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('an author id on a tab or a panel keeps the wiring pointing at it', () => {
    const { getByText } = render(() => (
      <Tabs>
        <Tabs.List>
          <Tabs.Tab value="one" id="my-tab">
            one
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="one" id="my-panel">
          first
        </Tabs.Panel>
      </Tabs>
    ))
    flush()
    expect(getByText('one')).toHaveAttribute('aria-controls', 'my-panel')
    expect(getByText('first')).toHaveAttribute('aria-labelledby', 'my-tab')
  })

  test('parts outside a root throw', () => {
    expect(() => render(() => <Tabs.List />)).toThrow(/Tabs/)
    expect(() => render(() => <Tabs.Tab value="one" />)).toThrow(/Tabs/)
    expect(() => render(() => <Tabs.Panel value="one" />)).toThrow(/Tabs/)
  })
})
