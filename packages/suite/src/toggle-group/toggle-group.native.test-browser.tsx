import { ToggleGroup } from '@xenon/solid'
import { within } from '@testing-library/dom'
import tlUserEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { CompoundProps, Mounted } from '../harness'

import { mount } from '../harness/solid'

/** Mounted group plus the named item hosts the boundary cases drive. */
interface GroupFixture extends Mounted<CompoundProps> {
  bold: HTMLElement
  italic: HTMLElement
  underline: HTMLElement
}

function setup(props: CompoundProps = {}, disabledItem = false): GroupFixture {
  const m = mount('toggle-group', {
    'aria-label': 'Formatting',
    children: () => (
      <>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic" disabled={disabledItem}>
          Italic
        </ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </>
    ),
    ...props,
  })
  const scope = within(m.container)
  return {
    ...m,
    bold: scope.getByRole('button', { name: 'Bold' }),
    italic: scope.getByRole('button', { name: 'Italic' }),
    underline: scope.getByRole('button', { name: 'Underline' }),
  }
}

async function key(m: GroupFixture, value: string) {
  await userEvent.keyboard(value)
  await m.settle()
}

/** Inserts a native tabbable stop immediately before the mounted group. */
function anchorBefore(): HTMLElement {
  document.body.insertAdjacentHTML('afterbegin', '<button id="tg-before">Before</button>')
  const el = document.getElementById('tg-before')
  if (!el) throw new Error('no leading anchor')
  onTestFinished(() => el.remove())
  return el
}

/** Inserts a native tabbable stop immediately after the mounted group. */
function anchorAfter(): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', '<button id="tg-after">After</button>')
  const el = document.getElementById('tg-after')
  if (!el) throw new Error('no trailing anchor')
  onTestFinished(() => el.remove())
  return el
}

describe('toggle group native focus and activation boundaries', () => {
  test('native Tab enters a selected group at the first item, not the selected item', async () => {
    const change = vi.fn()
    const m = setup({ defaultValue: 'underline', onValueChange: change })
    // Selection owns aria-pressed only; the first item starts the roving ring.
    expect(m.underline).toHaveAttribute('aria-pressed', 'true')
    expect(m.bold).toHaveAttribute('tabindex', '0')
    expect(m.underline).toHaveAttribute('tabindex', '-1')

    const before = anchorBefore()
    before.focus()
    await key(m, '{Tab}')

    expect(m.bold).toHaveFocus()
    expect(m.underline).not.toHaveFocus()
    expect(m.underline).toHaveAttribute('aria-pressed', 'true')
    expect(change).not.toHaveBeenCalled()
  })

  test('Shift+Tab exits the group backward from a non-first roving stop and Tab re-enters it', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change })
    const before = anchorBefore()
    m.bold.focus()
    await key(m, '{ArrowRight}')
    expect(m.italic).toHaveFocus()
    expect(m.italic).toHaveAttribute('tabindex', '0')

    // The group is one tab stop: Shift+Tab leaves it rather than walking to Bold.
    await key(m, '{Shift>}{Tab}{/Shift}')
    expect(before).toHaveFocus()
    expect(m.italic).toHaveAttribute('tabindex', '0')

    await key(m, '{Tab}')
    expect(m.italic).toHaveFocus()
    expect(m.bold).not.toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })

  test('a disabled item can own the roving tab stop and Shift+Tab returns to it', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change }, true)
    m.bold.focus()
    await key(m, '{ArrowRight}')

    // Disabled items stay keyboard destinations, so the arrow ring lands on Italic.
    expect(m.italic).toHaveFocus()
    expect(m.italic).toHaveAttribute('aria-disabled', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveAttribute('tabindex', '0')

    const after = anchorAfter()
    await key(m, '{Tab}')
    expect(after).toHaveFocus()
    await key(m, '{Shift>}{Tab}{/Shift}')

    expect(m.italic).toHaveFocus()
    expect(m.bold).not.toHaveFocus()
    expect(change).not.toHaveBeenCalled()
  })

  test('a focused disabled item ignores native Space and Enter activation', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change }, true)
    m.bold.focus()
    await key(m, '{ArrowRight}')
    expect(m.italic).toHaveFocus()

    // A focusable disabled button still synthesizes native clicks for these keys.
    await key(m, ' ')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveFocus()
    await key(m, '{Enter}')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
    expect(change).not.toHaveBeenCalled()

    // Control: the same key toggles an enabled sibling, so the gate is item-scoped.
    await key(m, '{ArrowLeft}')
    expect(m.bold).toHaveFocus()
    await key(m, ' ')
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(change).toHaveBeenCalledExactlyOnceWith('bold')
  })

  test('a synthesized pointer press released over a sibling cancels activation', async () => {
    const user = tlUserEvent.setup()
    const change = vi.fn()
    const m = setup({ defaultValue: 'bold', onValueChange: change })

    // Pointer down on one item and up on another produces no click on either item.
    await user.pointer([
      { keys: '[MouseLeft>]', target: m.underline },
      { keys: '[/MouseLeft]', target: m.bold },
    ])
    await m.settle()

    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.underline).toHaveAttribute('aria-pressed', 'false')
    expect(change).not.toHaveBeenCalled()

    // Control: an unhurried native click still commits, so the gesture above was inert.
    await userEvent.click(m.underline)
    await m.settle()
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(m.underline).toHaveAttribute('aria-pressed', 'true')
    expect(change).toHaveBeenCalledExactlyOnceWith('underline')
  })
})
