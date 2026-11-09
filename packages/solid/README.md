# @xenon-ui/solid

Headless, accessible components for Solid 2. Each component ships behavior,
keyboard handling and ARIA wiring. You bring the markup and the styles.

```sh
bun add @xenon-ui/solid
```

`solid-js` and `@solidjs/web` 2.0 are peer dependencies.

Host props use Solid's native types, including host-specific refs and `class`
values. Refs support nested callback arrays. Native boolean attributes consumed
by behavior treat `true` and `""` as enabled. Native event handlers support
functions and bound tuples; consumer handlers run first and can cancel matching
core behavior with `preventDefault()`. The adapter adds no `classList` compatibility.

Button defaults to `type="button"` when the prop is omitted. Explicit
`type={undefined}` removes the attribute, restoring the host's native default.
Button and input hosts accept `button`, `submit`, and `reset` types.

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

### What the Vite dev server loads

Under the `solid` condition the whole package is one file, `src/index.jsx`,
with JSX left for your Solid plugin to compile. Each subpath such as
`@xenon-ui/solid/dialog` is a one-line re-export from that file. The bundle
imports `@xenon-ui/core` and `@xenon-ui/dom` by their package roots only, and
each of those packages is also one bundled file with one-line subpath
re-exports.

The Solid plugin excludes any package with a `solid` export condition from
Vite's dependency pre-bundling, so the dev server serves this package as
source. That is by design: JSX has to be compiled per environment, DOM for the
client and server codegen for SSR. A page that uses five components makes
about six requests to this package: the bundle plus one re-export per subpath.

`@xenon-ui/core` and `@xenon-ui/dom` are plain ESM with no JSX, so they can be
pre-bundled. Vite does not do that on its own, for two reasons that live
outside this package:

- Vite registers a dependency for pre-bundling only when the importer is
  outside `node_modules`. The import from this package's bundle never counts.
- The Solid plugin uses vitefu to deep-include dependencies of framework
  packages, but vitefu only includes packages that look like CommonJS (no
  `exports` field, no `module` field), and the plugin then drops any include
  that passes through a package depending on `solid-js`, which this one does.

So with no config, core and dom arrive as one raw file each, two requests in
total. To fold them into `.vite/deps`, add these two entries. They are static; nothing needs to
walk this package's files:

```ts
import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    include: ['@xenon-ui/solid > @xenon-ui/core', '@xenon-ui/solid > @xenon-ui/dom'],
  },
})
```

Do not list core and dom subpaths; the bundle imports the roots and the roots
export everything.
