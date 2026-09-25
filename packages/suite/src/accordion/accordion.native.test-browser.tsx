/**
 * Native-browser accordion keyboard cases that need real focus, real key input and
 * real Tab traversal: a header disabled after mount, author-canceled activation,
 * horizontal RTL boundaries, and focus around a retained hidden panel. Every
 * fixture renders through the shared Solid harness, so the assertions observe the
 * browser's own focus owner and native activation instead of dispatched events.
 * These cases supplement the registered spec assertions without claiming a new
 * research ID.
 */
import { Accordion } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

describe('accordion native keyboard', () => {
  test('arrow keys skip a trigger whose item is disabled after mount, and restore it on re-enable', async () => {
    const [disabled, setDisabled] = createSignal<string>()
    const m = mount('accordion', {
      children: () => (
        <For each={['a', 'b', 'c']}>
          {(value) => (
            <Accordion.Item value={value} disabled={value === disabled()}>
              <h3>
                <Accordion.Trigger>{value}</Accordion.Trigger>
              </h3>
              <Accordion.Panel>{`${value} content`}</Accordion.Panel>
            </Accordion.Item>
          )}
        </For>
      ),
    })
    const scope = within(m.container)
    const a = scope.getByRole('button', { name: 'a' })
    const b = scope.getByRole('button', { name: 'b' })
    const c = scope.getByRole('button', { name: 'c' })

    a.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(b).toHaveFocus()

    // Disabling the already registered middle item must rebuild the navigable list.
    setDisabled('b')
    await m.settle()
    expect(b).toBeDisabled()

    a.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(c).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(a).toHaveFocus()

    // Re-enabling the item puts it back into the keyboard destinations.
    setDisabled(undefined)
    await m.settle()
    expect(b).not.toBeDisabled()
    a.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(b).toHaveFocus()
  })

  test('a horizontal RTL accordion keeps Home/End order and wraps arrows at both ends', async () => {
    const m = mount('accordion', {
      orientation: 'horizontal',
      dir: 'rtl',
      children: () => (
        <For each={['a', 'b', 'c']}>
          {(value) => (
            <Accordion.Item value={value}>
              <h3>
                <Accordion.Trigger>{value}</Accordion.Trigger>
              </h3>
              <Accordion.Panel>{`${value} content`}</Accordion.Panel>
            </Accordion.Item>
          )}
        </For>
      ),
    })
    const scope = within(m.container)
    const a = scope.getByRole('button', { name: 'a' })
    const b = scope.getByRole('button', { name: 'b' })
    const c = scope.getByRole('button', { name: 'c' })

    // Home and End address the ends of the collection order, not the visual axis.
    b.focus()
    await userEvent.keyboard('{End}')
    expect(c).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(a).toHaveFocus()

    // RTL inverts the arrows, so ArrowLeft advances and ArrowRight retreats, and
    // the default loop wraps past the last and the first trigger.
    c.focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(a).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(c).toHaveFocus()
  })

  test('an author click veto cancels accordion activation from pointer and native Enter/Space', async () => {
    const changed = vi.fn()
    const veto = vi.fn((event: MouseEvent) => event.preventDefault())
    const m = mount('accordion', {
      onValueChange: changed,
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger onClick={veto}>a</Accordion.Trigger>
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

    await userEvent.click(a)
    await m.settle()
    expect(veto).toHaveBeenCalledOnce()
    expect(a).toHaveAttribute('aria-expanded', 'false')
    expect(scope.queryByText('a content')).toBeNull()

    // Native Enter and Space activate through a synthesized click on the button,
    // which the same veto cancels.
    a.focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    await m.settle()
    expect(veto).toHaveBeenCalledTimes(3)
    expect(a).toHaveAttribute('aria-expanded', 'false')
    expect(changed).not.toHaveBeenCalled()

    // The sibling without a veto still activates, so the fixture can open at all.
    await userEvent.click(b)
    await m.settle()
    expect(b).toHaveAttribute('aria-expanded', 'true')
    expect(scope.getByText('b content')).toBeVisible()
    expect(changed).toHaveBeenCalledExactlyOnceWith('b')
  })

  test('Tab order skips focusable content inside a retained hidden panel', async () => {
    const m = mount('accordion', {
      forceMount: true,
      defaultValue: 'a',
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger>a</Accordion.Trigger>
            <Accordion.Panel>
              <button type="button">Inside a</button>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
            <Accordion.Panel>
              <button type="button">Inside b</button>
            </Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    const scope = within(m.container)
    const a = scope.getByRole('button', { name: 'a' })
    const b = scope.getByRole('button', { name: 'b' })

    // The closed panel keeps its content in the DOM, but only hidden.
    expect(scope.queryByRole('button', { name: 'Inside b' })).toBeNull()
    expect(scope.getByText('Inside b').closest('[hidden]')).not.toBeNull()

    a.focus()
    await userEvent.tab()
    expect(scope.getByRole('button', { name: 'Inside a' })).toHaveFocus()
    await userEvent.tab()
    expect(b).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(scope.getByRole('button', { name: 'Inside a' })).toHaveFocus()
  })
})
