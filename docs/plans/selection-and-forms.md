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
