import { Accordion } from '@xenon-ui/solid'
import { accordion as coreAccordion } from '@xenon-ui/core'
import { fireEvent, within } from '@testing-library/dom'
import { For } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('accordion', {
    children: () => (
      <For each={['a', 'b', 'c']}>
        {(value) => (
          <Accordion.Item value={value}>
            <Accordion.Trigger>{value}</Accordion.Trigger>
            <Accordion.Panel>{value} content</Accordion.Panel>
          </Accordion.Item>
        )}
      </For>
    ),
    ...props,
  })
  return { ...m, triggers: within(m.container).getAllByRole('button') }
}

function ForwardPart(props: Record<string, unknown>) {
  return <div {...props} />
}

describe('accordion additional coverage', () => {
  spec('accordion.keyboard.11', async () => {
    const m = fixture({ loop: false })
    m.triggers[0]!.focus()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
  })

  spec('accordion.keyboard.13', async () => {
    const changed = vi.fn()
    const m = mount('accordion', {
      onValueChange: changed,
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger>a</Accordion.Trigger>
          </Accordion.Item>
          <Accordion.Item value="b" disabled>
            <Accordion.Trigger>b</Accordion.Trigger>
          </Accordion.Item>
          <Accordion.Item value="c">
            <Accordion.Trigger>c</Accordion.Trigger>
          </Accordion.Item>
        </>
      ),
    })
    const disabled = within(m.container).getByRole('button', { name: 'b' })
    const enabled = within(m.container).getByRole('button', { name: 'a' })
    enabled.focus()
    fireEvent.keyDown(disabled, { key: 'Enter' })
    fireEvent.keyDown(disabled, { key: ' ' })
    for (const key of ['ArrowDown', 'ArrowUp']) {
      fireEvent.keyDown(disabled, { key })
      await m.settle()
      expect(enabled).toHaveFocus()
    }
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(disabled).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.focus.3', () => {
    const focused = vi.fn()
    const result = coreAccordion({ items: ['a', 'b'], onActiveChange: focused })
    result.parts.trigger('b').on.focus?.({} as FocusEvent & { currentTarget: HTMLButtonElement })
    expect(focused).toHaveBeenCalledWith('b')
  })

  spec('accordion.pointer.5', async () => {
    const changed = vi.fn()
    const m = mount('accordion', {
      onValueChange: changed,
      children: () => (
        <Accordion.Item value="a" disabled>
          <Accordion.Trigger>a</Accordion.Trigger>
          <Accordion.Panel>a content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    const disabled = within(m.container).getByRole('button')
    // A forced dispatch models a pointer activation delivered to a disabled item.
    fireEvent.click(disabled)
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(disabled).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.pointer.6', async () => {
    const changed = vi.fn()
    const m = mount('accordion', {
      disabled: true,
      onValueChange: changed,
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger disabled={false}>a</Accordion.Trigger>
          </Accordion.Item>
          <Accordion.Item value="b" disabled>
            <Accordion.Trigger disabled={false}>b</Accordion.Trigger>
          </Accordion.Item>
        </>
      ),
    })
    const triggers = within(m.container).getAllByRole('button')
    for (const trigger of triggers) {
      expect(trigger).toHaveAttribute('data-disabled', '')
      fireEvent.click(trigger)
      fireEvent.keyDown(trigger, { key: 'Enter' })
      fireEvent.keyDown(trigger, { key: ' ' })
    }
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(triggers.every((trigger) => trigger.getAttribute('aria-expanded') === 'false')).toBe(
      true
    )
    m.setProps({ disabled: false })
    await m.settle()
    fireEvent.click(triggers[0]!)
    await m.settle()
    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(triggers[1]!)
    await m.settle()
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.roles.18', () => {
    const m = mount('accordion', {
      forceMount: true,
      children: () => (
        <>
          <Accordion.Item value="a" disabled>
            <Accordion.Trigger>a</Accordion.Trigger>
            <Accordion.Panel>a content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
            <Accordion.Panel>b content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="c">
            <Accordion.Trigger>c</Accordion.Trigger>
            <Accordion.Panel>c content</Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    const items = [...m.container.querySelectorAll('button')]
      .map((button) => button.parentElement)
      .filter((item): item is HTMLElement => item !== null)
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveAttribute('data-disabled', '')
    expect(items.slice(1).every((item) => !item.hasAttribute('data-disabled'))).toBe(true)
    const panels = [...m.container.querySelectorAll('[role="region"]')]
    expect(panels[0]).toHaveAttribute('data-disabled', '')
    expect(panels.slice(1).every((panel) => !panel.hasAttribute('data-disabled'))).toBe(true)
  })

  spec('accordion.roles.26', () => {
    const m = mount('accordion', {
      children: () => (
        <Accordion.Item value="a">
          <Accordion.Trigger as="div" tabindex={-1}>
            Author tab stop
          </Accordion.Trigger>
          <Accordion.Panel>Content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    expect(within(m.container).getByRole('button')).toHaveAttribute('tabindex', '-1')
  })

  spec('accordion.state.13', async () => {
    const changed = vi.fn()
    const m = fixture({ value: 'a', collapsible: true, onValueChange: changed })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(changed).toHaveBeenCalledWith(undefined)
    expect(changed).toHaveBeenCalledTimes(1)
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    m.setProps({ value: undefined })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.state.16', async () => {
    const m = fixture({ mode: 'multiple', value: ['a'] })
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    m.setProps({ value: ['a', 'c'] })
    await m.settle()
    expect(m.triggers[2]).toHaveAttribute('aria-expanded', 'true')
    m.setProps({ value: ['c'] })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.state.16', async () => {
    const values = ['a']
    const m = fixture({ mode: 'multiple', value: values })
    values.push('c')
    m.setProps({ value: values })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[2]).toHaveAttribute('aria-expanded', 'true')
  })

  spec('accordion.state.17', async () => {
    const m = fixture({ value: ['a', 'b'] })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
    expect(m.triggers[2]).toHaveAttribute('aria-expanded', 'false')
  })

  spec('accordion.notes.1', () => {
    const rootRef = vi.fn()
    const itemRef = vi.fn()
    const triggerRef = vi.fn()
    const panelRef = vi.fn()
    const m = mount('accordion', {
      forceMount: true,
      ref: rootRef,
      children: () => (
        <Accordion.Item ref={itemRef} value="a">
          <Accordion.Trigger ref={triggerRef}>a</Accordion.Trigger>
          <Accordion.Panel ref={panelRef}>a content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    expect(rootRef).toHaveBeenCalledWith(m.container.firstElementChild)
    expect(itemRef).toHaveBeenCalledWith(m.container.querySelector('button')?.parentElement)
    expect(triggerRef).toHaveBeenCalledWith(m.container.querySelector('button'))
    expect(panelRef).toHaveBeenCalledWith(m.container.querySelector('[role="region"]'))
  })

  spec('accordion.notes.1', () => {
    const rootRef = vi.fn()
    const itemRef = vi.fn()
    const triggerRef = vi.fn()
    const panelRef = vi.fn()
    const rootClick = vi.fn()
    const itemClick = vi.fn()
    const triggerClick = vi.fn()
    const panelClick = vi.fn()
    const m = mount('accordion', {
      as: ForwardPart,
      ref: rootRef,
      onClick: rootClick,
      forceMount: true,
      children: () => (
        <Accordion.Item as={ForwardPart} ref={itemRef} onClick={itemClick} value="a">
          <Accordion.Trigger as={ForwardPart} ref={triggerRef} onClick={triggerClick}>
            a
          </Accordion.Trigger>
          <Accordion.Panel as={ForwardPart} ref={panelRef} onClick={panelClick}>
            a content
          </Accordion.Panel>
        </Accordion.Item>
      ),
    })
    expect(rootRef).toHaveBeenCalled()
    expect(itemRef).toHaveBeenCalled()
    expect(triggerRef).toHaveBeenCalled()
    expect(panelRef).toHaveBeenCalled()
    expect(m.container.querySelector('[data-orientation="vertical"]')).toBeTruthy()
    fireEvent.click(m.container.querySelector('[role="button"]')!)
    fireEvent.click(m.container.querySelector('[role="region"]')!)
    expect(rootClick).toHaveBeenCalled()
    expect(itemClick).toHaveBeenCalled()
    expect(triggerClick).toHaveBeenCalled()
    expect(panelClick).toHaveBeenCalled()
  })
})
