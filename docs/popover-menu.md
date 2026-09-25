# Popover and Menu

Popover and Menu compose the existing positioning, presence, and layering engines.
Their public modules are independent: `@xenon-ui/solid/popover` and
`@xenon-ui/solid/menu`, with corresponding pure core modules. Both are also exported
from the package barrels. Tooltip is reserved for a separate API discussion;
this pass introduces no shared trigger provider or trigger payload API.

## Shared hosting

Both families expose an explicit `Positioner` around `Content`. Positioner is a
native `div popover="manual"` in the browser's top layer. It stays in its original
DOM location, preserving form ownership and context without a portal. xenon's
layer stack owns dismissal rather than native automatic popover dismissal.

The wrapper owns fixed positioning and receives the [positioning options](positioning.md):
side, alignment, offsets, collision handling, boundaries, sizing, and update
policy. Content owns semantics and animations. Apply transforms to Content so
animation does not change the measured wrapper. Native popover margins, borders,
padding, and inset are reset on Positioner; author styles can customize them.

The wrapper enters the top layer before measurement. It remains invisible and
noninteractive until positioning succeeds, and initial focus waits for that
result. Closed force-mounted content remains hidden and inactive. During exit
animations the layer stays registered; modal locks remain until physical exit.

`@xenon-ui/dom/floating-layer` combines native hosting, focus scopes, modal locks,
and the layer registry. Positioning stays separate. It recognizes nested DOM
layers and explicit logical parents, treats the active trigger as an inside
branch, and preserves focus placed on an outside control during dismissal.
External `hidePopover()` requests a state change; a controlled owner that refuses
closure causes the native popover to reopen.

## Popover

```tsx
import { Popover } from '@xenon-ui/solid/popover'

;<Popover>
  <Popover.Trigger>Edit profile</Popover.Trigger>
  <Popover.Positioner side="bottom" align="start" sideOffset={8}>
    <Popover.Content>
      <Popover.Title>Profile</Popover.Title>
      <Popover.Description>Update your display name.</Popover.Description>
      <label>Name <input /></label>
      <Popover.Close aria-label="Save profile">Save</Popover.Close>
    </Popover.Content>
  </Popover.Positioner>
</Popover>
```

`Popover` and `Popover.Root` are aliases. The root supports `open`, `defaultOpen`,
`onOpenChange`, `forceMount`, and `modal` (default false). Content has dialog
semantics and is named by Title or author ARIA attributes. Description is optional.
Author IDs and attributes take precedence; associations work during server
rendering and hydration. Trigger and Close use Button's host and disabled rules.
Close defaults to the accessible name "Close popover"; supply `aria-label` to
replace it.

Opening normally focuses the first focusable control, falling back to Content.
`initialFocus` accepts an element or false, and `finalFocus` can replace the
closing focus target. Nonmodal content uses normal Tab order; leaving it by
keyboard closes it without moving focus back. Modal content contains focus and
locks the background. Escape and matched outside pointer presses dismiss by
default. `closeOnEscape`, `closeOnOutside`, and `closeOnFocusOutside` can disable
those behaviors. The corresponding `onEscapeKeyDown`, `onPointerOutside`, and
`onFocusOutside` handlers can cancel individual dismissal requests.

`Popover.Anchor` supplies a different geometric anchor from Trigger.
`Popover.Arrow` registers an HTML element with the positioning engine; consumer
CSS supplies the arrow artwork. Content exposes the resolved `data-side`,
`data-align`, and `data-placement`; positioning custom properties inherit from
the wrapper. Multiple triggers track the active trigger for expansion,
positioning, and focus restoration.

For an arrow that tucks behind the panel border, the example gives animated
Content `isolation: isolate` and renders the arrow beside an inner panel surface.
The surface owns the background and border. This keeps the diamond behind the
panel during opacity animations as well as after they finish; putting a negative
z-index arrow directly inside an animated opaque panel changes that paint order.

## Menu

```tsx
import { Menu } from '@xenon-ui/solid/menu'

;<Menu>
  <Menu.Trigger>Actions</Menu.Trigger>
  <Menu.Positioner>
    <Menu.Content>
      <Menu.Item onSelect={() => duplicate()}>Duplicate</Menu.Item>
      <Menu.CheckboxItem defaultChecked>Show details</Menu.CheckboxItem>
      <Menu.Sub>
        <Menu.SubTrigger>Export</Menu.SubTrigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item onSelect={() => exportPDF()}>PDF</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Sub>
    </Menu.Content>
  </Menu.Positioner>
</Menu>
```

Menu's root is a provider. It supports controlled and uncontrolled opening,
`forceMount`, `dir`, and `loop` (default true). Menus are nonmodal. Content is
named by Trigger unless the author supplies an accessible name. The first menu
defaults to bottom/start; submenus default to the inline end side/start.

Enter, Space, and ArrowDown open onto the first item; ArrowUp opens onto the
last. Items use roving focus, with ArrowUp/Down, Home/End, wrapping, and buffered
typeahead. Repeated letters cycle matches. `textValue` overrides visible text
for matching. Disabled items remain focusable through arrow navigation but
cannot activate. Composition and modified typing do not trigger typeahead.

Item defaults to a button; `as="a"` retains normal link navigation. `onSelect`
receives a cancelable event. Preventing it cancels both selection and dismissal.
Actions close the complete menu chain by default. CheckboxItem and RadioItem
stay open by default; `closeOnSelect` overrides either policy. CheckboxItem
supports controlled/uncontrolled checked state, including `"mixed"`. RadioGroup
supports a bare string value and `onValueChange`; its RadioItems supply values.
ItemIndicator renders for checked or mixed state, or with `forceMount`.
Group, GroupLabel, and Separator supply structural parts.

The inline-end arrow opens a submenu and the inline-start arrow returns to its
trigger, respecting RTL. Escape closes only the current menu. Tab closes the
entire chain and lets the browser move from the root trigger to the adjacent
tab stop; Shift+Tab moves backward. Pointer movement highlights items. Submenu
hover opening waits 150ms; leaving has a 200ms grace period to cross into the
submenu. This is a timed grace period, not a geometric safe polygon.

The keyboard model follows the [APG menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
and [menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).
Context menus and menubars are separate future components.
