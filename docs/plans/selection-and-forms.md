# Selection and forms

Build Listbox, Select, Combobox, and CheckboxGroup in separate tested commits,
with public API TSDoc included in each slice.

- Listbox owns option selection, enabled-item navigation, range selection, and
  typeahead. It supports roving focus and virtual focus.
- Select and Combobox take an explicit collection of string values and labels.
  This keeps labels and native form options available while the popup is closed.
  Item markup can remain compound and customizable.
- Select is a select-only combobox; Combobox is an editable single-selection
  combobox. Both keep focus on their control and use active descendants.
- Click commits options. Arrow navigation only changes the active option. Tab
  dismisses without committing; Escape dismisses. Disabled items are skipped.
- Combobox supports list filtering and consumer filtering, without inline
  completion, free-form submission, multiple selection, or virtualization in
  this pass. Text editing keys and composition remain browser-owned.
- CheckboxGroup represents an array of values with independent tab stops.
  Required means at least one checked item, rather than every item checked.
- Field state and native form submission/reset/validation remain shared concerns.
  Positioning and layer hosting reuse existing engines with listbox semantics.

Validation accompanies each component: pure core behavior, Solid reactive and
form integration, public subpath builds, then real Chromium and WebKit input
coverage for focus, keyboard navigation, dismissal, and native forms.

## Delivered API

Each component has its own `@xenon-ui/solid/<component>` entrypoint.

```tsx
import { Select } from '@xenon-ui/solid/select'
import { Combobox } from '@xenon-ui/solid/combobox'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
]

<Select items={fruits} name="fruit" required>
  <Select.Trigger aria-label="Fruit">
    <Select.Value placeholder="Choose a fruit" />
  </Select.Trigger>
  <Select.Positioner>
    <Select.Content>
      <Select.Item value="apple" />
      <Select.Item value="pear" />
    </Select.Content>
  </Select.Positioner>
</Select>

<Combobox items={fruits} name="fruit" required>
  <Combobox.Input aria-label="Fruit" />
  <Combobox.Positioner>
    <Combobox.Content aria-label="Fruit suggestions" />
  </Combobox.Positioner>
</Combobox>
```

Combobox.Content renders filtered labels by default. Supply Combobox.Item
children for custom markup; nonmatching items receive `hidden`. Selection and
input text are separate: typing searches, and clicking or accepting a highlighted
option commits the submitted value. An existing selection remains submitted
while the user searches. Required validation checks that committed selection.
This is a selection control, not a free-form autocomplete field.

Select clamps navigation; Listbox and Combobox wrap by default. Listbox and
Combobox expose `loop={false}`. Select and Listbox typeahead use a 700ms idle
reset. Select supports closed typeahead selection. Both popup controls use
virtual focus, preserving native Tab navigation from their trigger or input.
Option values for Select and Combobox are nonempty strings; the empty native
value is reserved for no selection.

CheckboxGroup supports ordinary Checkbox children with string values and its
own Item, Label, Description, and Error parts. Independent nested Fields can
name each checkbox. Group descriptions/errors augment item descriptions, while
group labels name the group. Disabled and readonly flags propagate; required
means at least one selection. An explicit item-level required remains an
independent constraint.

## Remaining variants

Select and Combobox are single-selection in this pass. Multiple popup selection,
inline autocomplete, free-form values, groups, loading announcements, and
virtualized collections remain separate work. Listbox's detailed supported and
deferred map is in `listbox-coverage.md`. Calendar and tooltip APIs remain outside
this pass.

## Verification

- Full core, DOM, Solid, and jsdom conformance runs pass.
- Full Chromium and WebKit browser run: 190 files, 1,800 passing tests.
  This includes eight selection/form scenarios in each engine, with native
  keyboard, pointer, validation, reset, and axe checks.
- Four server-transform tests verify initial selection and custom associations
  for Listbox, CheckboxGroup, Select, and Combobox.
- Package typechecks, lint, formatting, and public subpath builds pass. Button-only
  imports exclude the new component families.
- Core and Solid public API/member documentation audits report no missing comments;
  local TSDoc links resolve. The executable Select entrypoint is included.

The tests caught and fixed DOM-order navigation, range-anchor removal, duplicate
controlled focus callbacks, native controlled-value repair, arrow ref duplication,
late reset cancellation, and nested server description references. Browser tests
exercise client rendering; server tests do not claim hydration coverage for these
new components. Native operating-system IME and assistive-technology interaction
remain outside these automated checks.
