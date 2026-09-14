import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Collapsible } from './collapsible'

function frame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

function basic(props: Record<string, unknown> = {}) {
  return render(() => (
    <Collapsible {...props}>
      <Collapsible.Trigger>more</Collapsible.Trigger>
      <Collapsible.Content>body</Collapsible.Content>
    </Collapsible>
  ))
}

describe('<Collapsible />', () => {
  test('starts closed with the content out of the DOM', () => {
    const { getByText, queryByText } = basic()
    const trigger = getByText('more')
    expect(trigger).toHaveAttribute('type', 'button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls')
    expect(queryByText('body')).toBeNull()
  })

  test('clicking mounts the content and points aria-controls at it', async () => {
    const { getByText } = basic()
    getByText('more').click()
    flush()
    const content = getByText('body')
    expect(getByText('more')).toHaveAttribute('aria-controls', content.id)
    expect(getByText('more')).toHaveAttribute('aria-expanded', 'true')
    expect(content).toHaveAttribute('data-state', 'open')
    expect(content).toHaveAttribute('data-starting-style', '')
    await frame()
    flush()
    expect(getByText('body')).not.toHaveAttribute('data-starting-style')
  })

  test('clicking again removes the content', () => {
    const { getByText, queryByText } = basic({ defaultOpen: true })
    expect(getByText('body')).toBeTruthy()
    getByText('more').click()
    flush()
    expect(queryByText('body')).toBeNull()
    expect(getByText('more')).toHaveAttribute('aria-expanded', 'false')
  })

  test('a controlled collapsible reports the request without moving', () => {
    const onOpenChange = vi.fn()
    const { getByText, queryByText } = basic({ open: false, onOpenChange })
    getByText('more').click()
    flush()
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(queryByText('body')).toBeNull()
  })

  test('an external signal drives every part', () => {
    const [open, setOpen] = createSignal(false)
    const { getByText, queryByText } = render(() => (
      <Collapsible open={open()}>
        <Collapsible.Trigger>more</Collapsible.Trigger>
        <Collapsible.Content>body</Collapsible.Content>
      </Collapsible>
    ))
    setOpen(true)
    flush()
    expect(getByText('more')).toHaveAttribute('aria-expanded', 'true')
    setOpen(false)
    flush()
    expect(queryByText('body')).toBeNull()
  })

  test('disabled blocks the toggle and marks the parts', () => {
    const onOpenChange = vi.fn()
    const { getByText, container, queryByText } = basic({ disabled: true, onOpenChange })
    expect(getByText('more')).toBeDisabled()
    expect(container.firstElementChild).toHaveAttribute('data-disabled', '')
    getByText('more').click()
    flush()
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(queryByText('body')).toBeNull()
  })

  test('force mount keeps the content hidden instead of removing it', () => {
    const { getByText } = basic({ forceMount: true })
    const content = getByText('body')
    expect(content).toHaveAttribute('hidden')
    expect(content).toHaveAttribute('data-state', 'closed')
    getByText('more').click()
    flush()
    expect(getByText('body')).not.toHaveAttribute('hidden')
  })

  test('an author id on the content retargets aria-controls', () => {
    const { getByText } = render(() => (
      <Collapsible defaultOpen>
        <Collapsible.Trigger>more</Collapsible.Trigger>
        <Collapsible.Content id="notes">body</Collapsible.Content>
      </Collapsible>
    ))
    flush()
    expect(getByText('body')).toHaveAttribute('id', 'notes')
    expect(getByText('more')).toHaveAttribute('aria-controls', 'notes')
  })

  test('the content publishes its measured size', () => {
    const { getByText } = basic({ defaultOpen: true })
    expect(getByText('body').style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
  })

  test('a part without its root names the missing context', () => {
    expect(() => render(() => <Collapsible.Trigger>more</Collapsible.Trigger>)).toThrow(
      /Collapsible.Trigger must be rendered inside a <Collapsible>/
    )
  })
})
