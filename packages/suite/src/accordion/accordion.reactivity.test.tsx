/**
 * Reactive accordion state cases observable in both the jsdom and browser projects:
 * single versus multiple selection transitions, controlled rejection and release,
 * keyed item removal with its ID associations, and the lazy/forceMount mounting
 * policy. Every interaction is a synthetic `fireEvent` dispatch, so these cases
 * never claim OS or native input timing.
 */
import { Accordion } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('accordion', {
    children: () => (
      <>
        <For each={['a', 'b', 'c']}>
          {(value) => (
            <Accordion.Item value={value}>
              <h3>
                <Accordion.Trigger>{value}</Accordion.Trigger>
              </h3>
              <Accordion.Panel>{value} content</Accordion.Panel>
            </Accordion.Item>
          )}
        </For>
      </>
    ),
    ...props,
  })
  return { ...m, triggers: within(m.container).getAllByRole('button') }
}

describe('accordion reactive state', () => {
  // Only the item, trigger and panel expose open state; the group root carries
  // orientation alone because its items open independently.
  spec('accordion.roles.21', async () => {
    const m = mount('accordion', {
      mode: 'multiple',
      forceMount: true,
      children: () => (
        <>
          <Accordion.Item value="a">
            <h3>
              <Accordion.Trigger>a</Accordion.Trigger>
            </h3>
            <Accordion.Panel>a content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <h3>
              <Accordion.Trigger>b</Accordion.Trigger>
            </h3>
            <Accordion.Panel>b content</Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    const scope = within(m.container)
    const aTrigger = scope.getByRole('button', { name: 'a' })
    const bTrigger = scope.getByRole('button', { name: 'b' })
    const aItem = aTrigger.closest('h3')!.parentElement!
    const aPanel = scope.getByText('a content')

    for (const part of [aTrigger, aItem, aPanel, m.container.firstElementChild!])
      expect(part).toHaveAttribute('data-orientation', 'vertical')
    for (const part of [aTrigger, aItem, aPanel])
      expect(part).toHaveAttribute('data-state', 'closed')

    fireEvent.click(aTrigger)
    await m.settle()
    for (const part of [aTrigger, aItem, aPanel]) expect(part).toHaveAttribute('data-state', 'open')
    // The sibling keeps its own state, so multiple mode is not one group state.
    expect(bTrigger).toHaveAttribute('data-state', 'closed')
    expect(bTrigger.closest('h3')!.parentElement!).toHaveAttribute('data-state', 'closed')
    expect(scope.getByText('b content')).toHaveAttribute('data-state', 'closed')

    fireEvent.click(bTrigger)
    await m.settle()
    expect(aTrigger).toHaveAttribute('data-state', 'open')
    expect(bTrigger).toHaveAttribute('data-state', 'open')
    expect(scope.getByText('a content')).not.toHaveAttribute('hidden')
    expect(scope.getByText('b content')).not.toHaveAttribute('hidden')

    m.setProps({ orientation: 'horizontal' })
    await m.settle()
    for (const part of [aTrigger, aItem, aPanel, m.container.firstElementChild!])
      expect(part).toHaveAttribute('data-orientation', 'horizontal')
  })

  test('a controlled multiple accordion holds state until the parent commits the reported array', async () => {
    const changed = vi.fn()
    const m = mount('accordion', {
      mode: 'multiple',
      value: ['a'],
      onValueChange: changed,
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
    const aTrigger = scope.getByRole('button', { name: 'a' })
    const bTrigger = scope.getByRole('button', { name: 'b' })
    expect(aTrigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(bTrigger)
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
    expect(bTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(scope.queryByText('b content')).toBeNull()
    expect(aTrigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(aTrigger)
    await m.settle()
    expect(changed.mock.calls).toEqual([[['a', 'b']], [[]]])
    expect(aTrigger).toHaveAttribute('aria-expanded', 'true')

    m.setProps({ value: ['a', 'b'] })
    await m.settle()
    expect(changed).toHaveBeenCalledTimes(2)
    expect(aTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(bTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(scope.getByText('b content')).toBeVisible()
  })

  test('clearing the controlled value releases the accordion to its internal selection', async () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'a', onValueChange: changed })
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
    expect(changed.mock.calls).toEqual([['b']])

    m.setProps({ value: 'a' })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
    expect(changed).toHaveBeenCalledOnce()

    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(changed.mock.calls).toEqual([['b'], ['b']])
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')

    // An undefined value hands the decision back to the state last reached while
    // the accordion was uncontrolled, not to the rejected proposal.
    m.setProps({ value: undefined })
    await m.settle()
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
    expect(changed.mock.calls).toEqual([['b'], ['b'], ['a']])
  })

  test('removing an open item from a keyed list drops its parts and keeps the rest paired and navigable', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const changed = vi.fn()
    const m = mount('accordion', {
      defaultValue: 'b',
      forceMount: true,
      onValueChange: changed,
      children: () => (
        <For each={items()}>
          {(value) => (
            <Accordion.Item value={value}>
              <Accordion.Trigger>{value}</Accordion.Trigger>
              <Accordion.Panel>{value} content</Accordion.Panel>
            </Accordion.Item>
          )}
        </For>
      ),
    })
    const scope = within(m.container)
    const bTrigger = scope.getByRole('button', { name: 'b' })
    const bPanel = scope.getByRole('region', { name: 'b' })
    expect(bTrigger).toHaveAttribute('aria-controls', bPanel.id)
    expect(bPanel).toHaveAttribute('aria-labelledby', bTrigger.id)

    setItems(['a', 'c'])
    await m.settle()
    expect(scope.queryByRole('button', { name: 'b' })).toBeNull()
    expect(scope.queryByText('b content')).toBeNull()
    expect(changed).not.toHaveBeenCalled()

    // The surviving items keep their own generated pair intact.
    const aTrigger = scope.getByRole('button', { name: 'a' })
    const cTrigger = scope.getByRole('button', { name: 'c' })
    const aPanel = scope.getByText('a content')
    const cPanel = scope.getByText('c content')
    expect(aTrigger).toHaveAttribute('aria-controls', aPanel.id)
    expect(aPanel).toHaveAttribute('aria-labelledby', aTrigger.id)
    expect(cTrigger).toHaveAttribute('aria-controls', cPanel.id)
    expect(cPanel).toHaveAttribute('aria-labelledby', cTrigger.id)

    // Arrow destinations follow the shortened, re-registered collection.
    aTrigger.focus()
    await m.settle()
    fireEvent.keyDown(aTrigger, { key: 'ArrowDown' })
    await m.settle()
    expect(cTrigger).toHaveFocus()
    fireEvent.keyDown(cTrigger, { key: 'ArrowUp' })
    await m.settle()
    expect(aTrigger).toHaveFocus()
    expect(changed).not.toHaveBeenCalled()
  })

  test('panel mounting follows forceMount reactively, with an item override outranking the root', async () => {
    const [itemForce, setItemForce] = createSignal(false)
    const m = mount('accordion', {
      children: () => (
        <>
          <Accordion.Item value="a" forceMount={itemForce()}>
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
    // Closed panels are lazy: absent until an open or a force mount keeps them.
    expect(scope.queryByText('a content')).toBeNull()
    expect(scope.queryByText('b content')).toBeNull()

    setItemForce(true)
    await m.settle()
    expect(scope.getByText('a content')).toHaveAttribute('hidden')
    expect(scope.getByText('a content')).toHaveAttribute('data-state', 'closed')
    expect(scope.queryByText('b content')).toBeNull()

    m.setProps({ forceMount: true })
    await m.settle()
    expect(scope.getByText('a content')).toHaveAttribute('hidden')
    expect(scope.getByText('b content')).toHaveAttribute('hidden')

    // An explicit item-level false outranks the root policy that is now on.
    setItemForce(false)
    await m.settle()
    expect(scope.queryByText('a content')).toBeNull()
    expect(scope.getByText('b content')).toHaveAttribute('hidden')

    m.setProps({ forceMount: false })
    await m.settle()
    expect(scope.queryByText('a content')).toBeNull()
    expect(scope.queryByText('b content')).toBeNull()
  })

  test('changing defaultValue after mount does not move the uncontrolled selection', async () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'a', onValueChange: changed })
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')

    m.setProps({ defaultValue: 'b' })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
    expect(changed).not.toHaveBeenCalled()

    fireEvent.click(m.triggers[2]!)
    await m.settle()
    expect(m.triggers[2]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')

    m.setProps({ defaultValue: 'a' })
    await m.settle()
    expect(m.triggers[2]).toHaveAttribute('aria-expanded', 'true')
    expect(changed.mock.calls).toEqual([['c']])
  })

  test('a lazy panel association is advertised before the panel exists and survives open and close', async () => {
    const m = mount('accordion', {
      collapsible: true,
      children: () => (
        <Accordion.Item value="a">
          <Accordion.Trigger>a</Accordion.Trigger>
          <Accordion.Panel>a content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    const trigger = within(m.container).getByRole('button', { name: 'a' })
    const contentId = trigger.getAttribute('aria-controls')
    if (contentId === null) throw new Error('expected a panel association')
    // The association is authored before the panel is ever mounted.
    expect(document.getElementById(contentId)).toBeNull()

    fireEvent.click(trigger)
    await m.settle()
    const panel = document.getElementById(contentId)
    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('role', 'region')
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id)

    fireEvent.click(trigger)
    await m.settle()
    expect(trigger).toHaveAttribute('aria-controls', contentId)
    expect(document.getElementById(contentId)).toBeNull()

    // The same id returns rather than a fresh id for the remount.
    fireEvent.click(trigger)
    await m.settle()
    const reopened = document.getElementById(contentId)
    expect(reopened).not.toBeNull()
    expect(reopened).toHaveAttribute('aria-labelledby', trigger.id)
  })
})
