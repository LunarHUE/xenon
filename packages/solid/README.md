# @xenon-ui/solid

Headless, accessible components for Solid 2. Each component ships behavior,
keyboard handling and ARIA wiring. You bring the markup and the styles.

```sh
bun add @xenon-ui/solid
```

`solid-js` and `@solidjs/web` 2.0 are peer dependencies.

```tsx
import { Dialog } from '@xenon-ui/solid/dialog'

function Confirm() {
  return (
    <Dialog>
      <Dialog.Trigger>Delete</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Viewport>
          <Dialog.Content>
            <Dialog.Title>Delete this file?</Dialog.Title>
            <Dialog.Description>This cannot be undone.</Dialog.Description>
            <Dialog.Close>Cancel</Dialog.Close>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  )
}
```

Import from a subpath such as `@xenon-ui/solid/dialog` to keep unrelated
components out of your bundle. The package root re-exports everything.

## What's in 0.1

Accordion, AlertDialog, Avatar, Breadcrumbs, Button, Calendar, Checkbox,
CheckboxGroup, Collapsible, Combobox, ContextMenu, Dialog, Drawer, Editable,
Field, HoverCard, Listbox, Menu, Menubar, Meter, NavigationMenu, NumberField,
Pagination, PinInput, Popover, Progress, RadioGroup, RangeCalendar, Resizable,
ScrollArea, Select, Separator, Slider, Switch, Tabs, TagsInput, Toast, Toggle,
ToggleGroup, Toolbar, Tooltip, plus AccessibleIcon and VisuallyHidden.

This is a pre-release. APIs can still move before 1.0.

## Bundler notes

The package exports a `solid` condition pointing at JSX source. Vite with
`@solidjs/vite-plugin` picks that up and compiles the components with your own
Solid version. Server rendering needs the plugin's `ssr: true` option so the
server environment gets server codegen. Other bundlers get a precompiled ESM
build, which is a client build: importing it in Node throws for any component
that creates DOM templates at module load.
