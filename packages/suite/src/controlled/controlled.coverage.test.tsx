import { fireEvent } from '@testing-library/dom'
import { Listbox } from '@xenon/solid'
import { render } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function button(container: HTMLElement): HTMLElement {
  const element = container.firstElementChild
  if (!(element instanceof HTMLElement)) throw new Error('nothing mounted')
  return element
}

describe('controlled value coverage', () => {
  spec('controlled.1', async () => {
    const mounted = mount('toggle', {
      'aria-label': 'Mute',
      defaultPressed: false,
      pressed: true,
    })
    const toggle = button(mounted.container)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    mounted.unmount()
  })

  spec('controlled.2', async () => {
    const change = vi.fn()
    const mounted = mount('toggle', {
      'aria-label': 'Mute',
      pressed: false,
      onPressedChange: change,
    })
    const toggle = button(mounted.container)
    fireEvent.click(toggle)
    await mounted.settle()
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    mounted.unmount()
  })

  spec('controlled.3', async () => {
    const change = vi.fn()
    const mounted = mount('toggle', {
      'aria-label': 'Mute',
      pressed: false,
      onPressedChange: change,
    })
    const toggle = button(mounted.container)
    mounted.setProps({ pressed: true })
    await mounted.settle()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(change).not.toHaveBeenCalled()
    mounted.unmount()
  })

  spec('controlled.4', async () => {
    const change = vi.fn()
    const mounted = mount('toggle', {
      'aria-label': 'Mute',
      defaultPressed: true,
      onPressedChange: change,
    })
    expect(button(mounted.container)).toHaveAttribute('aria-pressed', 'true')
    expect(change).not.toHaveBeenCalled()
    mounted.unmount()
  })

  spec('controlled.5', async () => {
    const change = vi.fn()
    const mounted = mount('toggle', { 'aria-label': 'Mute', onPressedChange: change })
    const toggle = button(mounted.container)
    fireEvent.click(toggle)
    await mounted.settle()
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
    mounted.unmount()
  })

  spec('controlled-state.state.3', async () => {
    const change = vi.fn()
    const mounted = mount('toggle', {
      'aria-label': 'Mute',
      pressed: false,
      onPressedChange: change,
    })
    await mounted.settle()
    expect(change).not.toHaveBeenCalled()
    mounted.unmount()
  })

  spec('controlled.27', async () => {
    const [showItems, setShowItems] = createSignal(false)
    const change = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const dispose = render(
      () => (
        <Listbox aria-label="Fruit" selectionMode="multiple" value={[]} onValueChange={change}>
          {showItems() && <Listbox.Item value="apple">Apple</Listbox.Item>}
        </Listbox>
      ),
      container
    )
    onTestFinished(() => {
      dispose()
      container.remove()
    })
    flush()
    expect(container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0)
    setShowItems(true)
    flush()
    await Promise.resolve()
    flush()
    expect(container.querySelector('[role="option"]')).toHaveAttribute('aria-selected', 'false')
    expect(change).not.toHaveBeenCalled()
  })
})
