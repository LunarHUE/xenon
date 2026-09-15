import { Dialog, Popover, RadioGroup } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(document.body)
}

async function settle() {
  flush()
  await new Promise((resolve) => setTimeout(resolve, 50))
  flush()
}

function radios() {
  return (
    <>
      <RadioGroup.Item value="standard" aria-label="Standard" />
      <RadioGroup.Item value="express" aria-label="Express" />
    </>
  )
}

test('radio-group.notes.9: named backing inputs do not create nested overflow', async () => {
  const query = mount(() => (
    <div data-testid="outer-scroll" style={{ width: '120px', height: '60px', overflow: 'auto' }}>
      <div data-testid="inner-scroll" style={{ width: '100px', height: '40px', overflow: 'auto' }}>
        <RadioGroup name="delivery" aria-label="Delivery">
          <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
          <RadioGroup.Item as="button" value="express" aria-label="Express" />
        </RadioGroup>
      </div>
    </div>
  ))
  await settle()
  const outer = query.getByTestId('outer-scroll')
  const inner = query.getByTestId('inner-scroll')
  expect(document.querySelectorAll('input[aria-hidden="true"][type="radio"]')).toHaveLength(2)
  expect(window.scrollY).toBe(0)
  expect(document.documentElement.scrollHeight).toBeLessThanOrEqual(window.innerHeight + 1)
  expect(outer.scrollHeight).toBeLessThanOrEqual(outer.clientHeight + 1)
  expect(outer.scrollWidth).toBeLessThanOrEqual(outer.clientWidth + 1)
  expect(inner.scrollHeight).toBeLessThanOrEqual(inner.clientHeight + 1)
  expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth + 1)
  expect(query.getByRole('radio', { name: 'Standard' })).toBeVisible()
})

test.each(['input', 'button'] as const)(
  'radio-group.focus.21: opening a dialog focuses the selected %s radio without changing value',
  async (as) => {
    const change = vi.fn()
    const query = mount(() => (
      <Dialog.Root open>
        <Dialog.Content aria-label="Delivery dialog">
          <RadioGroup defaultValue="express" aria-label="Delivery" onValueChange={change}>
            <RadioGroup.Item as={as} value="standard" aria-label="Standard" />
            <RadioGroup.Item as={as} value="express" aria-label="Express" />
          </RadioGroup>
        </Dialog.Content>
      </Dialog.Root>
    ))
    await settle()
    expect(query.getByRole('radio', { name: 'Express' })).toHaveFocus()
    expect(query.getByRole('radio', { name: 'Express' })).toBeChecked()
    expect(change).not.toHaveBeenCalled()
  }
)

test('radio-group.focus.21: opening a popover focuses the selected radio without changing value', async () => {
  const change = vi.fn()
  const query = mount(() => (
    <Popover open>
      <Popover.Trigger>Delivery</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Delivery popover">
          <RadioGroup defaultValue="express" aria-label="Delivery" onValueChange={change}>
            {radios()}
          </RadioGroup>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await settle()
  expect(query.getByRole('radio', { name: 'Express' })).toHaveFocus()
  expect(query.getByRole('radio', { name: 'Express' })).toBeChecked()
  expect(change).not.toHaveBeenCalled()
})

test('dialog preserves an author autofocus target ahead of the radio group entry', async () => {
  const query = mount(() => (
    <Dialog.Root open>
      <Dialog.Content aria-label="Delivery dialog">
        <RadioGroup defaultValue="express" aria-label="Delivery">
          <RadioGroup.Item value="standard" aria-label="Standard" autofocus />
          <RadioGroup.Item value="express" aria-label="Express" />
        </RadioGroup>
      </Dialog.Content>
    </Dialog.Root>
  ))
  await settle()
  expect(query.getByRole('radio', { name: 'Standard' })).toHaveFocus()
  expect(query.getByRole('radio', { name: 'Express' })).toBeChecked()
})

test('a selected radio does not take focus when mounted outside an overlay', async () => {
  const before = document.createElement('button')
  document.body.append(before)
  cleanups.push(() => before.remove())
  before.focus()
  mount(() => (
    <RadioGroup defaultValue="express" aria-label="Delivery">
      {radios()}
    </RadioGroup>
  ))
  await settle()
  expect(before).toHaveFocus()
})

test('radio-group.keyboard.1: an unselected group receives Tab on its first radio', async () => {
  const query = mount(() => (
    <>
      <button>Before</button>
      <RadioGroup aria-label="Delivery">{radios()}</RadioGroup>
      <button>After</button>
    </>
  ))
  await userEvent.keyboard('{Tab}')
  expect(query.getByRole('button', { name: 'Before' })).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(query.getByRole('radio', { name: 'Standard' })).toHaveFocus()
})

test('radio-group.keyboard.10: Tab leaves and Shift+Tab returns to the selected radio', async () => {
  const query = mount(() => (
    <>
      <RadioGroup defaultValue="express" aria-label="Delivery">
        {radios()}
      </RadioGroup>
      <button>After</button>
    </>
  ))
  query.getByRole('radio', { name: 'Express' }).focus()
  await userEvent.keyboard('{Tab}')
  expect(query.getByRole('button', { name: 'After' })).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(query.getByRole('radio', { name: 'Express' })).toHaveFocus()
})

test('radio-group.pointer.1: click then Tab exits and Shift+Tab returns to selected radio', async () => {
  const query = mount(() => (
    <>
      <RadioGroup aria-label="Delivery">{radios()}</RadioGroup>
      <button>After</button>
    </>
  ))
  await userEvent.click(query.getByRole('radio', { name: 'Express' }))
  await userEvent.keyboard('{Tab}')
  expect(query.getByRole('button', { name: 'After' })).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(query.getByRole('radio', { name: 'Express' })).toHaveFocus()
  expect(query.getByRole('radio', { name: 'Express' })).toBeChecked()
})
