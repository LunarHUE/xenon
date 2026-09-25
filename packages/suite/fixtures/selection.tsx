import { CheckboxGroup, Combobox, Listbox, Select } from '@xenon-ui/solid'
import type { JSX } from '@solidjs/web'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Unavailable', disabled: true },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
]
const surface = { background: 'white', padding: '12px', 'min-width': '160px' }

/** Inputs for disabled-control browser coverage. */
export interface SelectionFixtureProps {
  /** Disables all four selection controls, leaving surrounding form buttons enabled. */
  disabled?: boolean
}

/** Dedicated browser fixture. Every form prevents navigation while retaining native validation. */
export function SelectionFixture(props: SelectionFixtureProps = {}): JSX.Element {
  return (
    <main style={{ padding: '24px', display: 'grid', gap: '32px' }}>
      <form id="select-form" onSubmit={(event) => event.preventDefault()}>
        <Select disabled={props.disabled} items={items} name="fruit" required>
          <Select.Trigger aria-label="Select fruit">
            <Select.Value placeholder="Choose fruit" />
          </Select.Trigger>
          <Select.Positioner>
            <Select.Content style={surface}>
              <Select.Item value="apple" />
              <Select.Item value="blocked" />
              <Select.Item value="pear" />
              <Select.Item value="plum" />
            </Select.Content>
          </Select.Positioner>
        </Select>
        <button type="submit">Submit select</button>
        <button type="reset">Reset select</button>
      </form>
      <form id="combobox-form" onSubmit={(event) => event.preventDefault()}>
        <Combobox disabled={props.disabled} items={items} name="fruit" required>
          <Combobox.Input aria-label="Search fruit" />
          <Combobox.Positioner>
            <Combobox.Content aria-label="Search fruit" style={surface} />
          </Combobox.Positioner>
        </Combobox>
        <button type="submit">Submit combobox</button>
        <button type="reset">Reset combobox</button>
      </form>
      <Listbox disabled={props.disabled} aria-label="Fruit basket" selectionMode="multiple">
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="blocked" disabled>
          Unavailable
        </Listbox.Item>
        <Listbox.Item value="pear">Pear</Listbox.Item>
        <Listbox.Item value="plum">Plum</Listbox.Item>
      </Listbox>
      <form id="checkbox-form" onSubmit={(event) => event.preventDefault()}>
        <CheckboxGroup disabled={props.disabled} name="fruit" required>
          <CheckboxGroup.Label>Fruit choices</CheckboxGroup.Label>
          <label>
            <CheckboxGroup.Item value="apple" />
            Apple
          </label>
          <label>
            <CheckboxGroup.Item value="pear" />
            Pear
          </label>
        </CheckboxGroup>
        <button type="submit">Submit checkboxes</button>
        <button type="reset">Reset checkboxes</button>
      </form>
    </main>
  )
}
