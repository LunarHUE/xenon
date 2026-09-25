/**
 * Browser-native toolbar boundaries: live orientation and direction changes, the
 * nested-group Tab boundary, native anchor activation, and a text-input item.
 */
import { Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function anchorBefore(): HTMLElement {
  document.body.insertAdjacentHTML('afterbegin', '<button id="before">before</button>')
  const el = document.getElementById('before')
  if (!(el instanceof HTMLElement)) throw new Error('no leading anchor')
  onTestFinished(() => el.remove())
  return el
}

function anchorAfter(): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', '<button id="after">after</button>')
  const el = document.getElementById('after')
  if (!(el instanceof HTMLElement)) throw new Error('no trailing anchor')
  onTestFinished(() => el.remove())
  return el
}

describe('toolbar native interaction in a browser', () => {
  test('flipping orientation at runtime reorients the ring, item axes and separators', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
        </>
      ),
    })
    await m.settle()
    const scope = within(root(m.container))
    const bold = scope.getByRole('button', { name: 'Bold' })
    const left = scope.getByRole('button', { name: 'Left' })
    const right = scope.getByRole('button', { name: 'Right' })
    const separator = scope.getByRole('separator')

    expect(root(m.container)).toHaveAttribute('data-orientation', 'horizontal')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    for (const item of [bold, left, right])
      expect(item).toHaveAttribute('data-orientation', 'horizontal')

    m.setProps({ orientation: 'vertical' })
    await m.settle()

    expect(root(m.container)).toHaveAttribute('aria-orientation', 'vertical')
    expect(root(m.container)).toHaveAttribute('data-orientation', 'vertical')
    for (const item of [bold, left, right])
      expect(item).toHaveAttribute('data-orientation', 'vertical')
    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    expect(separator).not.toHaveAttribute('aria-orientation')

    bold.focus()
    await m.settle()
    await user.keyboard('{ArrowDown}')
    await m.settle()
    expect(document.activeElement).toBe(left)
    await user.keyboard('{ArrowDown}')
    await m.settle()
    expect(document.activeElement).toBe(right)
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(right)

    m.setProps({ orientation: 'horizontal' })
    await m.settle()
    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(left)
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(right)
  })

  test('flipping the dir prop at runtime mirrors horizontal arrows inside a nested group', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Format',
      dir: 'ltr',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
        </>
      ),
    })
    await m.settle()
    const scope = within(root(m.container))
    const bold = scope.getByRole('button', { name: 'Bold' })
    const left = scope.getByRole('button', { name: 'Left' })
    const right = scope.getByRole('button', { name: 'Right' })

    bold.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(left)

    m.setProps({ dir: 'rtl' })
    await m.settle()
    expect(root(m.container)).toHaveAttribute('dir', 'rtl')

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(right)
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(left)

    m.setProps({ dir: 'ltr' })
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(right)
  })

  test('native Tab leaves and re-enters the toolbar at the active item inside a nested group', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Group aria-label="Clipboard">
            <Toolbar.Button>Cut</Toolbar.Button>
            <Toolbar.Button>Copy</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Separator />
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
        </>
      ),
    })
    await m.settle()
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const copy = scope.getByRole('button', { name: 'Copy' })
    const left = scope.getByRole('button', { name: 'Left' })
    const before = anchorBefore()
    const after = anchorAfter()

    before.focus()
    await user.tab()
    expect(document.activeElement).toBe(cut)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(left)
    expect([...m.container.querySelectorAll('[tabindex="0"]')]).toEqual([left])

    await user.tab()
    expect(document.activeElement).toBe(after)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(left)
    expect([...m.container.querySelectorAll('[tabindex="0"]')]).toEqual([left])
  })

  test('a toolbar link keeps native anchor activation: Enter navigates and Space does not', async () => {
    const user = userEvent
    const previous = window.location.href
    onTestFinished(() => window.history.replaceState(null, '', previous))
    const clicks = vi.fn()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Link href="#toolbar-native-link" onClick={clicks}>
            Help
          </Toolbar.Link>
        </>
      ),
    })
    await m.settle()
    const link = within(root(m.container)).getByRole('link', { name: 'Help' })
    expect(link).not.toHaveAttribute('aria-pressed')
    expect(link).toHaveAttribute('tabindex', '-1')

    link.focus()
    await m.settle()
    expect(document.activeElement).toBe(link)
    expect(link).toHaveAttribute('tabindex', '0')

    await user.keyboard(' ')
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(link)
    expect(window.location.hash).not.toBe('#toolbar-native-link')

    await user.keyboard('{Enter}')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('#toolbar-native-link')
  })

  test('a text-input toolbar item keeps native Shift-extended selection while an unmodified arrow navigates', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Find',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button as="input" type="text" aria-label="Search" />
        </>
      ),
    })
    await m.settle()
    const scope = within(root(m.container))
    const bold = scope.getByRole('button', { name: 'Bold' })
    const input = scope.getByRole('textbox', { name: 'Search' })
    if (!(input instanceof HTMLInputElement)) throw new Error('expected a native text input')
    expect(input).toHaveAttribute('tabindex', '-1')

    input.focus()
    await m.settle()
    expect(document.activeElement).toBe(input)
    expect(input).toHaveAttribute('tabindex', '0')
    expect(bold).toHaveAttribute('tabindex', '-1')

    await user.keyboard('sent')
    expect(input).toHaveValue('sent')
    expect(document.activeElement).toBe(input)

    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(3)
    expect(input.selectionEnd).toBe(4)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(bold)
    expect(bold).toHaveAttribute('tabindex', '0')
    expect(input).toHaveAttribute('tabindex', '-1')
  })
})
