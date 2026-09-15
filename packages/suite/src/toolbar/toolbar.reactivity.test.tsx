/**
 * Reactive toolbar registry transitions: runtime item insertion and removal, the
 * root tab-stop fallback, runtime disabled/focusable changes, nested Toolbar
 * provider isolation, and controlled toggle-group membership inside a toolbar.
 * Shared between the jsdom and browser projects; no popup or native input is used.
 */
import { ToggleGroup, Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

/** Every roving tab stop in the fixture, including nested toolbars. */
function stops(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[tabindex="0"]')]
}

describe('toolbar reactive registry transitions', () => {
  test('a toolbar button mounted at runtime joins the ring in document order', async () => {
    const user = userEvent.setup()
    const [middle, setMiddle] = createSignal(false)
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button>Alpha</Toolbar.Button>
          {middle() ? <Toolbar.Button>Beta</Toolbar.Button> : null}
          <Toolbar.Button>Gamma</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const alpha = scope.getByRole('button', { name: 'Alpha' })
    const gamma = scope.getByRole('button', { name: 'Gamma' })
    expect(stops(m.container)).toEqual([alpha])

    setMiddle(true)
    await m.settle()
    const beta = scope.getByRole('button', { name: 'Beta' })
    expect(stops(m.container)).toEqual([alpha])

    alpha.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(beta)
    expect(stops(m.container)).toEqual([beta])

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(gamma)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(beta)
  })

  test('an emptied toolbar falls back to the root tab stop and recovers when an item returns', async () => {
    const [present, setPresent] = createSignal(true)
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          {present() ? (
            <>
              <Toolbar.Button>Bold</Toolbar.Button>
              <Toolbar.Button>Italic</Toolbar.Button>
            </>
          ) : null}
        </>
      ),
    })
    const el = root(m.container)
    const bold = within(el).getByRole('button', { name: 'Bold' })
    expect(stops(m.container)).toEqual([bold])
    expect(el).not.toHaveAttribute('tabindex')

    setPresent(false)
    await m.settle()
    expect(within(el).queryAllByRole('button')).toHaveLength(0)
    expect(stops(m.container)).toEqual([])
    expect(el).toHaveAttribute('tabindex', '-1')

    setPresent(true)
    await m.settle()
    expect(el).not.toHaveAttribute('tabindex')
    expect(stops(m.container)).toEqual([within(el).getByRole('button', { name: 'Bold' })])
  })

  test('disabling toolbar items at runtime relocates the ring and finally the root tab stop', async () => {
    const user = userEvent.setup()
    const [cutOff, setCutOff] = createSignal(false)
    const [copyOff, setCopyOff] = createSignal(false)
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button disabled={cutOff()} focusableWhenDisabled={false}>
            Cut
          </Toolbar.Button>
          <Toolbar.Button disabled={copyOff()} focusableWhenDisabled={false}>
            Copy
          </Toolbar.Button>
        </>
      ),
    })
    const el = root(m.container)
    const scope = within(el)
    const cut = scope.getByRole('button', { name: 'Cut' })
    const copy = scope.getByRole('button', { name: 'Copy' })
    expect(stops(m.container)).toEqual([cut])
    expect(el).not.toHaveAttribute('tabindex')

    setCutOff(true)
    await m.settle()
    expect(stops(m.container)).toEqual([copy])
    expect(el).not.toHaveAttribute('tabindex')

    copy.focus()
    await m.settle()
    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(copy)

    setCopyOff(true)
    await m.settle()
    expect(el).toHaveAttribute('tabindex', '-1')

    setCutOff(false)
    await m.settle()
    expect(el).not.toHaveAttribute('tabindex')
    expect(stops(m.container)).toEqual([cut])

    setCopyOff(false)
    await m.settle()
    cut.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
  })

  test('a nested toolbar keeps its own roving ring, isolated from the outer toolbar', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Outer',
      children: () => (
        <>
          <Toolbar.Button>Select all</Toolbar.Button>
          <Toolbar aria-label="Inner">
            <Toolbar.Button>Cut</Toolbar.Button>
            <Toolbar.Button>Copy</Toolbar.Button>
          </Toolbar>
          <Toolbar.Button>Paste</Toolbar.Button>
        </>
      ),
    })
    const outer = root(m.container)
    const inner = within(outer).getByRole('toolbar', { name: 'Inner' })
    const selectAll = within(outer).getByRole('button', { name: 'Select all' })
    const paste = within(outer).getByRole('button', { name: 'Paste' })
    const cut = within(inner).getByRole('button', { name: 'Cut' })
    const copy = within(inner).getByRole('button', { name: 'Copy' })

    expect(outer).not.toHaveAttribute('tabindex')
    expect(inner).not.toHaveAttribute('tabindex')
    // Each toolbar owns its ring: direct-child stops exclude the nested toolbar's items.
    expect([...outer.querySelectorAll<HTMLElement>(':scope > [tabindex="0"]')]).toEqual([selectAll])
    expect([...inner.querySelectorAll<HTMLElement>(':scope > [tabindex="0"]')]).toEqual([cut])

    selectAll.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(paste)

    cut.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(copy)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(cut)
  })

  test('a nested toolbar applies its own disabled policy, not the outer one', async () => {
    const [innerOff, setInnerOff] = createSignal(false)
    const m = mount('toolbar', {
      'aria-label': 'Outer',
      disabled: true,
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar aria-label="Inner" disabled={innerOff()}>
            <Toolbar.Button>Cut</Toolbar.Button>
          </Toolbar>
        </>
      ),
    })
    const outer = root(m.container)
    const bold = within(outer).getByRole('button', { name: 'Bold' })
    const cut = within(outer).getByRole('button', { name: 'Cut' })

    expect(bold).toHaveAttribute('aria-disabled', 'true')
    expect(cut).not.toHaveAttribute('aria-disabled')

    m.setProps({ disabled: false })
    setInnerOff(true)
    await m.settle()
    expect(bold).not.toHaveAttribute('aria-disabled')
    expect(cut).toHaveAttribute('aria-disabled', 'true')
  })

  test('a controlled multiple toggle group in a toolbar follows external membership changes', async () => {
    const changed = vi.fn()
    const [pressed, setPressed] = createSignal<string[]>(['bold'])
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <ToggleGroup mode="multiple" value={pressed()} onValueChange={changed} aria-label="Style">
          <Toolbar.Button as={ToggleGroup.Item} value="bold">
            Bold
          </Toolbar.Button>
          <Toolbar.Button as={ToggleGroup.Item} value="italic">
            Italic
          </Toolbar.Button>
        </ToggleGroup>
      ),
    })
    const scope = within(root(m.container))
    const bold = scope.getByRole('button', { name: 'Bold' })
    const italic = scope.getByRole('button', { name: 'Italic' })

    expect(bold).toHaveAttribute('aria-pressed', 'true')
    expect(bold).toHaveAttribute('data-state', 'on')
    expect(italic).toHaveAttribute('aria-pressed', 'false')
    expect(italic).toHaveAttribute('data-state', 'off')
    expect(stops(m.container)).toEqual([bold])

    setPressed(['bold', 'italic'])
    await m.settle()
    expect(bold).toHaveAttribute('aria-pressed', 'true')
    expect(italic).toHaveAttribute('aria-pressed', 'true')
    expect(italic).toHaveAttribute('data-state', 'on')
    expect(stops(m.container)).toEqual([bold])

    setPressed([])
    await m.settle()
    expect(bold).toHaveAttribute('aria-pressed', 'false')
    expect(italic).toHaveAttribute('aria-pressed', 'false')
    expect(changed).not.toHaveBeenCalled()
    expect(stops(m.container)).toEqual([bold])
  })
})
