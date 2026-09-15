import { Listbox, Tabs } from '@xenon/solid'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { spec } from '../spec'
import { mount as harnessMount } from '../harness/solid'

function mount() {
  const container = document.createElement('div')
  document.body.append(container)
  const change = vi.fn()
  const dispose = render(
    () => (
      <>
        <Listbox aria-label="Fruit" onValueChange={change}>
          <Listbox.Item value="apple">Apple</Listbox.Item>
          <Listbox.Item value="pear">Pear</Listbox.Item>
        </Listbox>
        <button type="button">Outside</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, change, view: within(container) }
}

describe('selection coverage', () => {
  spec('selection.roles.4', () => {
    const mounted = mount()
    const apple = mounted.view.getByRole('option', { name: 'Apple' })
    const outside = mounted.view.getByRole('button', { name: 'Outside' })

    fireEvent.click(apple)
    flush()
    expect(apple).toHaveAttribute('aria-selected', 'true')
    outside.focus()
    expect(outside).toHaveFocus()
    expect(apple).toHaveAttribute('aria-selected', 'true')
  })

  spec('selection.keyboard.11', () => {
    const mounted = mount()
    const apple = mounted.view.getByRole('option', { name: 'Apple' })

    fireEvent.click(apple)
    flush()
    expect(mounted.change).toHaveBeenCalledExactlyOnceWith('apple')
    apple.focus()
    fireEvent.keyDown(apple, { key: 'Enter' })
    fireEvent.keyDown(apple, { key: ' ' })
    flush()
    expect(apple).toHaveAttribute('aria-selected', 'true')
    expect(mounted.change).toHaveBeenCalledTimes(1)
  })

  spec('selection.keyboard.6', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const change = vi.fn()
    const dispose = render(
      () => (
        <Listbox selectionMode="multiple" aria-label="Fruit" onValueChange={change}>
          <Listbox.Item value="apple">Apple</Listbox.Item>
          <Listbox.Item value="pear">Pear</Listbox.Item>
        </Listbox>
      ),
      container
    )
    onTestFinished(() => {
      dispose()
      container.remove()
    })
    flush()
    const apple = within(container).getByRole('option', { name: 'Apple' })
    const pear = within(container).getByRole('option', { name: 'Pear' })
    apple.focus()
    fireEvent.keyDown(apple, { key: 'a', metaKey: true })
    flush()
    expect(apple).toHaveAttribute('aria-selected', 'true')
    expect(pear).toHaveAttribute('aria-selected', 'true')
    expect(change).toHaveBeenCalledWith(['apple', 'pear'])
  })

  spec('selection.keyboard.8', async () => {
    const change = vi.fn()
    const mounted = harnessMount('tabs', {
      onValueChange: change,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
            <Tabs.Tab value="c">C</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">A panel</Tabs.Panel>
          <Tabs.Panel value="b">B panel</Tabs.Panel>
          <Tabs.Panel value="c">C panel</Tabs.Panel>
        </>
      ),
    })
    const tabs = within(mounted.container).getAllByRole('tab')
    tabs[1]!.focus()
    await mounted.settle()
    fireEvent.keyDown(tabs[1]!, { key: 'Home' })
    await mounted.settle()
    expect(tabs[0]).toHaveFocus()
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(tabs[0]!, { key: 'End' })
    await mounted.settle()
    expect(tabs[2]).toHaveFocus()
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    expect(change).toHaveBeenCalledWith('a')
    expect(change).toHaveBeenCalledWith('c')
    mounted.unmount()
  })
})
