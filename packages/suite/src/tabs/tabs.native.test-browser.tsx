/**
 * Native-browser Tabs cases that need the browser's own focus owner, native key
 * activation and real Tab traversal: the tab stop after the focused tab is
 * deleted or disabled, manual activation on an anchor host and an author-vetoed
 * arrow, the ID a panel keeps when it only mounts after its tab is selected, and
 * the handoff to the selection when focus leaves the list. Every fixture renders
 * through the shared Solid harness, so assertions observe the browser's focus and
 * default actions instead of dispatched events. These cases supplement the
 * registered spec assertions without claiming a new research ID.
 */
import { Tabs } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { For, Show, createSignal } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

/**
 * Mounts three tabs between sibling buttons with one action per panel, so the
 * native Tab order before and after the list is observable. Tests that need a
 * different layout replace `children`.
 */
function fixture(props: Record<string, unknown> = {}) {
  const m = mount('tabs', {
    children: () => (
      <>
        <button type="button">Before</button>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">Alpha</Tabs.Tab>
          <Tabs.Tab value="b">Beta</Tabs.Tab>
          <Tabs.Tab value="c">Gamma</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <button type="button">Alpha action</button>
        </Tabs.Panel>
        <Tabs.Panel value="b">
          <button type="button">Beta action</button>
        </Tabs.Panel>
        <Tabs.Panel value="c">
          <button type="button">Gamma action</button>
        </Tabs.Panel>
        <button type="button">After</button>
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    scope,
    before: scope.getByRole('button', { name: 'Before' }),
    alpha: scope.getByRole('tab', { name: 'Alpha' }),
    beta: scope.getByRole('tab', { name: 'Beta' }),
    gamma: scope.getByRole('tab', { name: 'Gamma' }),
  }
}

describe('tabs native activation and focus', () => {
  test('deleting the focused tab hands the tab stop to the first enabled tab and keeps the selection', async () => {
    const [values, setValues] = createSignal(['a', 'b', 'c'])
    const m = mount('tabs', {
      activationMode: 'manual',
      children: () => (
        <>
          <button type="button">Before</button>
          <Tabs.List aria-label="Sections">
            <For each={values()}>{(value) => <Tabs.Tab value={value}>{value}</Tabs.Tab>}</For>
          </Tabs.List>
          <For each={values()}>
            {(value) => <Tabs.Panel value={value}>{value} content</Tabs.Panel>}
          </For>
          <button type="button">After</button>
        </>
      ),
    })
    const scope = within(m.container)
    const before = scope.getByRole('button', { name: 'Before' })
    const alpha = scope.getByRole('tab', { name: 'a' })
    const beta = scope.getByRole('tab', { name: 'b' })

    // Manual navigation parks the tab stop on the focused tab, not the selection.
    alpha.focus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('tabindex', '0')
    expect(beta).toHaveAttribute('aria-selected', 'false')

    setValues(['a', 'c'])
    await m.settle()
    expect(scope.queryByRole('tab', { name: 'b' })).toBeNull()
    expect(scope.getByRole('tab', { name: 'a' })).toHaveAttribute('tabindex', '0')
    expect(scope.getByRole('tab', { name: 'c' })).toHaveAttribute('tabindex', '-1')
    expect(scope.getByRole('tab', { name: 'a' })).toHaveAttribute('aria-selected', 'true')
    expect(scope.getByText('a content')).not.toHaveAttribute('hidden')

    // The surviving tab stop is exactly what native Tab reaches from the previous control.
    before.focus()
    await userEvent.tab()
    expect(scope.getByRole('tab', { name: 'a' })).toHaveFocus()
  })

  test('disabling the focused tab drops native focus, hands the tab stop back and keeps the selection', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const m = fixture({
      activationMode: 'manual',
      children: () => (
        <>
          <button type="button">Before</button>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">Alpha</Tabs.Tab>
            <Tabs.Tab value="b" disabled={disabled()}>
              Beta
            </Tabs.Tab>
            <Tabs.Tab value="c">Gamma</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Alpha content</Tabs.Panel>
          <Tabs.Panel value="b">Beta content</Tabs.Panel>
          <Tabs.Panel value="c">Gamma content</Tabs.Panel>
          <button type="button">After</button>
        </>
      ),
    })
    const { scope, before, alpha, beta, gamma } = m
    alpha.focus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(beta).toHaveFocus()
    expect(beta).toHaveAttribute('tabindex', '0')

    setDisabled(true)
    await m.settle()
    expect(beta).toBeDisabled()
    expect(beta).not.toHaveFocus()
    expect(beta).toHaveAttribute('tabindex', '-1')
    expect(alpha).toHaveAttribute('tabindex', '0')
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(scope.getByText('Alpha content')).not.toHaveAttribute('hidden')

    // The selection survives, the native destinations skip the disabled tab and the
    // returned tab stop is reachable again.
    before.focus()
    await userEvent.tab()
    expect(alpha).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(gamma).toHaveFocus()
    expect(alpha).toHaveAttribute('aria-selected', 'true')
  })

  test('a link-backed tab moves focus with arrows in manual mode and commits once on native Enter', async () => {
    const previous = window.location.href
    onTestFinished(() => window.history.replaceState(null, '', previous))
    const changed = vi.fn()
    const m = mount('tabs', {
      activationMode: 'manual',
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab as="a" href="#native-alpha" value="a">
              Alpha
            </Tabs.Tab>
            <Tabs.Tab as="a" href="#native-beta" value="b">
              Beta
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel id="native-alpha" value="a">
            Alpha content
          </Tabs.Panel>
          <Tabs.Panel id="native-beta" value="b">
            Beta content
          </Tabs.Panel>
        </>
      ),
    })
    const scope = within(m.container)
    const alpha = scope.getByRole('tab', { name: 'Alpha' })
    const beta = scope.getByRole('tab', { name: 'Beta' })
    expect(beta.tagName).toBe('A')
    expect(beta).toHaveAttribute('role', 'tab')
    expect(beta).toHaveAttribute('href', '#native-beta')

    // Arrows traverse anchors like any other tab and manual mode keeps the selection.
    alpha.focus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()
    expect(beta).toHaveFocus()
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(beta).toHaveAttribute('aria-selected', 'false')
    expect(changed).not.toHaveBeenCalled()

    // Native anchor activation performs the fragment navigation and the anchor click
    // commits exactly one selection.
    await userEvent.keyboard('{Enter}')
    await m.settle()
    expect(window.location.hash).toBe('#native-beta')
    expect(beta).toHaveAttribute('aria-selected', 'true')
    expect(beta).toHaveAttribute('href', '#native-beta')
    expect(scope.getByRole('tabpanel')).toHaveAccessibleName('Beta')
    expect(changed).toHaveBeenCalledExactlyOnceWith('b')
  })

  test('an author keydown veto on a tab cancels manual arrow navigation', async () => {
    const veto = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const changed = vi.fn()
    const m = mount('tabs', {
      activationMode: 'manual',
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a" onKeyDown={veto}>
              Alpha
            </Tabs.Tab>
            <Tabs.Tab value="b">Beta</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Alpha content</Tabs.Panel>
          <Tabs.Panel value="b">Beta content</Tabs.Panel>
        </>
      ),
    })
    const scope = within(m.container)
    const alpha = scope.getByRole('tab', { name: 'Alpha' })
    const beta = scope.getByRole('tab', { name: 'Beta' })
    alpha.focus()
    await userEvent.keyboard('{ArrowRight}')
    await m.settle()

    // The author handler runs on the real key event and its cancellation keeps the
    // core navigation from running, so neither the tab stop nor the selection moves.
    expect(veto).toHaveBeenCalledOnce()
    expect(veto.mock.calls[0]![0].key).toBe('ArrowRight')
    expect(alpha).toHaveFocus()
    expect(alpha).toHaveAttribute('tabindex', '0')
    expect(beta).toHaveAttribute('tabindex', '-1')
    expect(alpha).toHaveAttribute('aria-selected', 'true')
    expect(changed).not.toHaveBeenCalled()
  })

  test('a panel mounted after its tab is selected keeps the promised id and receives native focus', async () => {
    const [selected, setSelected] = createSignal<string>()
    const m = mount('tabs', {
      onValueChange: (value: string) => setSelected(value),
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab value="a">Alpha</Tabs.Tab>
            <Tabs.Tab value="b">Beta</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">Alpha content</Tabs.Panel>
          <Show when={selected() === 'b'}>
            <Tabs.Panel value="b">
              <button type="button">Beta action</button>
            </Tabs.Panel>
          </Show>
        </>
      ),
    })
    const scope = within(m.container)
    const beta = scope.getByRole('tab', { name: 'Beta' })
    const promised = beta.getAttribute('aria-controls')
    expect(promised).toBeTruthy()
    expect(document.getElementById(promised!)).toBeNull()

    await userEvent.click(beta)
    await m.settle()
    const panel = scope.getByRole('tabpanel')
    expect(panel.id).toBe(promised)
    expect(panel).toHaveAttribute('aria-labelledby', beta.id)
    expect(panel).not.toHaveAttribute('hidden')
    // The mounted panel is probed for focusable content, so the panel itself is
    // skipped and native Tab enters its control.
    expect(panel).not.toHaveAttribute('tabindex')

    await userEvent.tab()
    expect(scope.getByRole('button', { name: 'Beta action' })).toHaveFocus()
  })

  test('native focus leaving the list for the panel returns the tab stop to the selected tab', async () => {
    const m = fixture({ activationMode: 'manual' })
    const { scope, alpha, gamma } = m

    gamma.focus()
    await m.settle()
    expect(gamma).toHaveFocus()
    expect(gamma).toHaveAttribute('tabindex', '0')
    expect(alpha).toHaveAttribute('tabindex', '-1')

    await userEvent.tab()
    expect(scope.getByRole('button', { name: 'Alpha action' })).toHaveFocus()
    expect(alpha).toHaveAttribute('tabindex', '0')
    expect(gamma).toHaveAttribute('tabindex', '-1')
    expect(alpha).toHaveAttribute('aria-selected', 'true')

    await userEvent.tab({ shift: true })
    expect(alpha).toHaveFocus()
  })
})
