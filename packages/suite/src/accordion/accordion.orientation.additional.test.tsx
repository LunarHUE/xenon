import { Accordion } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test } from 'vitest'

import { mount } from '../harness/solid'

describe('accordion orientation reactivity', () => {
  test('changing orientation while focused switches navigation axis', async () => {
    const m = mount('accordion', {
      orientation: 'vertical',
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger>a</Accordion.Trigger>
            <Accordion.Panel>a content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
            <Accordion.Panel>b content</Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    const scope = within(m.container)
    const a = scope.getByRole('button', { name: 'a' })
    const b = scope.getByRole('button', { name: 'b' })
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowRight' })
    await m.settle()
    expect(a).toHaveFocus()
    m.setProps({ orientation: 'horizontal' })
    await m.settle()
    fireEvent.keyDown(a, { key: 'ArrowRight' })
    await m.settle()
    expect(b).toHaveFocus()
    fireEvent.keyDown(b, { key: 'ArrowDown' })
    await m.settle()
    expect(b).toHaveFocus()
  })

  test('a prevented navigation event remains cancelled after orientation changes', async () => {
    const m = mount('accordion', {
      orientation: 'horizontal',
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger onKeyDown={(event) => event.preventDefault()}>a</Accordion.Trigger>
            <Accordion.Panel>a content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
            <Accordion.Panel>b content</Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    const scope = within(m.container)
    const a = scope.getByRole('button', { name: 'a' })
    const b = scope.getByRole('button', { name: 'b' })
    a.focus()
    fireEvent.keyDown(a, { key: 'ArrowRight' })
    await m.settle()
    expect(a).toHaveFocus()
    m.setProps({ orientation: 'vertical' })
    await m.settle()
    fireEvent.keyDown(a, { key: 'ArrowDown' })
    await m.settle()
    expect(a).toHaveFocus()
    expect(b).not.toHaveFocus()
  })
})
