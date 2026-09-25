import { Tabs } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'
import { For, createSignal } from 'solid-js'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta</Tabs.Tab>
          <Tabs.Tab value="c">Gamma</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Alpha content</Tabs.Panel>
        <Tabs.Panel value="b">Beta content</Tabs.Panel>
        <Tabs.Panel value="c">Gamma content</Tabs.Panel>
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    scope,
    alpha: scope.getByRole('tab', { name: 'Alpha' }),
    beta: scope.getByRole('tab', { name: 'Beta' }),
    gamma: scope.getByRole('tab', { name: 'Gamma' }),
  }
}

function paired(tab: HTMLElement, panel: HTMLElement) {
  expect(tab.id).not.toBe('')
  expect(panel.id).not.toBe('')
  expect(tab).toHaveAttribute('aria-controls', panel.id)
  expect(panel).toHaveAttribute('aria-labelledby', tab.id)
}

describe('additional tabs conformance', () => {
  spec('tabs.roles.15', () => {
    const m = fixture()
    paired(m.alpha, m.scope.getByRole('tabpanel', { name: 'Alpha' }))
    expect(m.alpha).toHaveAttribute('aria-selected', 'true')
  })
  spec('tabs.roles.11', async () => {
    const m = mount('tabs', {
      children: () => (
        <>
          <Tabs.List as="ul" aria-label="Sections">
            <li role="presentation">
              <Tabs.Tab value="a">Alpha</Tabs.Tab>
            </li>
            <li role="presentation">
              <Tabs.Tab value="b">Beta</Tabs.Tab>
            </li>
          </Tabs.List>
          <Tabs.Panel value="a">Alpha content</Tabs.Panel>
          <Tabs.Panel value="b">Beta content</Tabs.Panel>
        </>
      ),
    })
    const scope = within(m.container)
    const list = scope.getByRole('tablist')
    expect(list.tagName).toBe('UL')
    const wrappers = [...list.children]
    expect(wrappers).toHaveLength(2)
    for (const wrapper of wrappers) {
      expect(wrapper).toHaveAttribute('role', 'presentation')
      expect(wrapper).not.toHaveAttribute('tabindex')
      expect(wrapper).not.toHaveAttribute('aria-label')
      expect(within(wrapper as HTMLElement).getByRole('tab')).toBeInTheDocument()
    }
    await expectNoViolations(m.container)
  })
  spec('tabs.roles.12', () => {
    const m = fixture()
    expect(m.scope.getByRole('tablist').tagName).toBe('DIV')
    for (const tab of [m.alpha, m.beta, m.gamma]) {
      expect(tab.tagName).toBe('BUTTON')
      expect(tab).toHaveAttribute('role', 'tab')
      expect(tab).toHaveAttribute('type', 'button')
    }
  })
  spec('tabs.roles.30', () => {
    const first = fixture()
    const second = fixture()
    const ids = [first, second].flatMap((m) =>
      [...m.container.querySelectorAll('[id]')].map((el) => el.id)
    )
    expect(ids).toHaveLength(12)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of [first, second]) {
      for (const tab of [m.alpha, m.beta, m.gamma]) {
        const id = tab.getAttribute('aria-controls')
        const panel = [...m.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')].find(
          (el) => el.id === id
        )
        expect(panel).toBeDefined()
        paired(tab, panel!)
      }
    }
  })
  spec('tabs.state.15', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    fireEvent.click(m.beta)
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith('b')
    expect(m.beta).toHaveAttribute('aria-selected', 'true')
    expect(m.scope.getByRole('tabpanel')).toHaveAccessibleName('Beta')
    fireEvent.click(m.beta)
    await m.settle()
    expect(changed).toHaveBeenCalledOnce()
  })
  test('changing defaultValue after mount preserves the uncontrolled selection', async () => {
    const changed = vi.fn()
    const m = fixture({ defaultValue: 'a', onValueChange: changed })
    m.setProps({ defaultValue: 'b' })
    await m.settle()
    expect(m.alpha).toHaveAttribute('aria-selected', 'true')
    expect(changed).not.toHaveBeenCalled()
    fireEvent.click(m.gamma)
    await m.settle()
    m.setProps({ defaultValue: 'a' })
    await m.settle()
    expect(m.gamma).toHaveAttribute('aria-selected', 'true')
    expect(changed).toHaveBeenCalledExactlyOnceWith('c')
  })

  spec('tabs.keyboard.17', async () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const seen: { key: string; prevented: boolean }[] = []
      const m = mount('tabs', {
        orientation,
        children: () => (
          <>
            <Tabs.List
              aria-label="Sections"
              onKeyDown={(event) =>
                seen.push({ key: event.key, prevented: event.defaultPrevented })
              }
            >
              <Tabs.Tab value="a">Alpha</Tabs.Tab>
              <Tabs.Tab value="b">Beta</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="a">Alpha content</Tabs.Panel>
            <Tabs.Panel value="b">Beta content</Tabs.Panel>
          </>
        ),
      })
      const first = within(m.container).getByRole('tab', { name: 'Alpha' })
      first.focus()
      const mapped = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
      const crossAxis = orientation === 'horizontal' ? 'ArrowDown' : 'ArrowRight'
      fireEvent.keyDown(first, { key: crossAxis })
      await m.settle()
      expect(first).toHaveFocus()
      fireEvent.keyDown(first, { key: mapped })
      await m.settle()
      expect(within(m.container).getByRole('tab', { name: 'Beta' })).toHaveFocus()
      expect(seen).toEqual([
        { key: crossAxis, prevented: false },
        { key: mapped, prevented: true },
      ])
      m.unmount()
    }
  })

  test('keyed item removal preserves a controlled selection and navigation', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const changed = vi.fn()
    const m = mount('tabs', {
      value: 'b',
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <For each={items()}>{(value) => <Tabs.Tab value={value}>{value}</Tabs.Tab>}</For>
          </Tabs.List>
          <For each={items()}>
            {(value) => <Tabs.Panel value={value}>{value} content</Tabs.Panel>}
          </For>
        </>
      ),
    })
    setItems(['b', 'c', 'd'])
    await m.settle()
    const scope = within(m.container)
    expect(scope.queryByRole('tab', { name: 'a' })).toBeNull()
    expect(scope.getByRole('tab', { name: 'b' })).toHaveAttribute('aria-selected', 'true')
    expect(scope.getByRole('tab', { name: 'd' })).toHaveAttribute('aria-selected', 'false')
    expect(changed).not.toHaveBeenCalled()
    const selected = scope.getByRole('tab', { name: 'b' })
    selected.focus()
    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    await m.settle()
    expect(scope.getByRole('tab', { name: 'c' })).toHaveFocus()
    expect(selected).toHaveAttribute('aria-selected', 'true')
    expect(changed).toHaveBeenCalledExactlyOnceWith('c')
  })

  spec('tabs.keyboard.26', async () => {
    const changed = vi.fn()
    const m = fixture({ onValueChange: changed })
    m.alpha.focus()
    for (const key of ['PageUp', 'PageDown']) {
      const event = new KeyboardEvent('keydown', {
        key,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      m.alpha.dispatchEvent(event)
      await m.settle()
      expect(event.defaultPrevented).toBe(false)
      expect(m.alpha).toHaveFocus()
      expect(m.alpha).toHaveAttribute('aria-selected', 'true')
    }
    expect(changed).not.toHaveBeenCalled()
  })
  spec('tabs.notes.7', async () => {
    /* eslint-disable solid/prefer-for -- exercises the author .map composition specified by this case */
    const panels = () => (
      <>
        {['c', 'b', 'a'].map((value) => (
          <section>
            <Tabs.Panel value={value}>{value} content</Tabs.Panel>
          </section>
        ))}
      </>
    )
    /* eslint-enable solid/prefer-for */
    const m = mount('tabs', {
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <>
              <Tabs.Tab value="a">a</Tabs.Tab>
              <Tabs.Tab value="b">b</Tabs.Tab>
            </>
            <Tabs.Tab value="c">c</Tabs.Tab>
          </Tabs.List>
          {panels()}
        </>
      ),
    })
    const scope = within(m.container)
    for (const value of ['a', 'b', 'c']) {
      const tab = scope.getByRole('tab', { name: value })
      const panel = scope.getByText(value + ' content')
      paired(tab, panel)
      fireEvent.click(tab)
      await m.settle()
      expect(scope.getByRole('tabpanel')).toBe(panel)
      expect(panel).not.toHaveAttribute('hidden')
    }
  })
  test('only the selected panel is exposed while all panels remain mounted', async () => {
    const m = fixture()
    const panels = [...m.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    expect(panels).toHaveLength(3)
    for (const tab of [m.alpha, m.beta, m.gamma]) {
      fireEvent.click(tab)
      await m.settle()
      const visible = m.scope.getAllByRole('tabpanel')
      expect(visible).toHaveLength(1)
      expect(tab).toHaveAttribute('aria-controls', visible[0]!.id)
      expect([...m.container.querySelectorAll('[role="tabpanel"]')]).toEqual(panels)
      for (const panel of panels) {
        expect(panel.hasAttribute('hidden')).toBe(panel !== visible[0])
        expect(panel).not.toHaveAttribute('aria-hidden')
      }
    }
  })
})
