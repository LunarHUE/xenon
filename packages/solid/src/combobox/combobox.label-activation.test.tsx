import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { Field } from '../field'
import { Select } from '../select'
import { Combobox } from './combobox'

afterEach(cleanup)

const items = [{ value: 'apple', label: 'Apple' }]

function Parts() {
  return (
    <>
      <Combobox.Trigger>
        <Combobox.Value placeholder="Choose fruit" />
      </Combobox.Trigger>
      <Combobox.Positioner>
        <Combobox.Content>
          <Combobox.Input aria-label="Search fruit" />
          <Combobox.Viewport />
        </Combobox.Content>
      </Combobox.Positioner>
    </>
  )
}

test('a native Field label focuses the popup search trigger without activating its button', () => {
  const opened = vi.fn()
  const view = render(() => (
    <Field>
      <Field.Label>Fruit</Field.Label>
      <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
        <Parts />
      </Combobox>
    </Field>
  ))
  flush()
  const trigger = view.getByRole('combobox', { name: 'Fruit' })
  fireEvent.click(view.getByText('Fruit'))
  flush()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveFocus()
  expect(opened).not.toHaveBeenCalled()
  expect(view.queryByRole('dialog')).toBeNull()
})

test('direct popup-trigger activation still requests opening', () => {
  const opened = vi.fn()
  const view = render(() => (
    <Field>
      <Field.Label>Fruit</Field.Label>
      <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
        <Parts />
      </Combobox>
    </Field>
  ))
  flush()
  fireEvent.click(view.getByRole('combobox', { name: 'Fruit' }))
  flush()
  expect(opened).toHaveBeenCalledExactlyOnceWith(true)
  expect(view.getByRole('combobox', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'true')
})

test('author-canceled label activation changes neither focus nor popup visibility', () => {
  const canceled = vi.fn((event: MouseEvent) => event.preventDefault())
  const opened = vi.fn()
  const view = render(() => (
    <>
      <button>Outside</button>
      <Field>
        <Field.Label onClick={canceled}>Fruit</Field.Label>
        <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
          <Parts />
        </Combobox>
      </Field>
    </>
  ))
  flush()
  const outside = view.getByRole('button', { name: 'Outside' })
  outside.focus()
  fireEvent.click(view.getByText('Fruit'))
  flush()
  expect(canceled).toHaveBeenCalledTimes(1)
  expect(outside).toHaveFocus()
  expect(opened).not.toHaveBeenCalled()
})

for (const fieldDisabled of [false, true]) {
  test(`disabled ${fieldDisabled ? 'Field' : 'Combobox'} label activation does not focus or open`, () => {
    const opened = vi.fn()
    const view = render(() => (
      <>
        <button>Outside</button>
        <Field disabled={fieldDisabled}>
          <Field.Label>Fruit</Field.Label>
          <Combobox
            items={items}
            inputPlacement="popup"
            disabled={!fieldDisabled}
            onOpenChange={opened}
          >
            <Parts />
          </Combobox>
        </Field>
      </>
    ))
    flush()
    const outside = view.getByRole('button', { name: 'Outside' })
    outside.focus()
    fireEvent.click(view.getByText('Fruit'))
    flush()
    expect(outside).toHaveFocus()
    expect(view.getByRole('combobox', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'false')
    expect(opened).not.toHaveBeenCalled()
  })
}

test('an author for override retains native activation of the external button', () => {
  const external = vi.fn()
  const opened = vi.fn()
  const view = render(() => (
    <>
      <button id="label-external-button" onClick={external}>
        External
      </button>
      <Field>
        <Field.Label for="label-external-button">Fruit</Field.Label>
        <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
          <Parts />
        </Combobox>
      </Field>
    </>
  ))
  flush()
  fireEvent.click(view.getByText('Fruit'))
  flush()
  expect(external).toHaveBeenCalledTimes(1)
  expect(opened).not.toHaveBeenCalled()
})

test('interactive label descendants retain their own activation without focusing or opening the popup', () => {
  const clicked = vi.fn()
  const opened = vi.fn()
  const view = render(() => (
    <>
      <button>Outside</button>
      <Field>
        <Field.Label>
          Fruit{' '}
          <a href="#fruit-help" onClick={clicked}>
            Help
          </a>
        </Field.Label>
        <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
          <Parts />
        </Combobox>
      </Field>
    </>
  ))
  flush()
  const outside = view.getByRole('button', { name: 'Outside' })
  outside.focus()
  fireEvent.click(view.getByRole('link', { name: 'Help' }))
  flush()
  expect(clicked).toHaveBeenCalledTimes(1)
  expect(outside).toHaveFocus()
  expect(opened).not.toHaveBeenCalled()
})

test('ordinary Field buttons and native checkboxes preserve native label activation', () => {
  const activated = vi.fn()
  const view = render(() => (
    <>
      <Field>
        <Field.Label>Action</Field.Label>
        <Field.Control as="button" type="button" onClick={activated}>
          Run
        </Field.Control>
      </Field>
      <Field>
        <Field.Label>Enabled</Field.Label>
        <Field.Control type="checkbox" />
      </Field>
    </>
  ))
  flush()
  fireEvent.click(view.getByText('Action'))
  fireEvent.click(view.getByText('Enabled'))
  flush()
  expect(activated).toHaveBeenCalledTimes(1)
  expect(view.getByRole('checkbox', { name: 'Enabled' })).toBeChecked()
})

test('a reactive trigger id keeps the Field label associated with its opted-in current element', () => {
  const [id, setId] = createSignal('combo-label-first')
  const opened = vi.fn()
  const view = render(() => (
    <Field>
      <Field.Label>Fruit</Field.Label>
      <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
        <Combobox.Trigger id={id()}>
          <Combobox.Value placeholder="Choose fruit" />
        </Combobox.Trigger>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Input aria-label="Search fruit" />
            <Combobox.Viewport />
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    </Field>
  ))
  flush()
  const trigger = view.getByRole('combobox', { name: 'Fruit' })
  const label = view.getByText('Fruit')
  expect(label).toHaveAttribute('for', 'combo-label-first')
  setId('combo-label-second')
  flush()
  expect(trigger.id).toBe('combo-label-second')
  expect(label).toHaveAttribute('for', 'combo-label-second')
  fireEvent.click(label)
  flush()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(opened).not.toHaveBeenCalled()
})

test('removing the latest popup control restores the earlier registered native button label behavior', () => {
  const [present, setPresent] = createSignal(false)
  const activated = vi.fn()
  const opened = vi.fn()
  const view = render(() => (
    <Field>
      <Field.Label>Control</Field.Label>
      <Field.Control as="button" id="earlier-label-control" type="button" onClick={activated}>
        Run
      </Field.Control>
      <Show when={present()}>
        <Combobox items={items} inputPlacement="popup" onOpenChange={opened}>
          <Parts />
        </Combobox>
      </Show>
    </Field>
  ))
  flush()
  setPresent(true)
  flush()
  const label = view.getByText('Control')
  const trigger = view.getByRole('combobox', { name: 'Control' })
  expect(label).toHaveAttribute('for', trigger.id)
  fireEvent.click(label)
  flush()
  expect(trigger).toHaveFocus()
  expect(opened).not.toHaveBeenCalled()
  expect(activated).not.toHaveBeenCalled()
  setPresent(false)
  flush()
  expect(trigger.isConnected).toBe(false)
  expect(label).toHaveAttribute('for', 'earlier-label-control')
  fireEvent.click(label)
  flush()
  expect(activated).toHaveBeenCalledTimes(1)
  expect(opened).not.toHaveBeenCalled()
})

test('Select retains native Field label activation and opens its listbox', () => {
  const opened = vi.fn()
  const view = render(() => (
    <Field>
      <Field.Label>Fruit</Field.Label>
      <Select items={items} onOpenChange={opened}>
        <Select.Trigger>
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content>
            <Select.Item value="apple" />
          </Select.Content>
        </Select.Positioner>
      </Select>
    </Field>
  ))
  flush()
  fireEvent.click(view.getByText('Fruit'))
  flush()
  expect(view.getByRole('combobox', { name: 'Fruit' })).toHaveAttribute('aria-expanded', 'true')
  expect(opened).toHaveBeenCalledExactlyOnceWith(true)
})
