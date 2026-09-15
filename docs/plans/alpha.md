# 0.1.0 alpha scope

The alpha ships headless behavior and composable parts. Consumers own their
application's input, button, popover and calendar composition. A packaged
DatePicker or DateRangePicker is not required for the release. Segmented date
editing would add new behavior, but DateField and DateRangeField are deferred too.

Search, password and other native input compositions do not need dedicated
wrappers merely to complete a component inventory. Field.Control already supplies
shared labels, descriptions and field state around native controls.

## Completed utility and layout scope

- Common utilities: Avatar, VisuallyHidden, AccessibleIcon, Pagination,
  Breadcrumbs and Meter.
- Layout interactions: ScrollArea and Resizable/Splitter (`Resizable` is the
  public name).

These eight families now have public Solid subpaths, TSDoc, tests and example
studies. Meter, Pagination, Breadcrumbs and Resizable add pure core behavior;
Resizable and ScrollArea use framework-free DOM interactions. Avatar and the
accessibility wrappers need no separate core engine. ScrollArea preserves native
scrolling and exposes optional custom tracks.

Chromium and WebKit coverage exercises layout measurement, native keyboard and
mouse/wheel input, plus explicitly synthetic pointer-cancellation cases. Each
family's coverage document records the remaining boundaries. Passing axe scans
and browser tests does not substitute for assistive-technology or native touch
checks before broader accessibility claims.

No additional engine or component family is required by this alpha scope.
Release preparation still needs a packaging/versioning review and consumer-facing
usage documentation; this plan does not declare the packages published.

## Example coverage

Every implemented consumer-facing component should have a usable study in the
example app. The selection pass adds the previously missing CheckboxGroup,
Listbox, Select and Combobox as studies 33 through 36. Utilities and layout add
studies 37 through 44. Shared engines do not need
separate visual demos when their consumers already exercise them.

## Later versions

TreeView, Table/DataGrid, GridList, ColorPicker, Carousel, Command and further
input families are outside the alpha component scope. Packaged picker composition
and advanced selection variants can be considered later; they are not release
requirements.
