import { Listbox } from '@xenon-ui/solid/listbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
function membership(options: HTMLElement[], selected: string[]) {
  for (const option of options) {
    expect(option).toHaveAttribute('aria-selected', String(selected.includes(option.textContent!)))
    expect(option).not.toHaveAttribute('aria-checked')
  }
}

for (const selectionMode of ['single', 'multiple'] as const) {
  test(`listbox.roles.7 and listbox.roles.11: ${selectionMode} options expose exact selection membership including disabled options`, async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Listbox aria-label="Fruit" selectionMode={selectionMode} onValueChange={change}>
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="blocked" disabled>
          Blocked
        </Listbox.Item>
        <Listbox.Item value="pear">Pear</Listbox.Item>
      </Listbox>
    ))
    const options = view.getAllByRole('option')
    membership(options, [])
    await userEvent.click(options[0]!)
    await settle()
    membership(options, ['Apple'])
    await userEvent.click(options[2]!)
    await settle()
    membership(options, selectionMode === 'multiple' ? ['Apple', 'Pear'] : ['Pear'])
    expect(change.mock.calls).toEqual(
      selectionMode === 'multiple' ? [[['apple']], [['apple', 'pear']]] : [['apple'], ['pear']]
    )
  })
}

test('listbox.state.4: uncontrolled replacement preserves root and option hosts and reports one callback', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" defaultValue="apple" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const options = view.getAllByRole('option')
  membership(options, ['Apple'])
  expect(change).not.toHaveBeenCalled()
  await userEvent.click(options[1]!)
  await settle()
  expect(view.getByRole('listbox')).toBe(root)
  expect(view.getAllByRole('option')).toEqual(options)
  membership(options, ['Pear'])
  expect(change.mock.calls).toEqual([['pear']])
})

test('listbox.state.5: rejected controlled single selection reports exactly one attempted value', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" value="apple" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  await userEvent.click(view.getByRole('option', { name: 'Pear' }))
  await settle()
  membership(view.getAllByRole('option'), ['Apple'])
  expect(change.mock.calls).toEqual([['pear']])
})

test('listbox.state.16: reactive authored metadata updates the same option without selection or active requests', async () => {
  const [version, setVersion] = createSignal('first')
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      value="apple"
      activeValue="apple"
      onValueChange={change}
      onActiveChange={active}
    >
      <Listbox.Item
        value="apple"
        data-version={version()}
        aria-description={version()}
        class={version()}
        title={version()}
      >
        Apple
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const option = view.getByRole('option', { name: 'Apple' })
  const id = option.id
  setVersion('second')
  await settle()
  expect(view.getByRole('option', { name: 'Apple' })).toBe(option)
  expect(option.id).toBe(id)
  expect(option).toHaveAttribute('data-version', 'second')
  expect(option).toHaveAttribute('aria-description', 'second')
  expect(option).toHaveAttribute('title', 'second')
  expect(option).toHaveClass('second')
  membership(view.getAllByRole('option'), ['Apple'])
  expect(change).not.toHaveBeenCalled()
  expect(active).not.toHaveBeenCalled()
})

test('listbox.keyboard.28 and listbox.keyboard.52: vertical arrows wrap while horizontal arrows preserve native defaults and selection', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const pear = view.getByRole('option', { name: 'Pear' })
  pear.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(apple).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(pear).toHaveFocus()
  const events: KeyboardEvent[] = []
  view.container.addEventListener('keydown', (event) => events.push(event))
  await userEvent.keyboard('{ArrowLeft}{ArrowRight}')
  await settle()
  expect(events.map((event) => [event.key, event.defaultPrevented])).toEqual([
    ['ArrowLeft', false],
    ['ArrowRight', false],
  ])
  expect(pear).toHaveFocus()
  membership(view.getAllByRole('option'), [])
  expect(change).not.toHaveBeenCalled()
})

for (const virtualFocus of [false, true]) {
  test(`listbox.rtl.5: composing navigation preserves ${virtualFocus ? 'virtual' : 'roving'} focus and selection`, async () => {
    const change = vi.fn()
    const active = vi.fn()
    const view = mount(() => (
      <Listbox
        aria-label="Fruit"
        dir="rtl"
        virtualFocus={virtualFocus}
        value="pear"
        activeValue="pear"
        onValueChange={change}
        onActiveChange={active}
      >
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="pear">Pear</Listbox.Item>
        <Listbox.Item value="plum">Plum</Listbox.Item>
      </Listbox>
    ))
    const root = view.getByRole('listbox')
    const pear = view.getByRole('option', { name: 'Pear' })
    const target = virtualFocus ? root : pear
    target.focus()
    await settle()
    active.mockClear()
    const activeId = root.getAttribute('aria-activedescendant')
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'ArrowLeft', 'ArrowRight']) {
      const event = new KeyboardEvent('keydown', {
        key,
        isComposing: true,
        bubbles: true,
        cancelable: true,
      })
      target.dispatchEvent(event)
      await settle()
      expect(event.defaultPrevented).toBe(false)
      expect(target).toHaveFocus()
      expect(root.getAttribute('aria-activedescendant')).toBe(activeId)
      membership(view.getAllByRole('option'), ['Pear'])
    }
    expect(change).not.toHaveBeenCalled()
    expect(active).not.toHaveBeenCalled()
  })
}
