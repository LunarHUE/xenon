import { Dialog, RadioGroup, Tabs } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('tabs additional coverage', () => {
  spec('tabs.roles.4', () => {
    const m = mount('tabs', {
      children: () => (
        <>
          <h2 id="label">Sections</h2>
          <Tabs.List aria-labelledby="label">
            <Tabs.Tab value="a">A</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Content</Tabs.Panel>
        </>
      ),
    })
    expect(within(m.container).getByRole('tablist', { name: 'Sections' })).toHaveAttribute(
      'aria-labelledby',
      'label'
    )
  })

  spec('tabs.keyboard.12', async () => {
    const m = mount('tabs', {
      activationMode: 'automatic',
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
            <Tabs.Tab value="c">C</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
          <Tabs.Panel value="c">C</Tabs.Panel>
        </>
      ),
    })
    const tabs = within(m.container).getAllByRole('tab')
    tabs[0]!.focus()
    for (const [key, index] of [
      ['ArrowRight', 1],
      ['End', 2],
      ['Home', 0],
      ['ArrowLeft', 2],
    ] as const) {
      fireEvent.keyDown(document.activeElement!, { key })
      await m.settle()
      expect(tabs[index]).toHaveFocus()
      expect(tabs[index]).toHaveAttribute('aria-selected', 'true')
      expect(
        within(m.container).getByRole('tabpanel', { name: ['A', 'B', 'C'][index]! })
      ).toBeVisible()
    }
  })

  spec('tabs.keyboard.19', async () => {
    const listKey = vi.fn()
    const change = vi.fn()
    const m = mount('tabs', {
      onValueChange: change,
      children: () => (
        <>
          <Tabs.List aria-label="Sections" onKeyDown={listKey}>
            <span data-sentinel="true" tabindex={-1}>
              Sentinel
            </span>
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
        </>
      ),
    })
    const [first, second] = within(m.container).getAllByRole('tab')
    const sentinel = within(m.container).getByText('Sentinel')
    first!.focus()
    const composing = fireEvent.keyDown(first!, { key: 'ArrowRight', isComposing: true })
    await m.settle()
    expect(first).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'false')
    expect(composing).toBe(true)
    expect(listKey).toHaveBeenCalledTimes(1)
    expect(change).not.toHaveBeenCalled()

    sentinel.focus()
    const outsideTab = fireEvent.keyDown(sentinel, { key: 'ArrowRight' })
    await m.settle()
    expect(sentinel).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'false')
    expect(outsideTab).toBe(true)
    expect(listKey).toHaveBeenCalledTimes(2)
    expect(change).not.toHaveBeenCalled()
  })

  spec('tabs.focus.12', async () => {
    const m = mount('tabs', {
      value: 'a',
      activationMode: 'manual',
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
            <Tabs.Tab value="c">C</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
          <Tabs.Panel value="c">C</Tabs.Panel>
        </>
      ),
    })
    const tabs = within(m.container).getAllByRole('tab')
    tabs[1]!.focus()
    m.setProps({ value: 'c' })
    await m.settle()
    expect(tabs[1]).toHaveFocus()
    fireEvent.keyDown(tabs[1]!, { key: 'ArrowRight' })
    await m.settle()
    expect(tabs[2]).toHaveFocus()
  })

  spec('tabs.keyboard.21', async () => {
    const m = mount('tabs', {
      children: () => (
        <form>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">
            <RadioGroup aria-label="Choices">
              <RadioGroup.Item value="one" aria-label="One" />
              <RadioGroup.Item value="two" aria-label="Two" />
            </RadioGroup>
          </Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
        </form>
      ),
    })
    const tabs = within(m.container).getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(tabs[1]).toHaveFocus()
  })

  spec('tabs.keyboard.22', async () => {
    const m = mount('tabs', {
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">
            <Dialog defaultOpen modal={false}>
              <Dialog.Content aria-label="Dialog panel">Dialog</Dialog.Content>
            </Dialog>
          </Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
        </>
      ),
    })
    const tabs = within(m.container).getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(tabs[1]).toHaveFocus()
  })

  spec('tabs.focus.21', async () => {
    const m = mount('tabs', {
      children: () => (
        <>
          <input name="activeElement" />
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
        </>
      ),
    })
    const tabs = within(m.container).getAllByRole('tab')
    tabs[0]!.focus()
    fireEvent.keyDown(tabs[0]!, { key: 'ArrowRight' })
    await m.settle()
    expect(tabs[1]).toHaveFocus()
  })

  spec('tabs.state.9', async () => {
    const changed = vi.fn()
    const [disabled, setDisabled] = createSignal(false)
    const m = mount('tabs', {
      value: 'a',
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a" disabled={disabled()}>
              a
            </Tabs.Tab>
            <Tabs.Tab value="b">b</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">a content</Tabs.Panel>
          <Tabs.Panel value="b">b content</Tabs.Panel>
        </>
      ),
    })
    const original = within(m.container).getByRole('tab', { name: 'a' })
    setDisabled(true)
    await m.settle()
    expect(within(m.container).getByRole('tab', { name: 'a' })).toBe(original)
    expect(original).toHaveAttribute('aria-selected', 'true')
    expect(changed).not.toHaveBeenCalled()
  })

  spec('tabs.state.3', () => {
    const m = mount('tabs', {
      defaultValue: 'a',
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a" disabled>
              A
            </Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A</Tabs.Panel>
          <Tabs.Panel value="b">B</Tabs.Panel>
        </>
      ),
    })
    expect(within(m.container).getByRole('tab', { name: 'A' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(within(m.container).getByRole('tab', { name: 'B' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })

  spec('tabs.keyboard.18', async () => {
    const changed = vi.fn()
    const listKey = vi.fn()
    const m = mount('tabs', {
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections" onKeyDown={listKey}>
            <Tabs.Tab value="a">a</Tabs.Tab>
            <Tabs.Tab value="b">b</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">a content</Tabs.Panel>
          <Tabs.Panel value="b">b content</Tabs.Panel>
        </>
      ),
    })
    const [first, second] = within(m.container).getAllByRole('tab')
    first!.focus()
    fireEvent.keyDown(first!, { key: 'ArrowRight', ctrlKey: true })
    fireEvent.keyDown(first!, { key: 'ArrowRight', shiftKey: true })
    fireEvent.keyDown(first!, { key: 'ArrowRight', altKey: true })
    fireEvent.keyDown(first!, { key: 'ArrowRight', metaKey: true })
    await m.settle()
    expect(first).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'false')
    expect(changed).not.toHaveBeenCalled()
    expect(listKey).toHaveBeenCalledTimes(4)
    expect(
      listKey.mock.calls.map(([event]) => [
        event.ctrlKey,
        event.shiftKey,
        event.altKey,
        event.metaKey,
      ])
    ).toEqual([
      [true, false, false, false],
      [false, true, false, false],
      [false, false, true, false],
      [false, false, false, true],
    ])
  })
})
