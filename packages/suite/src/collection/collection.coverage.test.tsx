import { Listbox } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { spec } from '../spec'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, view: within(container) }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

describe('collection DOM coverage', () => {
  spec('collection.state.15', async () => {
    const NativeObserver = globalThis.MutationObserver
    let constructed = 0
    class CountingObserver extends NativeObserver {
      constructor(callback: MutationCallback) {
        constructed += 1
        super(callback)
      }
    }
    vi.stubGlobal('MutationObserver', CountingObserver)
    try {
      mount(() => (
        <Listbox aria-label="Fruit">
          <Listbox.Item value="a">Apple</Listbox.Item>
          <Listbox.Item value="b">Banana</Listbox.Item>
          <Listbox.Item value="c">Cherry</Listbox.Item>
        </Listbox>
      ))
      await settle()
      expect(constructed).toBe(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  spec('collection.state.26', () => {
    const mounted = mount(() => (
      <Listbox aria-label="Outer">
        <Listbox.Item value="same">Outer item</Listbox.Item>
        <div>
          <Listbox aria-label="Inner">
            <Listbox.Item value="same">Inner item</Listbox.Item>
          </Listbox>
        </div>
      </Listbox>
    ))
    const options = mounted.view.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]!.id).not.toBe(options[1]!.id)
    expect(options[0]).toHaveAttribute('id')
    expect(options[1]).toHaveAttribute('id')
  })

  spec('collection.state.9', async () => {
    const [buttonHost, setButtonHost] = createSignal(false)
    const mounted = mount(() => (
      <Listbox aria-label="Fruit">
        <Listbox.Item value="a" as={buttonHost() ? 'button' : 'div'}>
          Apple
        </Listbox.Item>
        <Listbox.Item value="b">Banana</Listbox.Item>
      </Listbox>
    ))
    const apple = () => mounted.view.getByRole('option', { name: 'Apple' })
    setButtonHost(true)
    await settle()
    expect(apple().tagName).toBe('BUTTON')
    apple().focus()
    fireEvent.keyDown(apple(), { key: 'ArrowDown' })
    await settle()
    expect(mounted.view.getByRole('option', { name: 'Banana' })).toHaveFocus()
  })

  spec('collection.state.7', async () => {
    const mounted = mount(() => (
      <Listbox aria-label="Fruit">
        <div data-group="a">
          <Listbox.Item value="a">Apple</Listbox.Item>
        </div>
        <div data-group="b">
          <Listbox.Item value="b">Banana</Listbox.Item>
        </div>
        <div data-group="c">
          <Listbox.Item value="c">Cherry</Listbox.Item>
        </div>
      </Listbox>
    ))
    const root = mounted.view.getByRole('listbox')
    const groups = [...root.querySelectorAll<HTMLElement>('[data-group]')]
    root.insertBefore(groups[2]!, groups[1]!)
    await settle()
    const apple = mounted.view.getByRole('option', { name: 'Apple' })
    apple.focus()
    fireEvent.keyDown(apple, { key: 'ArrowDown' })
    await settle()
    expect(mounted.view.getByRole('option', { name: 'Cherry' })).toHaveFocus()
  })

  spec('collection.state.3', async () => {
    const [showMiddle, setShowMiddle] = createSignal(true)
    const mounted = mount(() => (
      <Listbox aria-label="Fruit">
        <Listbox.Item value="a">Apple</Listbox.Item>
        <Show when={showMiddle()}>
          <Listbox.Item value="b">Banana</Listbox.Item>
        </Show>
        <Listbox.Item value="c">Cherry</Listbox.Item>
      </Listbox>
    ))
    setShowMiddle(false)
    await settle()
    const apple = mounted.view.getByRole('option', { name: 'Apple' })
    apple.focus()
    fireEvent.keyDown(apple, { key: 'ArrowDown' })
    await settle()
    expect(mounted.view.getByRole('option', { name: 'Cherry' })).toHaveFocus()
    setShowMiddle(true)
    await settle()
    fireEvent.keyDown(mounted.view.getByRole('option', { name: 'Cherry' }), { key: 'ArrowUp' })
    await settle()
    expect(mounted.view.getByRole('option', { name: 'Banana' })).toHaveFocus()
  })
})
