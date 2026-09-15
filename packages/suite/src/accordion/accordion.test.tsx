import { Accordion } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { createRoot, createSignal, For, Show } from 'solid-js'
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

describe('accordion conformance', () => {
  spec('accordion.state.6', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    fireEvent.click(m.triggers[1]!)
    await m.settle()
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(changed.mock.calls).toEqual([['b'], ['a']])
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
    m.unmount()
    changed.mockClear()
    const multiple = fixture({ mode: 'multiple', onValueChange: changed })
    fireEvent.click(multiple.triggers[1]!)
    await multiple.settle()
    fireEvent.click(multiple.triggers[0]!)
    await multiple.settle()
    expect(changed.mock.calls).toEqual([[['b']], [['b', 'a']]])
  })
  spec('accordion.roles.13', async () => {
    const [ids, setIds] = createSignal<{ trigger?: string; panel?: string }>({
      trigger: 'author-trigger',
      panel: 'author-panel',
    })
    const m = fixture({
      defaultValue: 'a',
      children: () => (
        <Accordion.Item value="a">
          <Accordion.Trigger id={ids().trigger}>a</Accordion.Trigger>
          <Accordion.Panel id={ids().panel}>content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    const panel = within(m.container).getByRole('region')
    expect(m.triggers[0]).toHaveAttribute('aria-controls', 'author-panel')
    expect(panel).toHaveAttribute('aria-labelledby', 'author-trigger')
    setIds({ trigger: 'next-trigger', panel: 'next-panel' })
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-controls', 'next-panel')
    expect(panel).toHaveAttribute('aria-labelledby', 'next-trigger')
    setIds({})
    await m.settle()
    expect(panel.id).toBeTruthy()
    expect(m.triggers[0]!.id).toBeTruthy()
    expect(m.triggers[0]).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', m.triggers[0]!.id)
  })

  spec('accordion.roles.11', () => {
    const m = fixture({ defaultValue: 'b' })
    const panel = within(m.container).getByRole('region', { name: 'b' })
    expect(m.triggers[1]).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', m.triggers[1]!.id)
  })
  spec('accordion.roles.12', () => {
    const m = fixture({ defaultValue: 'a', region: false })
    const panel = within(m.container).getByText('a content')
    expect(panel).not.toHaveAttribute('role')
    expect(panel).not.toHaveAttribute('aria-labelledby')
  })
  spec('accordion.roles.17', () => {
    const m = fixture({ disabled: true, forceMount: true })
    for (const trigger of m.triggers) {
      expect(trigger).toBeDisabled()
      expect(trigger).toHaveAttribute('data-disabled', '')
      expect(trigger.closest('h3')!.parentElement).toHaveAttribute('data-disabled', '')
    }
    for (const panel of within(m.container).getAllByRole('region', { hidden: true }))
      expect(panel).toHaveAttribute('data-disabled', '')
  })
  spec('accordion.roles.18', () => {
    const m = fixture({
      children: () => (
        <>
          <Accordion.Item value="a" disabled forceMount>
            <Accordion.Trigger>a</Accordion.Trigger>
            <Accordion.Panel>a content</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
          </Accordion.Item>
        </>
      ),
    })
    expect(m.triggers[0]).toBeDisabled()
    expect(m.triggers[0]).toHaveAttribute('data-disabled', '')
    expect(within(m.container).getByText('a content')).toHaveAttribute('data-disabled', '')
    expect(m.triggers[1]).not.toBeDisabled()
    expect(m.triggers[1]).not.toHaveAttribute('data-disabled')
  })
  spec('accordion.state.7', async () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'a', onValueChange: changed })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[0]).not.toHaveAttribute('aria-disabled')
    expect(changed).not.toHaveBeenCalled()
  })
  spec('accordion.state.8', async () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'a', collapsible: true, onValueChange: changed })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    // Architecture uses undefined for an empty single selection.
    expect(changed.mock.calls).toEqual([[undefined], ['a']])
  })
  spec('accordion.state.11', async () => {
    const changed = vi.fn()
    const m = fixture({ mode: 'multiple', defaultValue: ['a', 'b'], onValueChange: changed })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(changed.mock.calls).toEqual([[['b']], [[]]])
    expect(within(m.container).queryByRole('region')).toBeNull()
  })
  spec('accordion.state.12', async () => {
    const changed = vi.fn()
    const m = fixture({ value: 'a', onValueChange: changed })
    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(changed.mock.calls).toEqual([['b']])
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(m.triggers[1]).toHaveAttribute('aria-expanded', 'false')
  })
  spec('accordion.state.15', () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'b', onValueChange: changed })
    expect(m.triggers.map((el) => el.getAttribute('aria-expanded'))).toEqual([
      'false',
      'true',
      'false',
    ])
    expect(changed).not.toHaveBeenCalled()
  })
  spec('accordion.state.16', async () => {
    const changed = vi.fn()
    const m = fixture({ value: 'a', onValueChange: changed })
    m.setProps({ value: 'c' })
    await m.settle()
    expect(m.triggers.map((el) => el.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'true',
    ])
    expect(changed).not.toHaveBeenCalled()
  })
  spec('accordion.keyboard.6', async () => {
    const m = fixture()
    m.triggers[0]!.focus()
    await m.settle()
    expect(fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowDown' })).toBe(false)
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
    fireEvent.keyDown(m.triggers[1]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
    expect(within(m.container).queryByRole('region')).toBeNull()
  })
  spec('accordion.keyboard.7', async () => {
    const m = fixture()
    m.triggers[0]!.focus()
    await m.settle()
    for (const key of ['ArrowLeft', 'ArrowRight']) {
      expect(fireEvent.keyDown(m.triggers[0]!, { key })).toBe(true)
      await m.settle()
      expect(m.triggers[0]).toHaveFocus()
    }
  })
  spec('accordion.keyboard.9', async () => {
    for (const orientation of ['horizontal', 'vertical']) {
      const m = fixture({ orientation })
      m.triggers[1]!.focus()
      await m.settle()
      fireEvent.keyDown(m.triggers[1]!, { key: 'End' })
      await m.settle()
      expect(m.triggers[2]).toHaveFocus()
      fireEvent.keyDown(m.triggers[2]!, { key: 'Home' })
      await m.settle()
      expect(m.triggers[0]).toHaveFocus()
      m.unmount()
    }
  })
  spec('accordion.keyboard.10', async () => {
    const m = fixture()
    m.triggers[2]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[2]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.triggers[2]).toHaveFocus()
  })
  spec('accordion.keyboard.11', async () => {
    const m = fixture({ loop: false })
    m.triggers[2]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[2]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.triggers[2]).toHaveFocus()
    fireEvent.keyDown(m.triggers[2]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
  })
  spec('accordion.keyboard.12', async () => {
    const m = fixture({
      children: () => (
        <>
          <For each={['a', 'b', 'c']}>
            {(value) => (
              <Accordion.Item value={value} disabled={value === 'b'}>
                <Accordion.Trigger>{value}</Accordion.Trigger>
              </Accordion.Item>
            )}
          </For>
        </>
      ),
    })
    m.triggers[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.triggers[2]).toHaveFocus()
    fireEvent.keyDown(m.triggers[2]!, { key: 'Home' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
    fireEvent.keyDown(m.triggers[0]!, { key: 'End' })
    await m.settle()
    expect(m.triggers[2]).toHaveFocus()
  })
  spec('accordion.rtl.1', async () => {
    const m = fixture({ orientation: 'horizontal', dir: 'rtl' })
    m.triggers[1]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[1]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
  })

  spec('accordion.roles.1', () => {
    const m = fixture()
    for (const trigger of m.triggers) {
      expect(trigger.tagName).toBe('BUTTON')
      expect(trigger).toHaveAttribute('type', 'button')
    }
  })
  spec('accordion.roles.2', async () => {
    const m = fixture({ collapsible: true })
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'false')
  })
  spec('accordion.roles.3', () => {
    const m = fixture({ forceMount: true })
    for (const trigger of m.triggers)
      expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toHaveAttribute(
        'role',
        'region'
      )
  })
  spec('accordion.roles.4', () => {
    const m = fixture({ defaultValue: 'c' })
    expect(m.triggers.map((el) => el.getAttribute('aria-expanded'))).toEqual([
      'false',
      'false',
      'true',
    ])
  })
  spec('accordion.roles.5', () => {
    const m = fixture()
    for (const heading of within(m.container).getAllByRole('heading', { level: 3 }))
      expect(within(heading).getByRole('button')).toBeInTheDocument()
  })
  spec('accordion.roles.6', () => {
    const m = fixture()
    for (const heading of within(m.container).getAllByRole('heading')) {
      expect(heading.childElementCount).toBe(1)
      expect(heading.firstElementChild).toHaveAttribute('type', 'button')
    }
  })
  spec('accordion.roles.19', () => {
    const m = fixture()
    for (const trigger of m.triggers)
      for (const name of ['disabled', 'aria-disabled', 'data-disabled'])
        expect(trigger).not.toHaveAttribute(name)
  })
  spec('accordion.keyboard.8', async () => {
    const m = fixture({ orientation: 'horizontal' })
    m.triggers[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
    for (const key of ['ArrowUp', 'ArrowDown'])
      expect(fireEvent.keyDown(m.triggers[1]!, { key })).toBe(true)
    fireEvent.keyDown(m.triggers[1]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
  })
  spec('accordion.keyboard.13', async () => {
    const author = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const m = fixture({
      children: () => (
        <>
          <Accordion.Item value="a">
            <Accordion.Trigger onKeyDown={author}>a</Accordion.Trigger>
          </Accordion.Item>
          <Accordion.Item value="b">
            <Accordion.Trigger>b</Accordion.Trigger>
          </Accordion.Item>
        </>
      ),
    })
    m.triggers[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(author).toHaveBeenCalledOnce()
    expect(m.triggers[0]).toHaveFocus()
  })
  spec('accordion.pointer.2', async () => {
    const m = fixture({ defaultValue: 'a' })
    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(within(m.container).getByText('b content')).toBeVisible()
    expect(within(m.container).queryByText('a content')).toBeNull()
  })
  spec('accordion.pointer.3', async () => {
    const m = fixture({ mode: 'multiple', defaultValue: ['a'] })
    fireEvent.click(m.triggers[1]!)
    await m.settle()
    expect(within(m.container).getByText('a content')).toBeVisible()
    expect(within(m.container).getByText('b content')).toBeVisible()
  })
  spec('accordion.pointer.4', async () => {
    const m = fixture({ mode: 'multiple', defaultValue: ['a'], collapsible: false })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(within(m.container).queryByText('a content')).toBeNull()
  })
  spec('accordion.pointer.5', async () => {
    const changed = vi.fn()
    const m = fixture({ disabled: true, onValueChange: changed })
    for (const trigger of m.triggers) fireEvent.click(trigger)
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(within(m.container).queryByRole('region')).toBeNull()
  })
  spec('accordion.pointer.9', async () => {
    const changed = vi.fn()
    const author = vi.fn(() => expect(changed).not.toHaveBeenCalled())
    const m = fixture({
      onValueChange: changed,
      children: () => (
        <Accordion.Item value="a">
          <Accordion.Trigger onClick={author}>a</Accordion.Trigger>
          <Accordion.Panel>content</Accordion.Panel>
        </Accordion.Item>
      ),
    })
    fireEvent.click(m.triggers[0]!)
    await m.settle()
    expect(author).toHaveBeenCalledOnce()
    expect(changed.mock.calls).toEqual([['a']])
  })
  spec('accordion.animation.2', () => {
    const m = fixture({ forceMount: true, defaultValue: 'b' })
    const scope = within(m.container)
    expect(scope.getByText('a content')).toHaveAttribute('hidden')
    expect(scope.getByText('b content')).not.toHaveAttribute('hidden')
    expect(scope.getByText('c content')).toHaveAttribute('hidden')
  })
  spec('accordion.rtl.2', async () => {
    const m = fixture({ dir: 'rtl' })
    m.triggers[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.triggers[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.triggers[1]).toHaveFocus()
    for (const key of ['ArrowLeft', 'ArrowRight'])
      expect(fireEvent.keyDown(m.triggers[1]!, { key })).toBe(true)
    fireEvent.keyDown(m.triggers[1]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.triggers[0]).toHaveFocus()
  })
})

spec('accordion.notes.2', () => {
  expect(() =>
    createRoot((dispose) => {
      try {
        return Accordion.Item({ value: 'a' })
      } finally {
        dispose()
      }
    })
  ).toThrow(/Accordion/)
  expect(() =>
    createRoot((dispose) => {
      try {
        return Accordion.Trigger({ value: 'a' })
      } finally {
        dispose()
      }
    })
  ).toThrow(/Accordion/)
  expect(() =>
    createRoot((dispose) => {
      try {
        return Accordion.Panel({})
      } finally {
        dispose()
      }
    })
  ).toThrow(/Accordion/)
})

spec('accordion.focus.4', async () => {
  const [first, setFirst] = createSignal(false)
  const m = mount('accordion', {
    children: () => (
      <>
        <Show when={first()}>
          <Accordion.Item value="a">
            <Accordion.Trigger>a</Accordion.Trigger>
          </Accordion.Item>
        </Show>
        <Accordion.Item value="b">
          <Accordion.Trigger>b</Accordion.Trigger>
        </Accordion.Item>
        <Accordion.Item value="c">
          <Accordion.Trigger>c</Accordion.Trigger>
        </Accordion.Item>
      </>
    ),
  })
  setFirst(true)
  await m.settle()
  const scope = within(m.container)
  const a = scope.getByRole('button', { name: 'a' })
  const b = scope.getByRole('button', { name: 'b' })
  b.focus()
  await m.settle()
  fireEvent.keyDown(b, { key: 'Home' })
  await m.settle()
  expect(a).toHaveFocus()
  fireEvent.keyDown(a, { key: 'ArrowDown' })
  await m.settle()
  expect(b).toHaveFocus()
})

spec('accordion.pointer.1', async () => {
  const m = fixture({ collapsible: true })
  fireEvent.click(m.triggers[0]!)
  await m.settle()
  expect(within(m.container).getByText('a content')).toBeVisible()
  fireEvent.click(m.triggers[0]!)
  await m.settle()
  expect(within(m.container).queryByText('a content')).toBeNull()
})

spec('accordion.state.5', async () => {
  const changed = vi.fn()
  const m = fixture({ value: 'a', onValueChange: changed })
  fireEvent.click(m.triggers[0]!)
  await m.settle()
  expect(changed).not.toHaveBeenCalled()
  expect(m.triggers[0]).toHaveAttribute('aria-expanded', 'true')
})

spec('accordion.notes.1', () => {
  const ref = vi.fn()
  const m = mount('accordion', {
    as: 'section',
    defaultValue: 'a',
    children: () => (
      <Accordion.Item as="article" value="a" data-author="item">
        <Accordion.Trigger as="div" ref={ref} data-author="trigger">
          Section
        </Accordion.Trigger>
        <Accordion.Panel as="section" data-author="panel">
          Content
        </Accordion.Panel>
      </Accordion.Item>
    ),
  })
  const trigger = within(m.container).getByRole('button')
  const panel = within(m.container).getByRole('region')
  expect(m.container.firstElementChild!.tagName).toBe('SECTION')
  expect(trigger.parentElement!.tagName).toBe('ARTICLE')
  expect(trigger).toHaveAttribute('data-author', 'trigger')
  expect(panel).toHaveAttribute('data-author', 'panel')
  expect(panel.tagName).toBe('SECTION')
  expect(ref).toHaveBeenCalledWith(trigger)
  expect(trigger).toHaveAttribute('aria-controls', panel.id)
  expect(panel).toHaveAttribute('aria-labelledby', trigger.id)
})

spec('accordion.notes.5', async () => {
  const [items, setItems] = createSignal(['a'])
  const m = mount('accordion', {
    collapsible: true,
    children: () => (
      <For each={items()}>
        {(value) => (
          <Accordion.Item value={value}>
            <Accordion.Trigger>{value}</Accordion.Trigger>
            <Accordion.Panel>
              <p>{value} first</p>
              <p>{value} second</p>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </For>
    ),
  })
  setItems(['a', 'b'])
  await m.settle()
  fireEvent.click(within(m.container).getByRole('button', { name: 'b' }))
  await m.settle()
  expect(within(m.container).getByText('b first')).toBeVisible()
  expect(within(m.container).getByText('b second')).toBeVisible()
  setItems(['b'])
  await m.settle()
  expect(within(m.container).queryByRole('button', { name: 'a' })).toBeNull()
  expect(within(m.container).getByText('b first')).toBeVisible()
})

test('item forceMount hides closed content independently of the root', async () => {
  const m = mount('accordion', {
    children: () => (
      <Accordion.Item value="a" forceMount>
        <Accordion.Trigger>a</Accordion.Trigger>
        <Accordion.Panel>Retained</Accordion.Panel>
      </Accordion.Item>
    ),
  })
  const panel = within(m.container).getByText('Retained')
  expect(panel).toHaveAttribute('hidden')
  m.setProps({ value: 'a' })
  await m.settle()
  expect(panel).not.toHaveAttribute('hidden')
})
