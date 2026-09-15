# 0.1.0 alpha scope

The alpha ships headless behavior and composable parts. Consumers own their
application's input, button, popover and calendar composition. A packaged
DatePicker or DateRangePicker is not required for the release. Segmented date
editing would add new behavior, but DateField and DateRangeField are deferred too.

Search, password and other native input compositions do not need dedicated
wrappers merely to complete a component inventory. Field.Control already supplies
shared labels, descriptions and field state around native controls.

## Remaining component scope

- Common utilities: Avatar, VisuallyHidden, AccessibleIcon, Pagination,
  Breadcrumbs and Meter.
- Layout interactions: ScrollArea and Resizable/Splitter.

Settle each behavioral API before implementation. Utilities can land in small
independent slices. Layout interactions need native Chromium and WebKit coverage
for scrolling, pointer input, keyboard operation and cleanup.

## Example coverage

Every implemented consumer-facing component should have a usable study in the
example app. The selection pass adds the previously missing CheckboxGroup,
Listbox, Select and Combobox as studies 33 through 36. Shared engines do not need
separate visual demos when their consumers already exercise them.

## Later versions

TreeView, Table/DataGrid, GridList, ColorPicker, Carousel, Command and further
input families are outside the alpha component scope. Packaged picker composition
and advanced selection variants can be considered later; they are not release
requirements.
