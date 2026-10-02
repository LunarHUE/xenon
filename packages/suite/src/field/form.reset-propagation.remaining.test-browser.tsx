/** Delivered reset behavior only: Xenon does not expose the research reset-hook callback API. */
import { Checkbox, RadioGroup } from '@xenon-ui/solid'
import { NumberField } from '@xenon-ui/solid/number-field'
import { TagsInput } from '@xenon-ui/solid/tags-input'
import { Select } from '@xenon-ui/solid/select'
import { Combobox } from '@xenon-ui/solid/combobox'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'c', label: 'Cherry' },
]

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function mount() {
  const container = document.createElement('div')
  document.body.append(container)
  const [owner, setOwner] = createSignal('reset-first')
  const changes = Array.from({ length: 6 }, () => vi.fn())
  let disposed = false
  const dispose = render(
    () => (
      <>
        <form id="reset-first">
          <Checkbox
            aria-label="Enabled"
            name="enabled"
            value="yes"
            form={owner()}
            defaultChecked
            onCheckedChange={changes[0]!}
          />
          <RadioGroup
            aria-label="Color"
            name="color"
            form={owner()}
            defaultValue="red"
            onValueChange={changes[1]!}
          >
            <RadioGroup.Item value="red" aria-label="Red" />
            <RadioGroup.Item value="green" aria-label="Green" />
          </RadioGroup>
          <NumberField name="amount" form={owner()} defaultValue={1} onValueChange={changes[2]!}>
            <NumberField.Input aria-label="Amount" />
          </NumberField>
          <TagsInput
            name="tags"
            form={owner()}
            defaultValue={['alpha']}
            onValueChange={changes[3]!}
          >
            {(state) => (
              <TagsInput.Control aria-label="Tag collection">
                <For each={state.value}>
                  {(_, index) => (
                    <TagsInput.Item index={index()}>
                      <TagsInput.ItemText />
                    </TagsInput.Item>
                  )}
                </For>
                <TagsInput.Input aria-label="Tags" />
              </TagsInput.Control>
            )}
          </TagsInput>
          <Select
            name="selection"
            form={owner()}
            items={items}
            defaultValue="a"
            onValueChange={changes[4]!}
          >
            <Select.Trigger aria-label="Selection">
              <Select.Value />
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                <Select.Item value="a" />
                <Select.Item value="c" />
              </Select.Content>
            </Select.Positioner>
          </Select>
          <Combobox
            name="fruit"
            form={owner()}
            items={items}
            defaultValue="a"
            onValueChange={changes[5]!}
          >
            <Combobox.Input aria-label="Fruit" />
            <Combobox.Value data-testid="fruit-selection" />
            <Combobox.Positioner>
              <Combobox.Content aria-label="Fruit options" />
            </Combobox.Positioner>
          </Combobox>
          <button type="reset">Reset first</button>
        </form>
        <form id="reset-second">
          <button type="reset">Reset second</button>
        </form>
      </>
    ),
    container
  )
  const unmount = () => {
    if (!disposed) {
      disposed = true
      dispose()
    }
  }
  cleanups.push(() => {
    unmount()
    container.remove()
  })
  flush()
  const scope = within(container)
  const first = container.querySelector<HTMLFormElement>('#reset-first')!
  const second = container.querySelector<HTMLFormElement>('#reset-second')!
  const checkbox = scope.getByRole('checkbox', { name: 'Enabled' }) as HTMLInputElement
  const red = scope.getByRole('radio', { name: 'Red' }) as HTMLInputElement
  const green = scope.getByRole('radio', { name: 'Green' }) as HTMLInputElement
  const amount = scope.getByRole('spinbutton', { name: 'Amount' }) as HTMLInputElement
  const tags = scope.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
  const select = scope.getByRole('combobox', { name: 'Selection' })
  const combo = scope.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
  return {
    container,
    scope,
    first,
    second,
    checkbox,
    red,
    green,
    amount,
    tags,
    select,
    combo,
    changes,
    setOwner,
    unmount,
  }
}

type Fixture = ReturnType<typeof mount>

async function mutate(view: Fixture) {
  await settle()
  await userEvent.click(view.checkbox)
  await userEvent.click(view.green)
  await userEvent.fill(view.amount, '2')
  await userEvent.keyboard('{Tab}')
  await userEvent.fill(view.tags, 'beta')
  await userEvent.keyboard('{Enter}')
  await userEvent.click(view.select)
  await userEvent.keyboard('{Escape}')
  await userEvent.keyboard('c')
  await userEvent.fill(view.combo, 'Cher')
  await userEvent.keyboard('{ArrowDown}{Enter}')
  await settle()
  assertState(view, false)
  for (const change of view.changes) expect(change).toHaveBeenCalled()
}

function assertState(view: Fixture, initial: boolean, owner = view.first) {
  expect.soft(view.checkbox.checked).toBe(initial)
  expect.soft(view.checkbox).toHaveAttribute('data-state', initial ? 'checked' : 'unchecked')
  expect.soft(view.red.checked).toBe(initial)
  expect.soft(view.red).toHaveAttribute('data-state', initial ? 'checked' : 'unchecked')
  expect.soft(view.green.checked).toBe(!initial)
  expect.soft(view.green).toHaveAttribute('data-state', initial ? 'unchecked' : 'checked')
  expect.soft(view.amount.value).toBe(initial ? '1' : '2')
  expect.soft(view.amount).toHaveAttribute('aria-valuenow', initial ? '1' : '2')
  expect
    .soft(
      [
        ...view.scope
          .getByLabelText('Tag collection')
          .querySelectorAll('[data-part="item"][data-value]'),
      ].map((item) => item.getAttribute('data-value'))
    )
    .toEqual(initial ? ['alpha'] : ['alpha', 'beta'])
  expect.soft(view.select.textContent).toBe(initial ? 'Apple' : 'Cherry')
  expect.soft(view.combo.value).toBe(initial ? 'Apple' : 'Cherry')
  expect
    .soft(view.scope.getByTestId('fruit-selection').textContent)
    .toBe(initial ? 'Apple' : 'Cherry')
  const data = new FormData(owner)
  expect.soft(data.get('enabled')).toBe(initial ? 'yes' : null)
  expect.soft(data.get('color')).toBe(initial ? 'red' : 'green')
  expect.soft(data.get('amount')).toBe(initial ? '1' : '2')
  expect.soft(data.getAll('tags')).toEqual(initial ? ['alpha'] : ['alpha', 'beta'])
  expect.soft(data.get('selection')).toBe(initial ? 'a' : 'c')
  expect.soft(data.get('fruit')).toBe(initial ? 'a' : 'c')
}

for (const mode of [
  'plain',
  'stop propagation',
  'capture cancellation',
  'late bubble cancellation',
] as const) {
  test(`form.forms.6 delivered controls handle native reset with ${mode}`, async () => {
    const view = mount()
    await mutate(view)
    const before = view.changes.map((change) => change.mock.calls.length)
    const observed = vi.fn((event: Event) => {
      expect(event.bubbles).toBe(true)
      expect(event.cancelable).toBe(true)
      if (mode === 'stop propagation') event.stopPropagation()
      if (mode === 'capture cancellation' || mode === 'late bubble cancellation')
        event.preventDefault()
    })
    const target = mode === 'late bubble cancellation' ? window : view.first
    const capture = mode === 'capture cancellation'
    target.addEventListener('reset', observed, capture)
    cleanups.push(() => target.removeEventListener('reset', observed, capture))
    await userEvent.click(view.scope.getByRole('button', { name: 'Reset first' }))
    await settle()
    expect(observed).toHaveBeenCalledTimes(1)
    assertState(view, mode === 'plain' || mode === 'stop propagation')
    expect(view.changes.map((change) => change.mock.calls.length)).toEqual(before)
  })
}

test('form.forms.6 delivered reset subscriptions follow current form ownership', async () => {
  const view = mount()
  await mutate(view)
  const before = view.changes.map((change) => change.mock.calls.length)
  view.setOwner('reset-second')
  await settle()
  await userEvent.click(view.scope.getByRole('button', { name: 'Reset first' }))
  await settle()
  assertState(view, false, view.second)
  await userEvent.click(view.scope.getByRole('button', { name: 'Reset second' }))
  await settle()
  assertState(view, true, view.second)
  expect(view.changes.map((change) => change.mock.calls.length)).toEqual(before)
})

test('form.forms.6 disposing controls during reset dispatch leaves no late errors or change callbacks', async () => {
  const view = mount()
  await mutate(view)
  const before = view.changes.map((change) => change.mock.calls.length)
  const errors = vi.fn()
  window.addEventListener('error', errors)
  cleanups.push(() => window.removeEventListener('error', errors))
  view.first.addEventListener('reset', () => view.unmount(), { once: true })
  view.first.reset()
  await settle()
  expect(view.container.childElementCount).toBe(0)
  expect(errors).not.toHaveBeenCalled()
  expect(view.changes.map((change) => change.mock.calls.length)).toEqual(before)
})
