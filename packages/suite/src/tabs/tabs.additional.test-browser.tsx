import { Tabs } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('tabs', {
    children: () => (
      <>
        <button>Before</button>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta</Tabs.Tab>
          <Tabs.Tab value="c">Gamma</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <button>Alpha action</button>
        </Tabs.Panel>
        <Tabs.Panel value="b">
          <button>Beta action</button>
        </Tabs.Panel>
        <Tabs.Panel value="c">
          <button>Gamma action</button>
        </Tabs.Panel>
        <button>After</button>
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

describe('additional tabs browser behavior', () => {
  spec('tabs.focus.1', async () => {
    const m = fixture({ defaultValue: 'b', activationMode: 'manual' })
    expect(m.alpha).toHaveAttribute('tabindex', '-1')
    expect(m.beta).toHaveAttribute('tabindex', '0')
    expect(m.gamma).toHaveAttribute('tabindex', '-1')
    m.scope.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    expect(m.beta).toHaveFocus()
    m.gamma.focus()
    await m.settle()
    expect(m.gamma).toHaveFocus()
    expect(m.gamma).toHaveAttribute('tabindex', '0')
    expect(m.beta).toHaveAttribute('tabindex', '-1')
    await userEvent.click(m.alpha)
    await m.settle()
    expect(m.alpha).toHaveFocus()
    expect(m.alpha).toHaveAttribute('tabindex', '0')
    expect(m.gamma).toHaveAttribute('tabindex', '-1')
    expect(m.scope.getAllByRole('tab').filter((el) => el.tabIndex === 0)).toEqual([m.alpha])
  })
  spec('tabs.focus.15', async () => {
    const changed = vi.fn()
    const m = fixture({ activationMode: 'manual', defaultValue: 'a', onValueChange: changed })
    m.beta.focus()
    await m.settle()
    expect(m.beta).toHaveFocus()
    expect(m.beta).toHaveAttribute('aria-selected', 'false')
    expect(m.alpha).toHaveAttribute('aria-selected', 'true')
    expect(m.scope.getByRole('tabpanel')).toHaveAccessibleName('Alpha')
    expect(changed).not.toHaveBeenCalled()
    await userEvent.keyboard('{Enter}')
    await m.settle()
    expect(m.beta).toHaveAttribute('aria-selected', 'true')
    expect(changed).toHaveBeenCalledExactlyOnceWith('b')
  })
  test('native hidden panels remove their controls from keyboard traversal', async () => {
    const m = fixture({ defaultValue: 'b' })
    m.beta.focus()
    await userEvent.tab()
    expect(m.scope.getByRole('button', { name: 'Beta action' })).toHaveFocus()
    await userEvent.tab()
    expect(m.scope.getByRole('button', { name: 'After' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(m.scope.getByRole('button', { name: 'Beta action' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(m.beta).toHaveFocus()
    const panels = [...m.container.querySelectorAll<HTMLElement>('[role="tabpanel"]')]
    expect(panels).toHaveLength(3)
    expect(panels.filter((panel) => panel.hidden)).toHaveLength(2)
    for (const panel of panels) expect(panel).not.toHaveAttribute('aria-hidden')
  })

  spec('tabs.roles.22', async () => {
    const previous = window.location.href
    onTestFinished(() => window.history.replaceState(null, '', previous))
    const changed = vi.fn()
    const m = mount('tabs', {
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab as="a" href="#anchor-alpha" value="a">
              Alpha
            </Tabs.Tab>
            <Tabs.Tab as="a" href="#anchor-beta" value="b">
              Beta
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="anchor-alpha" value="a">
            Alpha content
          </Tabs.Panel>
          <Tabs.Panel id="anchor-beta" value="b">
            Beta content
          </Tabs.Panel>
        </>
      ),
    })
    const scope = within(m.container)
    const beta = scope.getByRole('tab', { name: 'Beta' })
    expect(beta.tagName).toBe('A')
    expect(beta).toHaveAttribute('href', '#anchor-beta')
    await userEvent.click(beta)
    await m.settle()
    expect(beta).toHaveAttribute('aria-selected', 'true')
    expect(scope.getByRole('tabpanel')).toHaveAccessibleName('Beta')
    expect(changed).toHaveBeenCalledExactlyOnceWith('b')
  })
  spec('tabs.rtl.6', async () => {
    const previous = document.body.getAttribute('dir')
    document.body.dir = 'rtl'
    onTestFinished(() => {
      if (previous === null) document.body.removeAttribute('dir')
      else document.body.setAttribute('dir', previous)
    })
    const m = mount('tabs', {
      children: () => (
        <>
          <Tabs.List aria-label="Sections" style={{ display: 'flex' }}>
            <Tabs.Tab value="a">Alpha</Tabs.Tab>
            <Tabs.Tab value="b">Beta</Tabs.Tab>
            <Tabs.Tab value="c">Gamma</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Alpha content</Tabs.Panel>
          <Tabs.Panel value="b">Beta content</Tabs.Panel>
          <Tabs.Panel value="c">Gamma content</Tabs.Panel>
        </>
      ),
    })
    const scope = within(m.container)
    const alpha = scope.getByRole('tab', { name: 'Alpha' })
    const beta = scope.getByRole('tab', { name: 'Beta' })
    const gamma = scope.getByRole('tab', { name: 'Gamma' })
    expect(alpha.getBoundingClientRect().left).toBeGreaterThan(beta.getBoundingClientRect().left)
    expect(beta.getBoundingClientRect().left).toBeGreaterThan(gamma.getBoundingClientRect().left)
    await userEvent.click(alpha)
    await userEvent.keyboard('{ArrowLeft}')
    await m.settle()
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(gamma)
    await m.settle()
    expect(gamma).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('aria-selected', 'true')
  })
})
