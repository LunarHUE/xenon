import { renderToString } from '@solidjs/web'
import { Listbox } from './listbox'
import { CheckboxGroup } from '../checkbox-group/checkbox-group'
import { Field } from '../field/field'

/** Server-only fixtures loaded with Vite's SSR transform, matching the suite server. */
export function renderListbox() {
  return renderToString(() => (
    <Listbox id="custom-list" defaultValue="a b" aria-label="Letters">
      <Listbox.Item value="a b">A B</Listbox.Item>
      <Listbox.Item value="a-b">A-B</Listbox.Item>
    </Listbox>
  ))
}
/** Exercises associations whose targets render after the group's opening tag. */
export function renderCheckboxGroup() {
  return renderToString(() => (
    <CheckboxGroup id="custom-group" defaultValue={['a']} invalid>
      <CheckboxGroup.Label id="custom-label">Choices</CheckboxGroup.Label>
      <CheckboxGroup.Description id="custom-description">Pick one</CheckboxGroup.Description>
      <CheckboxGroup.Error id="custom-error">Missing</CheckboxGroup.Error>
      <Field id="item-a">
        <Field.Label>Apple</Field.Label>
        <CheckboxGroup.Item value="a" />
      </Field>
      <CheckboxGroup.Item value="b" aria-label="Banana" />
    </CheckboxGroup>
  ))
}

import { Select } from '../select'
import { Combobox } from '../combobox'
const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
]
/** Checks initial select display, virtual focus, and native form state before hydration. */
export function renderSelect() {
  return renderToString(() => (
    <Select items={fruits} defaultValue="pear" defaultOpen name="fruit">
      <Select.Trigger id="select-trigger" aria-label="Fruit">
        <Select.Value />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Content id="select-options">
          <Select.Item value="apple" />
          <Select.Item value="pear" id="selected-pear" />
        </Select.Content>
      </Select.Positioner>
    </Select>
  ))
}
/** Checks the editable selected label and form mirror before hydration. */
export function renderCombobox() {
  return renderToString(() => (
    <Combobox items={fruits} defaultValue="pear" defaultOpen name="fruit">
      <Combobox.Input id="combo-input" aria-label="Fruit" />
      <Combobox.Positioner>
        <Combobox.Content id="combo-options">
          <Combobox.Item value="pear" id="combo-pear">
            Pear
          </Combobox.Item>
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
}

/** Checks popup-search associations before the input or dialog has mounted in a browser. */
export function renderPopupCombobox() {
  return renderToString(() => (
    <Field>
      <Field.Label>Fruit</Field.Label>
      <Combobox items={fruits} inputPlacement="popup" defaultValue="pear" defaultOpen name="fruit">
        <Combobox.Trigger id="popup-combo-trigger">
          <Combobox.Value />
        </Combobox.Trigger>
        <Combobox.Positioner>
          <Combobox.Content id="popup-combo-dialog" aria-label="Choose fruit">
            <Combobox.Input id="popup-combo-search" aria-label="Search fruit" />
            <Combobox.Viewport id="popup-combo-options" aria-label="Fruit options" />
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    </Field>
  ))
}
