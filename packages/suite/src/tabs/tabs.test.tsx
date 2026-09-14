import { Tabs } from '@kit/solid'
import { fireEvent, within } from '@testing-library/dom'
import { createRoot, createSignal, For, Show } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <For each={['a', 'b', 'c']}>{(value) => <Tabs.Tab value={value}>{value}</Tabs.Tab>}</For>
        </Tabs.List>
        <For each={['c', 'a', 'b']}>
          {(value) => <Tabs.Panel value={value}>{value} content</Tabs.Panel>}
        </For>
      </>
    ),
    ...props,
  })
  return {
    ...m,
    tabs: within(m.container).getAllByRole('tab'),
    panel: (value: string) => within(m.container).getByText(`${value} content`),
  }
}

describe('tabs conformance', () => {
  spec('tabs.pointer.1', async () => {
    const m = fixture()
    fireEvent.click(m.tabs[1]!)
    await m.settle()
    expect(m.tabs.map((el) => el.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
    expect(m.panel('b')).toBeVisible()
    expect(m.panel('a')).toHaveAttribute('hidden')
    expect(m.tabs[1]).toHaveAttribute('aria-controls', m.panel('b').id)
    expect(m.panel('b')).toHaveAttribute('aria-labelledby', m.tabs[1]!.id)
  })
  spec('tabs.roles.14', () => {
    const m = fixture()
    expect(within(m.container).getByRole('tablist', { name: 'Sections' })).toContainElement(
      m.tabs[0]!
    )
    for (const [index, value] of ['a', 'b', 'c'].entries()) {
      expect(m.panel(value)).toHaveAttribute('role', 'tabpanel')
      expect(m.tabs[index]).toHaveAttribute('aria-controls', m.panel(value).id)
      expect(m.panel(value)).toHaveAttribute('aria-labelledby', m.tabs[index]!.id)
    }
  })
  spec('tabs.roles.9', async () => {
    const m = fixture()
    const list = within(m.container).getByRole('tablist')
    expect(list).not.toHaveAttribute('aria-orientation')
    m.setProps({ orientation: 'vertical' })
    await m.settle()
    expect(list).toHaveAttribute('aria-orientation', 'vertical')
  })
  spec('tabs.focus.3', () => {
    const m = fixture({ defaultValue: 'b' })
    expect(m.tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
  })
  spec('tabs.focus.5', async () => {
    const [show, setShow] = createSignal(false)
    const m = fixture({
      children: () => (
        <>
          <Tabs.List>
            <Tabs.Tab value="a">a</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">
            a content
            <Show when={show()}>
              <button>Action</button>
            </Show>
          </Tabs.Panel>
        </>
      ),
    })
    const panel = within(m.container).getByRole('tabpanel')
    expect(panel).toHaveAttribute('tabindex', '0')
    setShow(true)
    await m.settle()
    expect(panel).not.toHaveAttribute('tabindex')
    setShow(false)
    await m.settle()
    expect(panel).toHaveAttribute('tabindex', '0')
  })
  spec('tabs.focus.11', async () => {
    const m = fixture({ value: 'a' })
    m.setProps({ value: 'c' })
    await m.settle()
    expect(m.tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0'])
  })
  spec('tabs.focus.12', async () => {
    const m = fixture({ value: 'a', activationMode: 'manual' })
    m.tabs[1]!.focus()
    await m.settle()
    m.setProps({ value: 'c' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
    expect(m.tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(m.tabs[2]).toHaveAttribute('aria-selected', 'true')
    m.tabs[1]!.blur()
    await m.settle()
    expect(m.tabs.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0'])
  })
  spec('tabs.state.1', () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(m.panel('a')).toBeVisible()
    // Architecture explicitly forbids callbacks on mount.
    expect(changed).not.toHaveBeenCalled()
  })
  spec('tabs.state.2', () => {
    const m = fixture({
      children: () => (
        <>
          <Tabs.List>
            <Tabs.Tab value="a" disabled>
              a
            </Tabs.Tab>
            <Tabs.Tab value="b">b</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">a content</Tabs.Panel>
          <Tabs.Panel value="b">b content</Tabs.Panel>
        </>
      ),
    })
    expect(m.tabs[0]).toBeDisabled()
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'false')
    expect(m.tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(m.panel('b')).toBeVisible()
  })
  spec('tabs.state.3', () => {
    const m = fixture({
      value: 'a',
      children: () => (
        <>
          <Tabs.List>
            <Tabs.Tab value="a" disabled>
              a
            </Tabs.Tab>
            <Tabs.Tab value="b">b</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">a content</Tabs.Panel>
          <Tabs.Panel value="b">b content</Tabs.Panel>
        </>
      ),
    })
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(m.tabs[0]).toHaveAttribute('tabindex', '-1')
    expect(m.panel('a')).toBeVisible()
  })
  spec('tabs.state.11', async () => {
    const changed = vi.fn()
    const m = fixture({ value: 'a', onValueChange: changed })
    fireEvent.click(m.tabs[1]!)
    await m.settle()
    expect(changed.mock.calls).toEqual([['b']])
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(m.panel('b')).toHaveAttribute('hidden')
  })
  spec('tabs.state.13', async () => {
    const m = fixture({ defaultValue: 'b', value: 'a' })
    m.setProps({ value: undefined })
    await m.settle()
    expect(m.tabs[1]).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(m.tabs[2]!)
    await m.settle()
    expect(m.tabs[2]).toHaveAttribute('aria-selected', 'true')
    m.setProps({ value: 'a' })
    await m.settle()
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
  })
  spec('tabs.state.21', async () => {
    const m = fixture({
      children: () => (
        <>
          <Tabs.List>
            <Tabs.Tab value="a">a</Tabs.Tab>
            <Tabs.Tab value="b">b</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">
            <input aria-label="First" />
          </Tabs.Panel>
          <Tabs.Panel value="b">
            <input aria-label="Second" />
          </Tabs.Panel>
        </>
      ),
    })
    const first = within(m.container).getByLabelText('First') as HTMLInputElement
    const second = within(m.container).getByLabelText('Second') as HTMLInputElement
    fireEvent.input(first, { target: { value: 'saved' } })
    fireEvent.click(m.tabs[1]!)
    await m.settle()
    expect(second.value).toBe('')
    fireEvent.input(second, { target: { value: 'separate' } })
    fireEvent.click(m.tabs[0]!)
    await m.settle()
    expect(within(m.container).getByLabelText('First')).toBe(first)
    expect(first.value).toBe('saved')
    expect(second.value).toBe('separate')
  })
  spec('tabs.pointer.2', async () => {
    const m = fixture({ activationMode: 'manual' })
    fireEvent.click(m.tabs[1]!)
    await m.settle()
    expect(m.tabs[1]).toHaveAttribute('aria-selected', 'true')
  })
  spec('tabs.pointer.5', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    for (const options of [
      { button: 2 },
      { button: 1 },
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { shiftKey: true },
    ]) {
      fireEvent.click(m.tabs[1]!, options)
      await m.settle()
    }
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    event.preventDefault()
    m.tabs[1]!.dispatchEvent(event)
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
    expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
  })
  spec('tabs.pointer.8', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    fireEvent.click(m.tabs[0]!)
    await m.settle()
    expect(changed).not.toHaveBeenCalled()
  })
  spec('tabs.keyboard.12', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
    expect(m.tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(m.panel('b')).toBeVisible()
    expect(changed.mock.calls).toEqual([['b']])
  })
  spec('tabs.keyboard.13', async () => {
    const changed = vi.fn()
    const m = fixture({ activationMode: 'manual', onValueChange: changed })
    m.tabs[0]!.focus()
    await m.settle()
    for (const [key, index] of [
      ['ArrowRight', 1],
      ['End', 2],
      ['Home', 0],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key })
      await m.settle()
      expect(m.tabs[index]).toHaveFocus()
      expect(m.tabs[0]).toHaveAttribute('aria-selected', 'true')
    }
    expect(changed).not.toHaveBeenCalled()
  })
  spec('tabs.keyboard.16', async () => {
    const m = fixture({ loop: false, defaultValue: 'c' })
    m.tabs[2]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[2]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.tabs[2]).toHaveFocus()
    fireEvent.keyDown(m.tabs[2]!, { key: 'Home' })
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.keyboard.18', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    m.tabs[0]!.focus()
    await m.settle()
    for (const modifier of ['ctrlKey', 'shiftKey', 'metaKey', 'altKey']) {
      expect(fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowRight', [modifier]: true })).toBe(true)
      await m.settle()
      expect(m.tabs[0]).toHaveFocus()
    }
    expect(changed).not.toHaveBeenCalled()
  })

  spec('tabs.roles.1', () => {
    const m = fixture()
    expect(within(m.container).getByRole('tablist')).toBeInTheDocument()
  })
  spec('tabs.roles.2', () => {
    const m = fixture()
    for (const tab of m.tabs) expect(within(m.container).getByRole('tablist')).toContainElement(tab)
  })
  spec('tabs.roles.3', () => {
    const m = fixture()
    expect(within(m.container).getAllByRole('tabpanel', { hidden: true })).toHaveLength(3)
  })
  spec('tabs.roles.4', () => {
    const m = fixture()
    expect(within(m.container).getByRole('tablist')).toHaveAccessibleName('Sections')
  })
  spec('tabs.roles.5', () => {
    const m = fixture()
    for (const [i, value] of ['a', 'b', 'c'].entries())
      expect(m.tabs[i]).toHaveAttribute('aria-controls', m.panel(value).id)
  })
  spec('tabs.roles.6', () => {
    const m = fixture()
    for (const [i, value] of ['a', 'b', 'c'].entries())
      expect(m.panel(value)).toHaveAttribute('aria-labelledby', m.tabs[i]!.id)
  })
  spec('tabs.roles.7', () => {
    const m = fixture({ defaultValue: 'b' })
    expect(m.tabs.map((el) => el.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
  })
  spec('tabs.roles.13', () => {
    const m = fixture({
      children: () => (
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b" type="submit">
            b
          </Tabs.Tab>
          <Tabs.Tab value="c" as="div">
            c
          </Tabs.Tab>
        </Tabs.List>
      ),
    })
    expect(m.tabs[0]).toHaveAttribute('type', 'button')
    expect(m.tabs[1]).toHaveAttribute('type', 'submit')
    expect(m.tabs[2]).not.toHaveAttribute('type')
  })
  spec('tabs.keyboard.3', async () => {
    const m = fixture({ defaultValue: 'c' })
    m.tabs[2]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[2]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
  })
  spec('tabs.keyboard.4', async () => {
    const m = fixture()
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.tabs[2]).toHaveFocus()
    fireEvent.keyDown(m.tabs[2]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
  })
  spec('tabs.keyboard.5', async () => {
    const m = fixture({ orientation: 'vertical' })
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
    fireEvent.keyDown(m.tabs[1]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.keyboard.6', async () => {
    const m = fixture()
    m.tabs[0]!.focus()
    await m.settle()
    for (const key of ['ArrowUp', 'ArrowDown'])
      expect(fireEvent.keyDown(m.tabs[0]!, { key })).toBe(true)
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.keyboard.7', async () => {
    const m = fixture({ orientation: 'vertical' })
    m.tabs[0]!.focus()
    await m.settle()
    for (const key of ['ArrowLeft', 'ArrowRight'])
      expect(fireEvent.keyDown(m.tabs[0]!, { key })).toBe(true)
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.keyboard.9', async () => {
    const m = fixture({ defaultValue: 'b' })
    m.tabs[1]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[1]!, { key: 'Home' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.keyboard.10', async () => {
    const m = fixture()
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'End' })
    await m.settle()
    expect(m.tabs[2]).toHaveFocus()
  })
  spec('tabs.rtl.1', async () => {
    const m = fixture({ dir: 'rtl' })
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowLeft' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
    fireEvent.keyDown(m.tabs[1]!, { key: 'ArrowRight' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.rtl.2', async () => {
    const m = fixture({ dir: 'rtl', orientation: 'vertical' })
    m.tabs[0]!.focus()
    await m.settle()
    fireEvent.keyDown(m.tabs[0]!, { key: 'ArrowDown' })
    await m.settle()
    expect(m.tabs[1]).toHaveFocus()
    fireEvent.keyDown(m.tabs[1]!, { key: 'ArrowUp' })
    await m.settle()
    expect(m.tabs[0]).toHaveFocus()
  })
  spec('tabs.notes.8', () => {
    const m = mount('tabs', {})
    expect(m.container.firstElementChild).toBeInTheDocument()
  })
})

spec('tabs.roles.17', () => {
  const m = fixture({
    children: () => (
      <Tabs.List>
        <Tabs.Tab value="a">a</Tabs.Tab>
        <Tabs.Tab value="b">b</Tabs.Tab>
      </Tabs.List>
    ),
  })
  for (const tab of m.tabs) {
    expect(tab).toHaveAttribute('tabindex')
    expect(tab).toHaveAttribute('aria-selected')
    expect(tab.getAttribute('aria-controls')).toBeTruthy()
  }
})

spec('tabs.roles.21', async () => {
  const m = fixture({ disabled: true })
  for (const tab of m.tabs) {
    expect(tab).toBeDisabled()
    expect(tab).toHaveAttribute('data-disabled', '')
  }
  m.setProps({ disabled: false })
  await m.settle()
  for (const tab of m.tabs) {
    expect(tab).not.toBeDisabled()
    expect(tab).not.toHaveAttribute('data-disabled')
  }
})

spec('tabs.roles.28', () => {
  const m = fixture({
    children: () => (
      <Tabs.List>
        <Tabs.Tab
          value="a"
          aria-label="Named"
          aria-labelledby="label"
          aria-describedby="description"
          aria-details="details"
        >
          a
        </Tabs.Tab>
      </Tabs.List>
    ),
  })
  for (const [name, value] of [
    ['aria-label', 'Named'],
    ['aria-labelledby', 'label'],
    ['aria-describedby', 'description'],
    ['aria-details', 'details'],
  ])
    expect(m.tabs[0]).toHaveAttribute(name!, value!)
})

spec('tabs.state.7', async () => {
  const [shown, setShown] = createSignal(false)
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List>
          <Show when={shown()}>
            <Tabs.Tab value="a">a</Tabs.Tab>
          </Show>
        </Tabs.List>
        <Tabs.Panel value="a">content</Tabs.Panel>
      </>
    ),
  })
  expect(within(m.container).queryByRole('tab')).toBeNull()
  setShown(true)
  await m.settle()
  expect(within(m.container).getByRole('tab')).toHaveAttribute('aria-selected', 'true')
  expect(within(m.container).getByRole('tabpanel')).toBeVisible()
})

spec('tabs.state.14', async () => {
  const [shown, setShown] = createSignal(true)
  const m = fixture({
    value: 'b',
    children: () => (
      <>
        <Tabs.List>
          <Show when={shown()}>
            <Tabs.Tab value="a">a</Tabs.Tab>
          </Show>
          <Tabs.Tab value="b">b</Tabs.Tab>
          <Tabs.Tab value="c">c</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="b">b content</Tabs.Panel>
      </>
    ),
  })
  setShown(false)
  await m.settle()
  const scope = within(m.container)
  const selected = scope.getByRole('tab', { name: 'b' })
  expect(selected).toHaveAttribute('aria-selected', 'true')
  selected.focus()
  await m.settle()
  fireEvent.keyDown(selected, { key: 'ArrowRight' })
  await m.settle()
  expect(scope.getByRole('tab', { name: 'c' })).toHaveFocus()
  expect(selected).toHaveAttribute('aria-selected', 'true')
  setShown(true)
  await m.settle()
  expect(scope.getByRole('tab', { name: 'a' })).toHaveAttribute('aria-selected', 'false')
})

spec('tabs.notes.3', async () => {
  const ref = vi.fn()
  const author = vi.fn()
  const m = fixture({
    'data-author': 'root',
    children: () => (
      <>
        <Tabs.List data-author="list">
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b" ref={ref} data-author="tab" onClick={author}>
            b
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="b" data-author="panel">
          b content
        </Tabs.Panel>
      </>
    ),
  })
  expect(ref).toHaveBeenCalledWith(m.tabs[1])
  expect(m.container.firstElementChild).toHaveAttribute('data-author', 'root')
  expect(m.tabs[1]).toHaveAttribute('data-author', 'tab')
  expect(m.panel('b')).toHaveAttribute('data-author', 'panel')
  fireEvent.click(m.tabs[1]!)
  await m.settle()
  expect(author).toHaveBeenCalledOnce()
  expect(m.tabs[1]).toHaveAttribute('aria-selected', 'true')
})

spec('tabs.notes.4', () => {
  const m = fixture({
    as: 'section',
    children: () => (
      <>
        <Tabs.List as="nav">
          <Tabs.Tab as="div" value="a">
            a
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel as="article" value="a">
          a content
        </Tabs.Panel>
      </>
    ),
  })
  expect(m.container.firstElementChild!.tagName).toBe('SECTION')
  expect(within(m.container).getByRole('tablist').tagName).toBe('NAV')
  expect(m.tabs[0]!.tagName).toBe('DIV')
  expect(m.tabs[0]).toHaveAttribute('aria-controls', m.panel('a').id)
  expect(m.panel('a').tagName).toBe('ARTICLE')
})

spec('tabs.notes.6', () => {
  expect(() =>
    createRoot((dispose) => {
      try {
        return Tabs.List({})
      } finally {
        dispose()
      }
    })
  ).toThrow(/Tabs/)
  expect(() =>
    createRoot((dispose) => {
      try {
        return Tabs.Tab({ value: 'a' })
      } finally {
        dispose()
      }
    })
  ).toThrow(/Tabs/)
  expect(() =>
    createRoot((dispose) => {
      try {
        return Tabs.Panel({ value: 'a' })
      } finally {
        dispose()
      }
    })
  ).toThrow(/Tabs/)
})
