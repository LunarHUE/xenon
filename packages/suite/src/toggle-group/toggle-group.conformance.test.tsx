import { ToggleGroup } from '@kit/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function setup(props = {}, disabledItem = false) {
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
    root: scope.getByRole('group'),
    bold: scope.getByRole('button', { name: 'Bold' }),
    italic: scope.getByRole('button', { name: 'Italic' }),
    underline: scope.getByRole('button', { name: 'Underline' }),
  }
}

async function click(m: ReturnType<typeof setup>, item: HTMLElement) {
  fireEvent.click(item)
  await m.settle()
}

describe('toggle group conformance', () => {
  spec('toggle-group.roles.1', () => expect(setup().root).toHaveAccessibleName('Formatting'))
  spec('toggle-group.roles.2', async () => {
    const m = setup()
    expect(m.root).toHaveAttribute('data-orientation', 'horizontal')
    m.setProps({ orientation: 'vertical' })
    await m.settle()
    expect(m.root).toHaveAttribute('data-orientation', 'vertical')
  })
  spec('toggle-group.roles.3', () => {
    for (const orientation of ['horizontal', 'vertical'])
      expect(setup({ orientation }).root).not.toHaveAttribute('aria-orientation')
  })
  spec('toggle-group.roles.4', () => {
    const m = setup({ defaultValue: 'italic' })
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
    expect(m.underline).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle-group.roles.5', () => {
    const m = setup({ disabled: true })
    for (const item of [m.bold, m.italic, m.underline]) {
      expect(item).toHaveAttribute('aria-disabled', 'true')
      expect(item).toHaveAttribute('data-disabled', '')
      expect(item).not.toBeDisabled()
    }
    expect(m.root).toHaveAttribute('data-disabled', '')
  })
  spec('toggle-group.roles.13', () => {
    for (const mode of ['single', 'multiple']) {
      const m = setup({ mode })
      expect(m.root).toHaveAttribute('role', 'group')
      for (const item of [m.bold, m.italic, m.underline]) {
        expect(item).toHaveAttribute('aria-pressed', 'false')
        expect(item).not.toHaveAttribute('aria-checked')
      }
    }
  })
  spec('toggle-group.pointer.1', async () => {
    const m = setup()
    await click(m, m.bold)
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle-group.pointer.2', async () => {
    const m = setup({ defaultValue: 'bold' })
    await click(m, m.italic)
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
  })
  spec('toggle-group.pointer.3', async () => {
    const change = vi.fn()
    const m = setup({ defaultValue: 'bold', onValueChange: change })
    await click(m, m.bold)
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(change).toHaveBeenCalledExactlyOnceWith(undefined)
  })
  spec('toggle-group.pointer.4', async () => {
    const change = vi.fn()
    const m = setup({ mode: 'multiple', onValueChange: change })
    await click(m, m.bold)
    await click(m, m.italic)
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
    expect(change.mock.calls).toEqual([[['bold']], [['bold', 'italic']]])
  })
  spec('toggle-group.pointer.5', async () => {
    const change = vi.fn()
    const m = setup({ mode: 'multiple', defaultValue: ['bold', 'italic'], onValueChange: change })
    await click(m, m.bold)
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
    expect(change).toHaveBeenCalledExactlyOnceWith(['italic'])
  })
  spec('toggle-group.pointer.6', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change }, true)
    await click(m, m.italic)
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
    expect(change).not.toHaveBeenCalled()
    await click(m, m.bold)
    expect(change).toHaveBeenCalledExactlyOnceWith('bold')
  })
  spec('toggle-group.pointer.9', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change })
    fireEvent.pointerDown(m.bold)
    await m.settle()
    expect(change).not.toHaveBeenCalled()
    fireEvent.pointerCancel(m.bold)
    await m.settle()
    expect(m.bold).toHaveAttribute('aria-pressed', 'false')
    await click(m, m.bold)
    expect(change).toHaveBeenCalledExactlyOnceWith('bold')
  })
  spec('toggle-group.state.1', () => {
    const change = vi.fn()
    setup({ defaultValue: 'italic', onValueChange: change })
    expect(change).not.toHaveBeenCalled()
  })
  spec('toggle-group.state.2', async () => {
    const change = vi.fn()
    const m = setup({ defaultValue: 'italic', onValueChange: change })
    await click(m, m.bold)
    expect(change).toHaveBeenCalledExactlyOnceWith('bold')
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle-group.state.3', async () => {
    for (const mode of ['single', 'multiple']) {
      const change = vi.fn()
      const m = setup({ mode, value: mode === 'single' ? 'bold' : ['bold'], onValueChange: change })
      m.setProps({ value: mode === 'single' ? 'italic' : ['italic', 'underline'] })
      await m.settle()
      expect(m.bold).toHaveAttribute('aria-pressed', 'false')
      expect(m.italic).toHaveAttribute('aria-pressed', 'true')
      expect(m.underline).toHaveAttribute('aria-pressed', String(mode === 'multiple'))
      expect(change).not.toHaveBeenCalled()
    }
  })
  spec('toggle-group.state.4', async () => {
    const change = vi.fn()
    const m = setup({ value: 'bold', onValueChange: change })
    await click(m, m.italic)
    expect(change).toHaveBeenCalledExactlyOnceWith('italic')
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle-group.state.5', () => {
    const m = setup({ defaultValue: 'italic', value: 'bold' })
    expect(m.bold).toHaveAttribute('aria-pressed', 'true')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle-group.focus.5', async () => {
    const m = setup()
    m.italic.focus()
    await m.settle()
    expect(m.italic).toHaveAttribute('tabindex', '0')
    expect(m.bold).toHaveAttribute('tabindex', '-1')
    expect(m.italic).toHaveAttribute('aria-pressed', 'false')
  })
  spec('toggle-group.focus.11', () => {
    const m = setup()
    expect(m.bold).toHaveAttribute('tabindex', '0')
    expect(m.italic).toHaveAttribute('tabindex', '-1')
    expect(m.underline).toHaveAttribute('tabindex', '-1')
  })
  test('disabled items retain their arrow position without selecting', async () => {
    const change = vi.fn()
    const m = setup({ onValueChange: change }, true)
    m.bold.focus()
    fireEvent.keyDown(m.bold, { key: 'ArrowRight' })
    await m.settle()
    expect(m.italic).toHaveFocus()
    expect(m.italic).toHaveAttribute('tabindex', '0')
    await click(m, m.italic)
    expect(change).not.toHaveBeenCalled()
  })
  test('undefined returns to internal selection without a callback', async () => {
    const change = vi.fn()
    const m = setup({ value: 'bold', defaultValue: 'italic', onValueChange: change })
    m.setProps({ value: undefined })
    await m.settle()
    expect(m.italic).toHaveAttribute('aria-pressed', 'true')
    expect(change).not.toHaveBeenCalled()
  })
  spec('toggle-group.a11y.1', async () => {
    for (const mode of ['single', 'multiple']) {
      for (const selected of [false, true]) {
        const m = setup({
          mode,
          defaultValue: selected ? (mode === 'single' ? 'bold' : ['bold']) : undefined,
        })
        await expectNoViolations(m.container)
        m.unmount()
      }
    }
  })
  spec('toggle-group.notes.3', async () => {
    const rootRef = vi.fn()
    const itemRef = vi.fn()
    const click = vi.fn()
    const m = mount('toggle-group', {
      ref: rootRef,
      class: 'root-author',
      children: () => (
        <ToggleGroup.Item
          value="bold"
          ref={itemRef}
          class="item-author"
          style={{ color: 'red' }}
          onClick={click}
        >
          Bold
        </ToggleGroup.Item>
      ),
    })
    const item = within(m.container).getByRole('button')
    const root = within(m.container).getByRole('group')
    expect(rootRef).toHaveBeenCalledWith(root)
    expect(itemRef).toHaveBeenCalledWith(item)
    expect(root).toHaveClass('root-author')
    expect(item).toHaveClass('item-author')
    expect(item).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    fireEvent.click(item)
    await m.settle()
    expect(click).toHaveBeenCalledOnce()
    expect(item).toHaveAttribute('aria-pressed', 'true')
  })
  test('item click cancellation suppresses the group value callback', async () => {
    const change = vi.fn()
    const m = mount('toggle-group', {
      onValueChange: change,
      children: () => (
        <ToggleGroup.Item value="bold" onClick={(event) => event.preventDefault()}>
          Bold
        </ToggleGroup.Item>
      ),
    })
    const item = within(m.container).getByRole('button')
    fireEvent.click(item)
    await m.settle()
    expect(change).not.toHaveBeenCalled()
    expect(item).toHaveAttribute('aria-pressed', 'false')
  })
})
