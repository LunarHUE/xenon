# Styling contract

The union of every `data-*` attribute and CSS custom property the eleven
researched libraries put on the DOM, per component, and a proposed canonical
set for this library.

Source sections: the "Roles and attributes" subsections of every file in
`docs/research/`, plus the Sources inventories in `zag-and-ark.md`,
`radix-and-base-ui.md` and `kobalte-and-corvu.md`.

## How to read this

Library tags are `apg, axe, html, react-aria, radix, base-ui, zag, ark,
ariakit, headlessui, kobalte, corvu, reka, melt, bits`. Zag and Ark share one
attribute surface (Ark renders Zag's props verbatim), so a row tagged `zag`
means both unless Ark is called out separately.

Boolean-shaped attributes are almost always **present with an empty value**
when true and **absent** when false. Counting across the research: 277 bare
`data-disabled` mentions against 48 `data-disabled=""` and 5
`data-disabled="true"`, and the same ratio for `data-highlighted`,
`data-selected`, `data-invalid`, `data-open` and friends. React Aria is the one
library that regularly writes `="true"` (21 of the 44 `data-focus-visible`
mentions). The `=""` form is right. It matches `[data-disabled]` selectors,
never needs a falsy-string check, and a CSS author cannot accidentally match
`data-disabled="false"`.

Where a cell says "per part", the research records the attribute on more than
one part of the component and does not enumerate them exhaustively. Where a
part is named, the research names it.

Namespaced attributes (`data-radix-*`, `data-base-ui-*`, `data-reka-*`,
`data-bits-*`, `data-corvu-*`, `data-kb-*`, `data-melt-*`,
`data-headlessui-*`, `data-react-aria-*`) are listed per component but are not
candidates for our canonical set. They are either internal plumbing markers or
a part-identity scheme; see Structural and identity attributes below.

## Cross-cutting state attributes

These appear on many components and are the real contract. Everything else in
this document is either a specialization of one of these or component-specific
geometry.

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, kobalte, zag, ark, reka, melt, bits | per part; root, trigger, content, item, overlay | `open` (51), `closed` (35), `checked` (50), `unchecked` (20), `on` (18), `off` (8), `active` (10), `indeterminate` (3), `delayed-open` (5), `instant-open` (3), `visible` (2), `loading` (2), `partial`, `hidden` |
| `data-open` | base-ui, corvu, react-aria, bits | popup, panel, trigger (as `data-popup-open`) | present when open |
| `data-closed` | base-ui, kobalte, corvu | popup, panel | present when closed |
| `data-disabled` | radix, base-ui, zag, ark, kobalte, corvu, react-aria, reka, melt, bits, headlessui | per part; root, trigger, item, thumb, control | present when disabled |
| `data-orientation` | radix, base-ui, zag, kobalte, corvu, react-aria, reka, bits | root, and on items that need it | `horizontal` (24), `vertical` (20) |
| `data-side` | radix, base-ui, zag, corvu, reka, bits | positioner or content | `top`, `bottom`, `left`, `right`, plus base-ui's `none` (14) for an untethered popup |
| `data-align` | radix, base-ui, zag, reka | positioner or content | `start`, `center` (3), `end` (2) |
| `data-placement` | zag, ark, kobalte, corvu, react-aria | content or positioner | the full floating-ui placement string: `top`, `left-start`, `bottom-end`, … |
| `data-highlighted` | radix, base-ui, zag, kobalte, reka, melt, bits | item, option, cell | present on the one visually active item |
| `data-selected` | base-ui, zag, react-aria, reka, melt, bits, ariakit, corvu | item, option, tab, cell | present when selected |
| `data-checked` | base-ui, zag, kobalte, headlessui, bits | root, item, indicator | present when checked |
| `data-unchecked` | base-ui | root, item | present when not checked. Base UI writes both halves as separate attributes instead of one `data-state` |
| `data-indeterminate` | base-ui, zag, kobalte, react-aria, headlessui, bits | root, indicator | present in the mixed state |
| `data-current` | base-ui, zag, kobalte | item, link, step, layer | present on the current item; in zag's layering code it marks the topmost layer |
| `data-expanded` | base-ui, zag, kobalte, corvu, react-aria | trigger, panel, viewport | present when expanded |
| `data-pressed` | base-ui, zag, kobalte, react-aria | root, item | present while held, or when a toggle is on (kobalte, zag) |
| `data-focus` | zag, ark, kobalte, react-aria | control, root, item | present while the element or its hidden input has focus |
| `data-focus-visible` | zag, kobalte, react-aria, ariakit | control, root, item, label | present when focus should be visible; react-aria writes `="true"` |
| `data-hover` | zag, kobalte, react-aria | control, item | present while hovered |
| `data-hovered` | react-aria | every RAC component's render props | present while hovered. Same meaning as `data-hover`, different spelling |
| `data-invalid` | radix, base-ui, zag, ark, kobalte, react-aria, reka, melt, bits | root, control, group, input | present when invalid |
| `data-valid` | base-ui, kobalte | root, control | present when valid. base-ui and kobalte both write `data-valid`/`data-invalid` as a pair and neither is present before validation has run |
| `data-required` | base-ui, zag, ark, kobalte, react-aria | root, control | present when required |
| `data-readonly` | base-ui, zag, ark, kobalte, react-aria, reka, melt, bits | root, control | present when read-only |
| `data-dirty` | base-ui | root, trigger, input, group | present once the value has changed from its initial value |
| `data-touched` | base-ui | root, trigger, group | present once the field has been blurred |
| `data-filled` | base-ui, zag | root, trigger, input, group | present when the field has a value |
| `data-placeholder` | base-ui, radix, react-aria, reka, bits | value, trigger, segment | present while showing placeholder text |
| `data-placeholder-shown` | zag | trigger, input, segment | zag's spelling of the same thing |
| `data-empty` | base-ui, zag, react-aria, reka | content, listbox, collection root | present when the collection has no items |
| `data-starting-style` | base-ui, bits | popup, panel, indicator | present for the enter phase, one commit only |
| `data-ending-style` | base-ui, bits | popup, panel, indicator | present for the exit phase, until the animation finishes |
| `data-instant` | base-ui, zag, react-aria | popup, content | present when the transition should be skipped (a fast re-open) |
| `data-transitioning` | base-ui, corvu | popup, content, drawer | present while a transition is running |
| `data-index` | base-ui, zag, reka | item, thumb | the numeric position |
| `data-value` | zag, radix, reka, melt, bits, apg | item, thumb, output | the item's or thumb's value, stringified |
| `data-type` | base-ui, zag, react-aria, reka | item, segment, toast, cell | a discriminator: `week-number`, `primary`, segment kind, toast kind |
| `data-nested` | base-ui, zag, bits | root, layer | present when this instance is inside another of the same kind |
| `data-scrolling` | base-ui, zag | scrollbar, viewport | present while scrolling |
| `data-swiping` | base-ui, zag, reka | root, backdrop, content | present during a swipe gesture; base-ui's backdrop gains and loses it with the gesture |
| `data-swipe-direction` | base-ui, radix, zag, kobalte | root, content | `up`, `down`, `left`, `right` |
| `data-loading` | base-ui, zag | root, item, avatar | present while loading |
| `data-complete` | base-ui, zag, reka | root, indicator, step | present when full or finished |
| `data-today` | zag, corvu, reka | day cell | present on today's date |
| `data-unavailable` | zag, react-aria, reka, melt, bits | day cell, option | present when a value exists but cannot be chosen |
| `data-key` | kobalte, react-aria | item | the collection key |
| `data-active` | radix, base-ui, zag, ark, ariakit, corvu, reka, bits | item, tab, handle, drawer | overloaded: base-ui's tabs use it for the selected tab, zag's drawer for the frontmost one, ariakit for the active composite item, corvu's resizable for the active handle |
| `data-position` | zag, bits | item, thumb, toast | `top`, `bottom`, `left`, `right` |

## Per-component tables

### accordion

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | kobalte, zag, reka, melt, bits | item, trigger, content | `open`, `closed` |
| `data-open` | base-ui | panel | present when open |
| `data-panel-open` | base-ui | trigger | present when this item's panel is open |
| `data-disabled` | radix, base-ui, zag, kobalte, reka, melt, bits | root, item, trigger | present |
| `data-orientation` | zag, kobalte | root, item | `horizontal`, `vertical` |
| `data-expanded` | kobalte | trigger | present |
| `data-collapsed` | corvu | trigger, content | present |
| `data-closed` | kobalte | content | present |
| `data-focus` | zag | item, trigger | present |
| `data-starting-style` / `data-ending-style` | base-ui, bits | panel | enter / exit phase |
| `data-heading-level` | bits | header | the numeric heading level |
| `data-controls` | zag | trigger | the controlled panel's id |
| `data-scope` / `data-part` / `data-ownedby` | zag, ark | every part | see Structural |
| `data-accordion-root` / `-item` / `-header` / `-trigger` / `-content` | bits | matching part | part identity, empty value |
| `data-corvu-accordion-item` / `-trigger` / `-content` | corvu | matching part | part identity |
| `data-corvu-disclosure-trigger` / `-content` | corvu | trigger, content | corvu builds accordion on its disclosure primitive |
| `--accordion-panel-height` | base-ui | panel | `auto` when settled, a px value while transitioning |
| `--kb-accordion-content-height` / `-width` | kobalte | content | measured px |
| `--corvu-disclosure-content-height` / `-width` | corvu | content | measured px |

### alert-dialog

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, reka, melt, bits | content, overlay | `open`, `closed` |
| `data-open` / `data-popup-open` | base-ui | popup / trigger | present |
| `data-modal` | base-ui | popup | present when modal |
| `data-role` | base-ui | popup | the resolved role, so `alertdialog` |
| `data-disable-pointer-dismissal` | base-ui | popup | present when outside pointer dismissal is off |
| `data-starting-style` / `data-ending-style` | base-ui | popup | enter / exit |
| `data-alert-dialog-*` | bits | each part | part identity |

### angle-slider

All zag only.

| Attribute | Part | Values |
| --- | --- | --- |
| `data-state` | root, thumb | machine state |
| `data-value` | root, marker | the numeric angle |
| `data-disabled`, `data-readonly`, `data-invalid` | root, control, thumb | present |
| `--angle`, `--value`, `--marker-value`, `--marker-display-value` | root, marker | the angle in degrees and the marker's normalized position |

### autocomplete

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-highlighted` | base-ui | item | present |
| `data-selected` | base-ui | item | present |
| `data-focused` | base-ui, react-aria | input, root | present |
| `data-focus-visible` | react-aria | input | `true` |
| `data-dirty`, `data-touched`, `data-filled`, `data-valid`, `data-invalid` | base-ui | root, input | present |
| `data-placeholder` | base-ui | value | present |
| `data-empty` | reka | content | present when the filtered list is empty |
| `data-hidden` | reka | item | present when filtered out |

### avatar

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | zag | root, image, fallback | `loaded`, `loading`, `error` |
| `data-status` | bits | root | the same three states, different name |
| `data-loading` / `data-error` | base-ui | image, fallback | present in that state |
| `data-starting-style` / `data-ending-style` | base-ui | image | enter / exit |
| `data-avatar-root` / `-image` / `-fallback` | bits | matching part | part identity |

### button and toggle

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-disabled` | radix, base-ui, kobalte, zag, reka, bits | root | present |
| `data-state` | radix, zag, reka, melt, bits | root (toggle) | `on`, `off` |
| `data-pressed` | react-aria, kobalte, zag | root | present when a toggle is on, or while held in react-aria |
| `data-focus-visible` | ariakit, react-aria | root | present / `true` |
| `data-hovered` | react-aria | root | present |
| `data-autofocus` | headlessui | root | present when autofocused |
| `data-interactive` | headlessui | root | present when the element is interactive |
| `data-toggle-root` | bits | root | part identity |
| `data-button-root` | bits | root | part identity |

### calendar, range-calendar, and the month/year pickers

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-selected` | kobalte, react-aria, reka, melt, bits, zag | day cell | present |
| `data-disabled` | kobalte, react-aria, reka, bits, zag | day cell, nav button | present |
| `data-unavailable` | react-aria, reka, melt, bits, zag | day cell | present |
| `data-today` | kobalte, corvu, reka, zag | day cell | present |
| `data-readonly` | reka, bits | root, cell | present |
| `data-value` | reka | day cell | the ISO date string, e.g. `1980-01-12T00:00:00` |
| `data-date` | react-aria | day cell | the date |
| `data-week` | reka, bits | row | the week number |
| `data-week-index` | zag | row | the zero-based week |
| `data-weekend` | zag | day cell | present |
| `data-in-range` | corvu, zag | day cell | present inside a selected range |
| `data-range-start` / `data-range-end` | corvu, zag | day cell | present on the boundaries |
| `data-in-hover-range`, `data-hover-range-start`, `data-hover-range-end` | zag | day cell | the provisional range while hovering |
| `data-range-highlighted` | melt | day cell | present inside the provisional range |
| `data-highlighted`, `data-highlighted-start`, `data-highlighted-end` | reka, bits | day cell | reka's spelling of the provisional range |
| `data-selection-start` / `data-selection-end` | react-aria, reka, bits | day cell | present on the boundaries |
| `data-outside-month` | melt | day cell | present for a day from a neighbouring month |
| `data-outside-visible-months` | melt | day cell | present for a day outside the visible window |
| `data-outside-visible-view` | reka | day cell | reka's spelling |
| `data-outside-range` | zag | day cell | zag's spelling |
| `data-focus-visible`, `data-hovered`, `data-pressed` | react-aria | day cell | interaction state |
| `data-validation-state` | react-aria | root | `valid`, `invalid` |
| `data-view` | zag | root, table | `day`, `month`, `year` |
| `data-columns` | zag | table | the column count |
| `data-selectable` | zag | day cell | present when the day can be chosen |
| `data-bits-day` | bits | day cell | the formatted date, used as a test hook |
| `data-corvu-calendar-table` / `-cell` / `-celltrigger` / `-headcell` / `-label` / `-nav` | corvu | matching part | part identity |

### carousel

zag only.

| Attribute | Part | Values |
| --- | --- | --- |
| `data-current` | indicator, item | present on the current slide |
| `data-index` | item, indicator | the numeric position |
| `data-inview` | item | present while visible in the viewport |
| `data-dragging` | root, item-group | present during a drag |
| `data-orientation` | root and every part | `horizontal`, `vertical` |
| `data-pressed`, `data-readonly` | control, root | present |
| `--slide-item-size`, `--slide-spacing`, `--slides-per-page` | item-group | computed layout numbers |

### cascade-select

zag only; the fullest state surface in the research.

| Attribute | Part | Values |
| --- | --- | --- |
| `data-state` | root, trigger, content | `open`, `closed` |
| `data-side`, `data-placement` | positioner | placement |
| `data-depth` | content | the submenu nesting depth |
| `data-index-path` | item | the path to this item as a joined index list |
| `data-highlighted`, `data-selected`, `data-disabled` | item | present |
| `data-activedescendant` | content | the highlighted item's id |
| `data-placeholder-shown` | trigger | present |
| `data-focus`, `data-invalid`, `data-readonly` | trigger, root | present |
| `data-type` | item | the item kind |
| `data-value` | item, root | the item value |
| `--available-width`, `--available-height`, `--reference-width`, `--z-index` | positioner | computed geometry |

### checkbox and checkbox-group

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | root, indicator | `checked`, `unchecked`, `indeterminate` |
| `data-checked` | base-ui, kobalte, headlessui, zag, bits | root, indicator | present. Headless UI's `assertCheckbox` requires it present in the checked state, and it is one of only two `data-*` attributes any Headless UI assertion helper checks |
| `data-unchecked` | base-ui | root | present |
| `data-indeterminate` | base-ui, kobalte, react-aria, headlessui, zag | root, indicator | present |
| `data-disabled` | base-ui, kobalte, react-aria, zag, radix | root, control, label | present |
| `data-invalid`, `data-valid` | base-ui, kobalte, react-aria, zag | root, control | present |
| `data-required`, `data-readonly` | base-ui, kobalte, react-aria, zag, reka | root, control | present |
| `data-dirty`, `data-touched`, `data-filled` | base-ui | root, group | present |
| `data-focus`, `data-hover` | zag, kobalte | control | present |
| `data-focused` | base-ui | root | present |
| `data-focus-visible` | kobalte, react-aria, zag | control, root | present / `true` |
| `data-hovered`, `data-pressed`, `data-selected` | react-aria | root | present |
| `data-active` | zag | control | present while held |
| `data-parent` | base-ui | group root | present on a parent checkbox controlling a group |
| `data-hidden` | reka | hidden input | present |
| `data-starting-style` / `data-ending-style` | base-ui | indicator | enter / exit |
| `data-checkbox-root`, `data-checkbox-group`, `data-checkbox-group-label` | bits | matching part | part identity |

### collapsible

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, kobalte, zag, reka, melt, bits | root, trigger, content | `open`, `closed` |
| `data-open` / `data-closed` | base-ui | panel | present |
| `data-panel-open` | base-ui | trigger | present |
| `data-expanded` | kobalte, react-aria | trigger | present |
| `data-collapsed` | corvu | trigger, content | present |
| `data-disabled` | radix, base-ui, react-aria, zag | root, trigger | present |
| `data-focus-visible-within` | react-aria | root | present when a descendant has visible focus |
| `data-starting-style` / `data-ending-style` | base-ui, bits | panel | enter / exit |
| `data-collapsible` | zag | content | present |
| `data-has-collapsed-size` | zag | content | present when a non-zero collapsed size is configured |
| `data-collapsible-root` / `-trigger` / `-content` | bits | matching part | part identity |
| `--collapsible-panel-height` | base-ui | panel | `auto` when settled, px while transitioning |
| `--kb-collapsible-content-height` / `-width` | kobalte | content | measured px |
| `--height` / `--width` / `--collapsed-height` / `--collapsed-width` | zag | content | measured px |
| `--radix-collapsible-content-height` / `-width` | radix | content | measured px |

### color picker family

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-channel` | zag | area, slider, input | the colour channel this part edits |
| `data-state`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`, `data-focus` | zag | per part | present |
| `data-orientation`, `data-placement`, `data-side` | zag | slider, positioner | as elsewhere |
| `data-value` | zag | swatch, slider | the channel value |
| `data-color` | reka | swatch | the colour string |
| `data-color-contrast` | reka | swatch | the computed contrast bucket |
| `data-no-color` | reka | swatch | present when the value is empty |
| `data-state` | reka | swatch-picker item | `checked`, `unchecked` |
| `--color`, `--size`, `--value` | zag | area, slider | the colour and geometry |
| `--reka-color-swatch-color`, `--reka-color-swatch-alpha` | reka | swatch | the colour and alpha |
| `--reka-color-swatch-picker-item-color` | reka | swatch-picker item | the colour |
| `--kb-color-current` | kobalte | root | the current colour |

### combobox

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | zag, reka, melt, bits | root, trigger, content, item | `open`, `closed` |
| `data-open` | base-ui | popup | present |
| `data-highlighted` | base-ui, zag, reka, melt, bits | item | present |
| `data-selected` | base-ui, ariakit, reka, bits | item | present |
| `data-active-item` | ariakit | item | present on the active item; ariakit's virtual-focus marker, and by volume the most common `data-*` in its suite (117 mentions) |
| `data-user-value` / `data-autocomplete-value` | ariakit | input | the text the user typed versus the completed value, so a test can tell inline autocomplete from typing |
| `data-autofill` | ariakit | input | present when the value came from browser autofill |
| `data-empty` | base-ui, zag, reka | content | present when nothing matches |
| `data-list-empty` | base-ui | popup | base-ui's spelling |
| `data-hidden` | reka | item | present when filtered out |
| `data-disabled` | base-ui, kobalte, zag, ariakit | root, trigger, item | present |
| `data-invalid`, `data-readonly`, `data-required` | base-ui, react-aria, zag | root, input | present |
| `data-dirty`, `data-touched`, `data-filled`, `data-valid` | base-ui | root, input | present |
| `data-focused` | base-ui | input | present |
| `data-focus`, `data-focusable` | zag | input, item | present |
| `data-focus-visible` | ariakit | input, item | present |
| `data-placeholder` | base-ui | value | present |
| `data-side` / `data-popup-side` | base-ui, zag | positioner / popup | placement |
| `data-placement` | zag | positioner | the placement string |
| `data-placing` | ariakit | popover | present while the popover is being positioned, before the first paint at its final spot |
| `data-visible` | base-ui, ariakit | popup | present when visible |
| `data-enter` / `data-leave` | ariakit | popover | the enter and exit phases, ariakit's equivalent of starting/ending style |
| `data-starting-style` / `data-ending-style` | base-ui | popup | enter / exit |
| `data-manipulation` | base-ui | input | present during composition or a touch manipulation |
| `data-key` | kobalte | item | the collection key |
| `data-value` | zag | item | the item value |
| `data-base-ui-inert`, `data-base-ui-scroll-locked` | base-ui | outside elements, html | plumbing |
| `data-reka-collection-item` | reka | item | collection registration marker |
| `data-melt-combobox-option` | melt | item | part identity |
| `--available-height` | base-ui | positioner | px |
| `--popover-available-height`, `--popover-overflow-padding` | ariakit | popover | px |

### context-menu

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, bits | content, item | `open`, `closed` |
| `data-popup-open` | base-ui | trigger | present |
| `data-side` | radix | content | placement |
| `data-disabled` | base-ui, reka | item | present |
| `data-current` | zag | item | present |
| `data-value` | zag | item | the item value |
| `data-radix-popper-content-wrapper` | radix | positioner wrapper | part identity |
| `data-base-ui-inert`, `data-base-ui-portal` | base-ui | outside elements, portal | plumbing |
| `data-context-menu-*`, `data-context-menu-sub-content` | bits | each part | part identity |

### date-field, date-input, time-field

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-type` | react-aria, zag | segment | the segment kind (`year`, `month`, `day`, `hour`, …), plus `week-number` in zag |
| `data-placeholder` | react-aria, reka | segment | present while the segment is empty. Base UI's note is that the segment **keeps** `data-placeholder` until it has a real value |
| `data-placeholder-shown` | zag | input, segment | zag's spelling |
| `data-invalid`, `data-readonly`, `data-required`, `data-disabled` | react-aria, zag, reka | root, segment | present |
| `data-focus`, `data-editable` | zag | segment | present |
| `data-focus-visible`, `data-hovered` | react-aria | segment | present |
| `data-validation-state` | react-aria | root | `valid`, `invalid` |
| `data-value` | zag | segment | the segment value |
| `data-a11y-ignore` | react-aria | segment | tells the repo's own axe runs to skip this node |
| `data-react-aria-prevent-focus` | react-aria | segment wrapper | plumbing |
| `data-segment` | bits, melt | segment | part identity |
| `data-reka-date-field-segment`, `data-reka-time-field-segment` | reka | segment | part identity |

### dialog

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | content, overlay | `open`, `closed` |
| `data-open` / `data-closed` | base-ui, kobalte, corvu | popup, content | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-nested` / `data-nested-dialog-open` | base-ui, reka | popup, parent popup | present when a dialog is inside or has opened another |
| `data-nested-open` | bits | root | bits' spelling |
| `data-scroll-locked` | base-ui | html | present while the page is locked |
| `data-entering` / `data-exiting` | react-aria | modal, overlay | react-aria's enter and exit phases |
| `data-enter` / `data-leave` | ariakit | dialog, backdrop | ariakit's phases |
| `data-starting-style` / `data-ending-style` | base-ui, reka, bits | popup | enter / exit |
| `data-backdrop` | ariakit | backdrop | part identity |
| `data-active-item`, `data-focus-visible` | ariakit | focusable descendants | present |
| `data-expanded` | kobalte | trigger | present |
| `data-pressed`, `data-trigger`, `data-rac` | react-aria | trigger | present, the trigger kind, and RAC's own marker |
| `data-current`, `data-value` | zag | layer | layering bookkeeping |
| `data-corvu-dialog-trigger` / `-content` / `-overlay` / `-label` / `-description` / `-close` | corvu | matching part | part identity |
| `data-dialog-root` / `-trigger` / `-content` | bits | matching part | part identity |
| `--nested-dialogs` | base-ui | popup | the nesting count |
| `--bits-dialog-depth`, `--bits-dialog-nested-count` | bits | popup | bits' equivalents |
| `--scrollbar-width` | ariakit, kobalte | html | measured px, so a locked page does not shift |

### disclosure

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-expanded` / `data-collapsed` | kobalte, corvu | trigger, content | present |
| `data-enter` / `data-leave` / `data-animating` | ariakit | content | the phases |
| `data-corvu-disclosure-trigger` / `-content` | corvu | matching part | part identity |
| `--corvu-disclosure-content-height` / `-width` | corvu | content | measured px |

Headless UI identifies its disclosure parts **only** by generated id prefix
(`headlessui-disclosure-button-`, `headlessui-disclosure-panel-`), never by
role and never by a `data-*` attribute. That is worth not copying.

### drawer

The busiest component in the research, and the place where the libraries
diverge most.

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | zag | root, content | `open`, `closed` |
| `data-open` / `data-closed` | base-ui, kobalte, corvu | content, overlay | present |
| `data-opening` / `data-closing` | corvu | content | present during each phase, corvu's alternative to a single `data-state` |
| `data-swiping` | base-ui, zag, reka | root, content, backdrop | present during the gesture. Base UI's tests pin that the **backdrop** gains and loses it with the gesture (13 assertions that it has none, 11 that it gains it) |
| `data-swipe-direction` | base-ui, zag | root, content | `up`, `down`, `left`, `right` |
| `data-swipe-dismiss` | base-ui | content | present when the gesture will dismiss |
| `data-swipe-dismissed` | reka | content | reka's spelling, after the fact |
| `data-swipe-ignore` / `data-base-ui-swipe-ignore` | base-ui | descendant elements | opt a subtree out of the gesture |
| `data-no-drag` / `data-corvu-no-drag` | zag, corvu | descendant elements | the same idea |
| `data-dragging` | zag | content, handle | present |
| `data-resizing`, `data-snapping`, `data-transitioning` | corvu | content | present during each phase |
| `data-nested-drawer-open`, `data-nested-drawer-swiping` | base-ui, zag | parent content | present while a nested drawer is open or moving |
| `data-nested-dialog-open` | base-ui | content | present when a dialog is nested inside |
| `data-active` / `data-inactive` | base-ui, zag | content | which drawer in the stack is frontmost |
| `data-side` | corvu | content | `top`, `bottom`, `left`, `right` |
| `data-expanded`, `data-current`, `data-value`, `data-disabled` | zag | root, content, layer | present |
| `data-ending-style` | base-ui | content | exit |
| `data-corvu-drawer-trigger` / `-content` / `-overlay` / `-label` / `-description` / `-close` | corvu | matching part | part identity |
| `--drawer-swipe-movement-x` / `-y` | base-ui, zag, reka | content | px offset of the current gesture |
| `--drawer-swipe-progress` | base-ui, zag | content | 0 to 1 |
| `--drawer-swipe-strength` | zag | content | gesture velocity |
| `--drawer-translate` / `-x` / `-y` | zag | content | the applied transform |
| `--drawer-snap-point-offset` | base-ui, reka | content | px to the active snap point |
| `--drawer-snap-point-offset-x` / `-y` | zag | content | zag's axis-split version |
| `--drawer-height`, `--drawer-frontmost-height` | base-ui, zag | content | measured px |
| `--drawer-keyboard-inset` | base-ui | content | px the soft keyboard occupies |
| `--nested-drawers` | base-ui, zag | content | the nesting count |

### editable

zag only.

| Attribute | Part | Values |
| --- | --- | --- |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required`, `data-focus` | root, input | present |
| `data-placeholder-shown` | input | present |
| `data-autoresize` | input | present when the input grows with its content |

### field and fieldset

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required`, `data-valid` | base-ui, zag, kobalte | root, control, label, description | present. Base UI's tests pin that the **root** carries `data-invalid` (7 assertions) and `data-valid` (3), and that neither is present before validation |
| `data-dirty`, `data-touched`, `data-filled` | base-ui | root, group | present; the group has none of the three before interaction |
| `data-focused` | base-ui | root | present |
| `data-field` | base-ui | control | marks the element the field owns |
| `data-starting-style` / `data-ending-style` | base-ui | error, description | enter / exit |

### file-upload, signature-pad, clipboard, timer, qr-code

zag only.

| Attribute | Component | Part | Values |
| --- | --- | --- | --- |
| `data-dragging` | file-upload | dropzone | present while a file is over it |
| `data-type` | file-upload | item | the file kind |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required` | file-upload, signature-pad | root, control | present |
| `data-copied` | clipboard | indicator | present after a successful copy |
| `data-type` | timer | segment | the time unit |
| `--value` | timer | segment | the numeric value |
| `--qrcode-width`, `--qrcode-height`, `--qrcode-pixel-size` | qr-code | frame | computed px |

### floating-panel, tour, toc, marquee, image-cropper

All zag only, and useful mainly as evidence of how far the pattern scales.

| Attribute | Component | Part | Values |
| --- | --- | --- | --- |
| `data-stage`, `data-staged`, `data-maximized`, `data-minimized` | floating-panel | root, content | the window state |
| `data-topmost`, `data-behind` | floating-panel | content | stacking position |
| `data-axis` | floating-panel, image-cropper | resize trigger | `x`, `y`, `xy` |
| `data-dragging`, `data-disabled`, `data-state` | floating-panel | root, content | present |
| `data-step`, `data-type`, `data-fetching` | tour | content | the current step, step kind, loading flag |
| `data-depth`, `data-first`, `data-last`, `data-active` | toc | item | tree position and the active heading |
| `data-clone`, `data-reverse`, `data-paused`, `data-index`, `data-side` | marquee | item-group, item | present |
| `data-shape`, `data-fixed`, `data-ready`, `data-measured`, `data-panning`, `data-pinch`, `data-flip-horizontal`, `data-flip-vertical`, `data-position` | image-cropper | root, crop area | present |
| `--spotlight-x` / `-y` / `-width` / `-height`, `--tour-layer`, `--tour-z-index` | tour | spotlight | computed geometry |
| `--marquee-translate`, `--marquee-spacing`, `--marquee-duration`, `--marquee-delay`, `--marquee-loop-count` | marquee | item-group | animation inputs |
| `--crop-x` / `-y` / `-width` / `-height`, `--image-offset-x` / `-y`, `--image-zoom`, `--image-rotation` | image-cropper | root | computed geometry |
| `--width`, `--height`, `--z-index`, `--depth`, `--top`, `--left` | floating-panel, toc | root, content | computed geometry |

### hover-card

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | content | `open`, `closed` |
| `data-open` / `data-closed` | base-ui | popup | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-side` | base-ui, radix, zag | positioner | placement, including base-ui's `none` |
| `data-placement` | zag | positioner | the placement string |
| `data-activation-direction` | base-ui | popup, root | which way the pointer came in |
| `data-current` / `data-previous` | base-ui, zag | popup | which of two stacked popups is current |
| `data-transitioning` | base-ui | popup | present |
| `data-starting-style` / `data-ending-style` | base-ui, reka, bits | popup | enter / exit |
| `data-link-preview-*` | bits | each part | part identity |

### listbox

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-highlighted` | zag, reka, bits | item | present |
| `data-selected` | zag | item | present |
| `data-state` | zag, reka, bits | item | `checked`, `unchecked` |
| `data-disabled` | kobalte, zag, reka | item, root | present |
| `data-empty` | react-aria, zag | root | present |
| `data-orientation` | base-ui, zag | root | `horizontal`, `vertical` |
| `data-layout` | zag | root | the layout mode |
| `data-activedescendant` | zag | root | the highlighted item's id |
| `data-hidden` | reka | item | present when filtered out |
| `data-index` | reka | item | the position |
| `data-key` | kobalte | item | the collection key |
| `data-value` | zag | item | the item value |
| `data-focus-visible`, `data-hovered`, `data-pressed`, `data-drop-target`, `data-name`, `data-rac` | react-aria | item, root | present |
| `--column-count` | zag | root | the grid column count |

### menu, menubar, dropdown-menu, navigation-menu

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, bits | trigger, content, item | `open`, `closed`, and `checked`/`unchecked` on option items |
| `data-open` | base-ui, react-aria | popup, trigger | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-highlighted` | base-ui, zag, kobalte, reka, bits | item | present |
| `data-active-item` | ariakit | item | present on the active item |
| `data-checked` / `data-unchecked` | base-ui, kobalte | option item | present |
| `data-disabled` | base-ui, zag, reka, bits | item, trigger | present |
| `data-side` | zag, radix | positioner | placement |
| `data-placement` | zag | positioner | the placement string |
| `data-align` | zag | positioner | `start`, `center`, `end` |
| `data-current` | base-ui, zag | item | present |
| `data-has-submenu` | react-aria | item | present |
| `data-has-submenu-open` | base-ui | trigger | present |
| `data-activation-direction` | base-ui | popup | pointer direction |
| `data-instant` | base-ui | popup | present when the open should skip its animation |
| `data-transitioning`, `data-previous` | base-ui | popup | present |
| `data-type` | zag | item | the item kind |
| `data-value`, `data-valuetext` | zag | option item | the value and its display text |
| `data-uid`, `data-controls` | zag | trigger | plumbing links |
| `data-placing` | ariakit | popover | present while positioning |
| `data-orientation` | base-ui, zag | root, list | `horizontal`, `vertical` |
| `data-active` | base-ui | trigger (navigation-menu) | present on the open trigger |
| `data-trigger-proxy`, `data-trigger-proxy-id` | zag | navigation-menu trigger | plumbing |
| `data-radix-menu-content`, `data-radix-menubar-content`, `data-radix-menubar-subtrigger` | radix | matching part | part identity |
| `data-base-ui-portal`, `data-base-ui-scroll-locked`, `data-base-ui-focus-guard` | base-ui | portal, html, guards | plumbing |
| `data-dropdown-menu-*`, `data-navigation-menu-trigger` | bits, reka | matching part | part identity |
| `--popup-width` / `--popup-height` | base-ui | popup | measured px |
| `--positioner-width` / `--positioner-height` | base-ui | positioner | measured px |
| `--trigger-x` / `-y` / `-width` / `-height` | zag | navigation-menu viewport | the source trigger's box, for the sliding viewport |
| `--viewport-x` / `-y` / `-width` / `-height` | zag | navigation-menu viewport | the target box |

### meter and progress

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag | root, indicator | `loading`, `complete`, `indeterminate` |
| `data-indeterminate` | base-ui, kobalte, reka | root | present |
| `data-complete` | base-ui | root | present |
| `data-progressing` | base-ui | root | present while advancing |
| `data-value` | radix, zag, reka | root, indicator | the numeric value |
| `data-max` | zag | root | the maximum |
| `data-progress` | kobalte | root, fill | the fraction |
| `data-orientation` | zag | root | `horizontal`, `vertical` |
| `data-progress-root`, `data-meter-root` | bits | root | part identity |
| `--kb-progress-fill-width`, `--kb-meter-fill-width` | kobalte | fill | a percentage |
| `--percent`, `--offset`, `--radius`, `--size`, `--thickness`, `--circumference` | zag | circular track | computed geometry |

### number-field

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required` | base-ui, kobalte, react-aria, zag, reka | root, input, trigger | present |
| `data-dirty`, `data-touched`, `data-filled`, `data-valid` | base-ui, kobalte | root, input | present |
| `data-focused` | base-ui | root | present |
| `data-focus` | zag | input, root | present |
| `data-focus-visible`, `data-hovered` | react-aria | input | present |
| `data-scrubbing` | base-ui, zag | root, scrub area | present while the pointer is scrubbing the value |

### one-time-password-field, otp-field, pin-input

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-complete` | base-ui, zag, reka | root | present when every slot is filled |
| `data-filled` | base-ui, zag | slot | present |
| `data-active` | reka | slot | present on the focused slot |
| `data-index` | zag | slot | the position |
| `data-focused` | base-ui | root | present |
| `data-disabled`, `data-readonly`, `data-invalid`, `data-required` | base-ui, zag | root, slot | present |
| `data-radix-otp-input`, `data-radix-index` | radix | hidden input, slot | part identity and position |
| `data-corvu-otp-field-root` / `-input` | corvu | matching part | part identity |

### pagination

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-selected` | zag, reka | page item | present on the current page |
| `data-current` | kobalte | page item | kobalte's spelling |
| `data-index` | zag | page item | the page number |
| `data-type` | reka | item | `page`, `ellipsis` |
| `data-value` | reka | item | the page number |
| `data-disabled` | zag | prev/next trigger | present |

### password-input and password-toggle-field

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | zag | root, visibility trigger | `visible`, `hidden` |
| `data-icon` | radix | icon | which icon is showing |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required` | zag | root, input | present |
| `data-1p-ignore`, `data-lpignore`, `data-bwignore`, `data-protonpass-ignore`, `data-form-type` | zag | input | password-manager opt-outs. Nobody else does this and it is worth copying for any field a manager should leave alone |

### popover

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | content | `open`, `closed` |
| `data-open` / `data-closed` | base-ui, kobalte, corvu, reka | popup | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-side` | base-ui, radix, zag, reka | positioner | placement including `none` |
| `data-align` | base-ui | positioner | `start`, `center`, `end` |
| `data-placement` | zag, kobalte, corvu | content, positioner | the placement string |
| `data-activation-direction`, `data-current`, `data-previous`, `data-transitioning` | base-ui, zag | popup | present |
| `data-type` | base-ui | popup | the popup kind |
| `data-starting-style` / `data-ending-style` | base-ui, reka, bits | popup | enter / exit |
| `data-entering` / `data-exiting` | react-aria, base-ui | popover | the phases |
| `data-expanded` | zag | trigger | present |
| `data-trigger`, `data-pressed` | react-aria, base-ui | trigger | present |
| `data-corvu-popover-trigger` / `-anchor` / `-content` / `-overlay` / `-arrow` / `-label` / `-description` / `-close` | corvu | matching part | part identity |
| `data-popover-*`, `data-popover-overlay` | bits | matching part | part identity |
| `data-base-ui-focus-guard`, `data-base-ui-inert`, `data-base-ui-scroll-locked` | base-ui | guards, outside, html | plumbing |
| `--transform-origin` | base-ui, zag | popup | a `x y` pair pointing back at the anchor |
| `--available-width` / `--available-height` | base-ui, zag | positioner | px the popup may occupy |
| `--reference-width` / `--reference-height` | zag | positioner | the anchor's box |
| `--arrow-size`, `--arrow-size-half`, `--arrow-offset`, `--arrow-background` | zag | arrow | arrow geometry |
| `--z-index` | zag | positioner | the layer's z-index |
| `--corvu-floating-transform-origin` | corvu | content | the transform origin |
| `--popover-overflow-padding` | ariakit | popover | px |

### popper (the shared positioning primitive)

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-side` | radix, reka | content | `top`, `bottom`, `left`, `right` |
| `data-align` | radix, reka | content | `start`, `center`, `end` |
| `data-radix-popper-side`, `data-radix-popper-align`, `data-radix-popper-content-wrapper` | radix | wrapper | part identity and duplicated placement |
| `data-reka-popper-content-wrapper` | reka | wrapper | part identity |
| `--radix-popper-available-width` / `-height` | radix | content | px |
| `--reka-popper-transform-origin`, `--reka-popper-available-width` / `-height`, `--reka-popper-anchor-width` / `-height` | reka | content | px and origin. Reka sets all five and asserts none of them |
| `--transform-origin`, `--available-width` / `-height`, `--reference-width` / `-height`, `--arrow-*`, `--z-index`, `--name` | zag | positioner, arrow | the same set, unprefixed |

### radio-group

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, bits | item, indicator | `checked`, `unchecked` |
| `data-checked` / `data-unchecked` | base-ui, kobalte | item, indicator | present |
| `data-disabled` | base-ui, kobalte, react-aria, zag, reka, radix | root, item, control, label | present |
| `data-invalid`, `data-required`, `data-readonly`, `data-valid` | base-ui, kobalte, react-aria, zag, reka | root, item | present |
| `data-dirty`, `data-touched`, `data-filled` | base-ui | root | present |
| `data-focus`, `data-hover` | zag, kobalte | control | present |
| `data-focus-visible` | kobalte, react-aria, zag | control | present. Zag's e2e model asserts `data-focus` present and `data-focus-visible` absent for a pointer-driven focus, which is exactly the distinction worth pinning |
| `data-hovered`, `data-pressed`, `data-selected` | react-aria | item | present |
| `data-active` | zag | control | present while held |
| `data-orientation` | zag | root | `horizontal`, `vertical` |
| `data-headlessui-state` | headlessui | item | a space-separated token list, observed as `''`, `'active focus'`, `'checked active focus'` |
| `data-ssr` | zag | root | present in the server-rendered markup only |
| `data-starting-style` / `data-ending-style` | base-ui | indicator | enter / exit |
| `data-radio-group-root`, `data-radio-group-item` | bits | matching part | part identity |
| `--left`, `--top`, `--width`, `--height`, `--transition-property`, `--transition-duration`, `--transition-timing-function` | zag | indicator | the sliding indicator's box and transition |

### rating-group

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-highlighted` | zag | item | present |
| `data-checked` | zag | item | present |
| `data-half` | zag | item | present on a half-filled item |
| `data-state` | reka | item | `checked`, `unchecked`, `partial` |
| `data-disabled`, `data-readonly`, `data-required` | zag, reka | root, item | present |
| `data-orientation` | reka | root | `horizontal`, `vertical` |
| `data-rating-group-root`, `data-rating-group-item` | bits | matching part | part identity |
| `--reka-rating-item-step-width` / `-opacity` / `-z-index` | reka | item step | per-step geometry |

### resizable and splitter

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-dragging` | corvu, zag | handle | present |
| `data-active` | corvu | handle | present |
| `data-collapsed` / `data-expanded` | corvu | panel | present |
| `data-orientation` | corvu, zag | root, handle | `horizontal`, `vertical` |
| `data-disabled`, `data-focus` | zag | handle | present |
| `data-index`, `data-id` | zag | panel, handle | position and identity |
| `data-state` | reka | panel | the panel state |
| `data-corvu-resizable-root` / `-panel` / `-handle` | corvu | matching part | part identity |
| `data-corvu-resizable-handle-start-intersection` / `-end-intersection` | corvu | handle | which neighbours the handle touches |

### scroll-area

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag | scrollbar | `visible`, `hidden` |
| `data-scrolling` | base-ui, zag | scrollbar, viewport | present while scrolling. Base UI's tests pin that the **scrollbar** gains it and that a `pointercancel` does not leave it stuck |
| `data-hovering` | base-ui | root | present |
| `data-hover` | zag | scrollbar | zag's spelling |
| `data-dragging` | zag | thumb | present |
| `data-orientation` | base-ui, zag, reka | scrollbar | `horizontal`, `vertical` |
| `data-has-overflow-x` / `-y` | base-ui | root | present when content overflows |
| `data-overflow-x-start` / `-end`, `data-overflow-y-start` / `-end` | base-ui | root | present when there is content beyond that edge |
| `data-overflow-x` / `-y` | zag | root | zag's condensed version |
| `data-at-top` / `-bottom` / `-left` / `-right` | zag | root | present when scrolled to that edge |
| `data-radix-scroll-area-viewport`, `data-reka-scroll-area-viewport` | radix, reka | viewport | part identity |
| `data-scroll-area-root` / `-viewport` / `-scrollbar` / `-thumb` / `-corner` | bits | matching part | part identity |
| `--scroll-area-thumb-width` / `-height`, `--scroll-area-corner-width` / `-height` | base-ui | thumb, corner | measured px |
| `--scroll-area-overflow-x-start` / `-end`, `--scroll-area-overflow-y-start` / `-end` | base-ui | root | px of hidden content per edge |
| `--radix-scroll-area-corner-width` / `-height` | radix | corner | measured px |
| `--thumb-width` / `-height`, `--corner-width` / `-height` | zag | thumb, corner | the same, unprefixed |

### select

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | trigger, content, item | `open`, `closed`, `checked`, `unchecked` |
| `data-open` | base-ui | popup | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-highlighted` | base-ui, zag, reka, bits | item | present |
| `data-selected` | base-ui, reka, bits | item | present |
| `data-active-item` | ariakit | item | present |
| `data-placeholder` | base-ui, radix, reka, bits | value | present |
| `data-placeholder-shown` | zag | trigger | present |
| `data-disabled` | base-ui, kobalte, zag | root, trigger, item | present |
| `data-invalid`, `data-readonly`, `data-required` | base-ui, react-aria, zag | root, trigger | present |
| `data-dirty`, `data-touched`, `data-filled`, `data-valid` | base-ui | root, trigger | present |
| `data-focused` | base-ui | trigger | present |
| `data-focus` | zag | trigger | present |
| `data-focus-visible` | ariakit | trigger, item | present |
| `data-empty` | react-aria | listbox | present |
| `data-side` / `data-popup-side` | base-ui, zag | positioner / popup | placement |
| `data-placement` | zag | positioner | the placement string |
| `data-activedescendant` | zag | content | the highlighted item's id |
| `data-visible` | base-ui, ariakit | popup | present |
| `data-autofill` | ariakit | hidden select | present |
| `data-starting-style` / `data-ending-style` | base-ui, reka, bits | popup | enter / exit |
| `data-pressed`, `data-trigger`, `data-a11y-ignore`, `data-react-aria-prevent-focus` | react-aria, base-ui | trigger, item | present |
| `data-key` | kobalte | item | the collection key |
| `data-value` | zag | item | the item value |
| `data-radix-select-viewport` | radix | viewport | part identity |
| `data-select-value` | bits | value | part identity |
| `--anchor-width` / `--reference-width` | base-ui, zag | positioner | the trigger's width, for a same-width popup |
| `--available-height` / `--available-width` | base-ui, zag | positioner | px |
| `--transform-origin` | base-ui | popup | the origin |
| `--kb-select-content-transform-origin` | kobalte | content | the origin |
| `--z-index` | zag | positioner | the layer |

### separator, label, visually-hidden, aspect-ratio

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-orientation` | radix, kobalte | root | `horizontal`, `vertical` |
| `data-separator-root`, `data-label-root` | bits | root | part identity |
| `data-hidden` | reka | root | present on the visually-hidden wrapper |
| `data-radix-aspect-ratio-wrapper`, `data-reka-aspect-ratio-wrapper` | radix, reka | wrapper | part identity |
| `data-count` | headlessui | label, description | how many labels or descriptions are registered |
| `data-headlessui-state` | headlessui | label, description | the token list |

### slider

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-orientation` | base-ui, radix, react-aria, zag, reka | root, track, thumb | `horizontal`, `vertical` |
| `data-disabled` | base-ui, radix, react-aria, zag, reka | root, thumb, track. Base UI pins it on the **thumb** as well as the root | present |
| `data-dragging` | base-ui, react-aria, zag | thumb, root | present |
| `data-index` | base-ui, zag | thumb | the thumb's position |
| `data-value` | apg, zag, reka | thumb, output | the numeric value |
| `data-focus`, `data-state` | zag | thumb | present |
| `data-focused`, `data-focus-visible`, `data-hovered` | base-ui, react-aria | thumb | present |
| `data-invalid`, `data-valid`, `data-dirty`, `data-touched` | base-ui, zag | root | present |
| `data-position` | reka | tick | `top`, `bottom`, `left`, `right` |
| `data-bounded` | reka, melt | tick | present when the tick is inside the selected range |
| `data-active`, `data-selected` | reka | tick, range | present |
| `data-slider-thumb-label`, `data-slider-tick-label` | bits | label | part identity |
| `data-name` | zag | hidden input | the form field name |
| `--position`, `--start-position`, `--relative-size` | base-ui | range, thumb | percentages |
| `--slider-range-start` / `-end` | zag | range | percentages |
| `--slider-thumb-width` / `-height` / `-transform`, `--slider-thumb-offset-*` | zag | thumb | measured px and the transform |
| `--translate-x` / `-y` | zag | thumb | the applied transform |

### steps and stepper

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-current` | zag | item, trigger | present |
| `data-complete` / `data-incomplete` | zag | item | present |
| `data-skippable` | zag | item | present |
| `data-state` | zag | item | the step state |
| `data-orientation` | zag | root | `horizontal`, `vertical` |
| `data-disabled` | reka | trigger | present |
| `--percent` | zag | progress | the completion fraction |

### switch

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, bits | root, thumb | `checked`, `unchecked` |
| `data-checked` | base-ui, kobalte, reka | root, thumb | present |
| `data-unchecked` | base-ui | root | present |
| `data-disabled` | base-ui, kobalte, react-aria, zag, reka | root, control, label | present |
| `data-invalid`, `data-valid`, `data-required`, `data-readonly` | base-ui, kobalte, react-aria, zag | root, control | present |
| `data-dirty`, `data-touched`, `data-filled` | base-ui | root | present |
| `data-focus`, `data-hover` | zag, kobalte | control | present. Zag's e2e model asserts `data-focus=""` on the **control** while real focus is on the hidden input, which is the pattern for every input-backed component |
| `data-focused` | base-ui | root | present |
| `data-focus-visible` | kobalte, react-aria, zag | control | present |
| `data-hovered`, `data-pressed`, `data-selected` | react-aria | root | present |
| `data-active` | zag | control | present while held |
| `data-switch-root`, `data-switch-thumb` | bits | matching part | part identity |

### tabs

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix | trigger, content | `active`, `inactive` |
| `data-selected` | zag | trigger | present |
| `data-active` | base-ui | trigger | present on the selected tab |
| `data-active-item` | ariakit | trigger | present |
| `data-orientation` | base-ui, radix, react-aria, zag | root, list, trigger | `horizontal`, `vertical` |
| `data-disabled` | zag | trigger | present |
| `data-focus` | zag | trigger | present |
| `data-focus-visible`, `data-focused`, `data-hovered`, `data-pressed` | react-aria | trigger | present |
| `data-index` | base-ui | trigger | the position |
| `data-activation-direction` | base-ui | root, list | which way the selection moved, for a direction-aware indicator |
| `data-starting-style` / `data-ending-style` | base-ui | panel | enter / exit |
| `data-ssr` | zag | root | present in server markup only |
| `data-instance-id` | react-aria | root | plumbing |
| `data-value` | zag | trigger, content | the tab value |
| `data-tabs-root` / `-list` / `-trigger` / `-content` | bits | matching part | part identity |
| `--active-tab-top` / `-left` / `-right` / `-bottom` / `-width` / `-height` | base-ui | indicator | the active trigger's box |
| `--left`, `--top`, `--width`, `--height`, `--transition-property`, `--transition-duration`, `--transition-timing-function` | zag | indicator | the same, unprefixed |
| `--tab-panel-width` / `-height` | react-aria | panel | measured px |

### tags-input, tag, tag-group

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-highlighted` | zag | item | present on the focused tag |
| `data-state` | reka | item | the item state |
| `data-value` | zag | item | the tag value |
| `data-empty` | zag | root, input | present |
| `data-disabled`, `data-invalid`, `data-readonly`, `data-required`, `data-focus` | zag | root, input, item | present |
| `data-active-item` | ariakit | item | present |
| `data-allows-removing` | react-aria | root | present |
| `data-focus-visible`, `data-hovered`, `data-pressed`, `data-href` | react-aria | item | present |
| `data-reka-collection-item` | reka | item | collection registration |

### text-field, search-field, form

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-disabled`, `data-invalid`, `data-valid`, `data-required`, `data-readonly` | kobalte, react-aria | root, input | present |
| `data-focus-visible`, `data-hovered` | react-aria | input | present |
| `data-invalid` | radix, base-ui | form root | present |
| `data-focus-visible` | ariakit, react-aria | field | present |

### toast

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag | root | `open`, `closed` |
| `data-swipe` | kobalte | root | the swipe phase |
| `data-swipe-direction` | base-ui, radix, kobalte | root | `up`, `down`, `left`, `right` |
| `data-swiping`, `data-swipe-ignore`, `data-base-ui-swipe-ignore` | base-ui | root, descendants | present |
| `data-side`, `data-align`, `data-placement` | base-ui, zag | viewport, root | the corner the stack sits in |
| `data-expanded` | base-ui | viewport | present while the stack is fanned out |
| `data-behind`, `data-limited` | base-ui | root | present for a stacked or dropped toast |
| `data-first`, `data-sibling`, `data-ghost`, `data-stack`, `data-overlap`, `data-mounted` | zag | root | stacking bookkeeping |
| `data-paused` | zag | root | present while the timer is paused |
| `data-type` | zag | root | the toast kind |
| `data-focused` | react-aria | root | present |
| `data-starting-style` / `data-ending-style` | base-ui | root | enter / exit |
| `data-radix-toast-announce-alt`, `data-radix-toast-announce-exclude` | radix | announcer nodes | control what the live region reads |
| `--toast-index`, `--toast-height`, `--toast-frontmost-height`, `--toast-offset-y` | base-ui | root | stacking geometry |
| `--toast-swipe-movement-x` / `-y` | base-ui | root | gesture offset |
| `--kb-toast-swipe-move-x` / `-y`, `--kb-toast-swipe-end-x` / `-y` | kobalte | root | the same |
| `--index`, `--height`, `--first-height`, `--initial-height`, `--offset`, `--gap`, `--scale`, `--base-scale`, `--opacity`, `--lift`, `--lift-amount`, `--sign`, `--duration`, `--remove-delay`, `--z-index`, `--viewport-offset-top` | zag | root, viewport | the full stacking model as variables. Zag exposes the most and asserts the least |
| `--kb-toast-progress-fill-width` | kobalte | progress fill | a percentage |
| `--custom-announcer-container` | radix | announcer | plumbing |

### toggle-group and toolbar

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, bits | item | `on`, `off`, or `checked`/`unchecked` in base-ui's toolbar |
| `data-pressed` | base-ui, radix | item | present |
| `data-checked` / `data-unchecked` | base-ui | toolbar item | present |
| `data-disabled` | base-ui, kobalte, react-aria, zag, radix | root, item | present |
| `data-orientation` | base-ui, kobalte, radix, zag | root | `horizontal`, `vertical` |
| `data-multiple` | base-ui | root | present when multiple selection is allowed |
| `data-focus` | zag | item | present |
| `data-focusable` | base-ui | toolbar item | present when the item takes focus |
| `data-hovered` | react-aria | item | present |
| `data-toggle-group-root`, `data-toggle-group-item`, `data-toolbar-root` / `-button` / `-link` / `-group` / `-group-item` | bits | matching part | part identity |

### tooltip

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-state` | radix, zag, reka, melt, bits | content | `open`, `closed`, `delayed-open`, `instant-open` |
| `data-open` / `data-closed` | base-ui, kobalte | popup | present |
| `data-popup-open` | base-ui | trigger | present |
| `data-side` | base-ui, radix, zag, reka | positioner | placement including `none` |
| `data-placement` | zag, kobalte, react-aria | content | the placement string |
| `data-instant` | base-ui, react-aria, zag | popup | present when the tooltip should skip its delay and animation |
| `data-activation-direction`, `data-current`, `data-previous`, `data-transitioning` | base-ui, zag | popup | present |
| `data-uncentered` | base-ui | arrow | present when the arrow could not be centred |
| `data-trigger-disabled` | base-ui | trigger wrapper | present when the wrapped trigger is disabled |
| `data-truly-disabled` | ariakit | trigger | ariakit distinguishes a disabled-but-focusable trigger from a genuinely disabled one |
| `data-active` | ariakit | trigger | present |
| `data-entering` / `data-exiting` | react-aria | tooltip | the phases |
| `data-starting-style` / `data-ending-style` | base-ui, reka, bits | popup | enter / exit |
| `data-expanded` | zag | trigger | present |
| `data-delay-duration` | bits | root | the configured delay, exposed for tests |
| `data-corvu-tooltip-trigger` / `-anchor` / `-content` / `-arrow` | corvu | matching part | part identity |
| `--corvu-floating-transform-origin` | corvu | content | the origin |

### tree and tree-view

| Attribute | Libraries | Part | Values |
| --- | --- | --- | --- |
| `data-depth` | zag | item, branch | the nesting level |
| `data-path` | zag | item | the index path to this node |
| `data-branch` | zag | item | present on a node with children |
| `data-selected`, `data-checked`, `data-indeterminate` | zag | item | present |
| `data-state` | zag | branch | `open`, `closed` |
| `data-disabled`, `data-focus`, `data-loading`, `data-renaming` | zag | item | present |
| `data-value` | zag | item | the node value |
| `data-indent` | reka | item | the indent level |
| `data-disabled`, `data-orientation` | reka | item, root | present |
| `data-reka-collection-item` | reka | item | collection registration |

### grid-list and table

react-aria only, and the fullest collection surface in the research.

| Attribute | Part | Values |
| --- | --- | --- |
| `data-selected` | row | present |
| `data-selection-mode` | root | `none`, `single`, `multiple` |
| `data-key` | row, cell | the collection key |
| `data-collection` | root | the collection id |
| `data-empty` | root | present |
| `data-drop-target` | row, root | present while a drag hovers it |
| `data-allows-dragging`, `data-allows-removing` | root | present |
| `data-href` | row | the row's link target |
| `data-column-index` | cell | the numeric column |
| `data-focus-visible`, `data-focus-visible-within`, `data-hovered`, `data-pressed` | row, cell | present |

## Structural and identity attributes

Four schemes, and the choice between them matters more than any single state
attribute.

**Zag and Ark: one pair, universal.** `createAnatomy(name).parts(...).build()`
returns, per part, an `attrs` object of exactly `data-scope` and `data-part`,
plus a selector combining a self and a descendant match:
`&[data-scope="x"][data-part="y"], & [data-scope="x"][data-part="y"]`.
camelCase names are kebab-cased, so `createAnatomy("hoverCard").parts("toggleButton")`
gives `data-scope="hover-card"` and `data-part="toggle-button"`. `rename()`
switches the scope while keeping part names, which is exactly how Ark builds
SegmentGroup out of radio-group. The convention this establishes across every
machine: each rendered element carries `data-scope` plus `data-part`, and all
state is expressed as additional `data-*` attributes on those same elements, so
styling never depends on class names. Zag also uses `data-ownedby` (36
mentions) to link an item to the part that owns it, and `data-uid` for
per-instance identity.

That pair is what makes Zag's whole e2e suite possible. Its page objects build
locators from `[data-scope=<machine>][data-part=<part>]` refined by
`data-value`, `data-index`, `data-type`, `data-channel`, `data-axis`,
`data-stage` or `data-view`, and reach for a test id only where an example
needs to expose something the anatomy does not. No other library can do that.

**Bits: one attribute per part, prefixed by component.**
`createBitsAttrs({ component: 'dialog', parts: ['root', 'trigger', 'content'] })`
yields `data-dialog-root`, `data-dialog-trigger`, `data-dialog-content`, each
with an empty value, plus `selector('root')` returning `[data-dialog-root]` and
`getAttr('root')` returning the bare name. A `getVariant` function swaps the
prefix, so the same parts can render as `data-mobile-root`; a variant returning
`null` falls back to the component prefix. Reka does the same thing by hand
(`data-tabs-root`, `data-scroll-area-viewport`, and so on) without a factory.

**Corvu: one attribute per part, prefixed by library.**
`data-corvu-dialog-content`, `data-corvu-resizable-handle`, and so on. Same
shape as Bits with a vendor prefix instead of a component one, which means a
consumer's CSS is tied to the library's name.

**Headless UI: no part attributes at all.** Parts are found by generated id
prefix (`headlessui-menu-button-`, `headlessui-disclosure-panel-`,
`headlessui-tabs-tab-`), and state arrives as one `data-headlessui-state`
attribute holding a space-separated token list. Observed values: `''`,
`'active focus'`, `'checked active focus'`. Headless UI also emits the
individual `data-open`, `data-active`, `data-focus`, `data-hover`,
`data-disabled`, `data-selected`, `data-autofocus`, `data-closed`,
`data-enter`, `data-leave` and `data-headlessui-focus-visible` attributes
alongside it, so the token list is redundant. Their own assertion helpers
hard-code no `data-*` expectation except `data-checked` and
`data-indeterminate` on the React checkbox.

The remaining namespaced attributes are plumbing, listed here so nobody
mistakes one for a styling hook: `data-base-ui-inert`,
`data-base-ui-scroll-locked`, `data-base-ui-portal`,
`data-base-ui-focus-guard`, `data-base-ui-click-trigger`,
`data-base-ui-swipe-ignore`; `data-radix-focus-guard`,
`data-radix-popper-content-wrapper`, `data-radix-index`;
`data-reka-focus-guard`, `data-reka-collection-item`, `data-reka-viewport`;
`data-react-aria-top-layer`, `data-react-aria-prevent-focus`, `data-rac`;
`data-kb-top-layer`, `data-kb-menu-value-trigger`, `data-focus-trap`,
`data-live-announcer`; `data-scroll-lock`, `data-inert`, `data-inerted`,
`data-aria-hidden`, `data-suppressed`, `data-has-nested`, `data-topmost`,
`data-layer-index`; and `data-melt-<part>`.

## Proposed canonical set

A single list, chosen to be small, unambiguous, and consistent about how a
boolean is written. Rules first:

1. **A boolean state is an attribute with an empty value, or absent.** Never
   `="true"`, never `="false"`. So `data-disabled` and not
   `data-disabled="false"`.
2. **An enumerated state is one attribute with a value from a fixed set.** So
   `data-state="open"` and not a pair of `data-open`/`data-closed`.
3. **One spelling per concept.** Where the research offers two (`data-focus`
   versus `data-focused`, `data-hover` versus `data-hovered`,
   `data-placeholder` versus `data-placeholder-shown`), pick the shorter and
   never emit the other.
4. **`undefined` means do not set**, per the `PartProps` contract in
   `docs/architecture.md`. A false boolean resolves to `undefined`, not to the
   string `"false"`.
5. **Every part gets identity.** One scheme, applied everywhere.

### Identity

| Attribute | Value |
| --- | --- |
| `data-scope` | the component name, kebab-case |
| `data-part` | the part name, kebab-case |

Zag's scheme, adopted wholesale. Two attributes instead of one per part, they
compose into a selector that works for both self and descendant matching, they
survive a rename, and they make a page-object suite possible. The cost is two
attributes on every element instead of one; that is worth paying.

Not Bits' or Corvu's per-part attribute, because a component with twelve parts
then owns twelve attribute names in the global namespace and none of them can
be matched generically. Not Headless UI's id-prefix scheme, because an id is
not a styling hook and a test that queries by id prefix cannot tell a part from
an unrelated element that happens to share the prefix.

### Enumerated state

| Attribute | Values | Where |
| --- | --- | --- |
| `data-state` | `open`, `closed` | any disclosure or overlay: root, trigger, content |
| `data-state` | `checked`, `unchecked`, `indeterminate` | any tri-state control: root, indicator |
| `data-state` | `on`, `off` | a toggle |
| `data-orientation` | `horizontal`, `vertical` | root, and any part whose layout depends on it |
| `data-side` | `top`, `bottom`, `left`, `right` | a positioned part |
| `data-align` | `start`, `center`, `end` | a positioned part |
| `data-swipe-direction` | `up`, `down`, `left`, `right` | a swipeable root |

`data-state` carries three different value sets depending on the component,
which is exactly what Radix does and what Reka, Bits, Melt, Kobalte and Zag
copied. It reads badly in the abstract and well in practice, because no
component is both a disclosure and a checkbox.

The split `data-open`/`data-closed` pair that Base UI uses is tempting (you can
write `[data-closed]` without a value) but it doubles the attribute count and
loses the ability to write one selector over all states. Keep `data-state`. Do
**not** add `data-open` as well.

`data-placement` is deliberately out. Zag, Kobalte, Corvu and React Aria all
emit the full floating-ui placement string (`bottom-end`, `left-start`) in
addition to `data-side`, which is the same information twice. `data-side` plus
`data-align` is the same data in two attributes that CSS can actually use
independently.

### Boolean state

| Attribute | Meaning |
| --- | --- |
| `data-disabled` | the part is disabled |
| `data-readonly` | the control is read-only |
| `data-required` | the control is required |
| `data-invalid` | validation has run and failed |
| `data-valid` | validation has run and passed |
| `data-dirty` | the value has changed from its initial value |
| `data-touched` | the control has been blurred at least once |
| `data-filled` | the control has a value |
| `data-placeholder` | the part is showing placeholder text |
| `data-highlighted` | this is the one visually active item in a collection |
| `data-selected` | this item is selected |
| `data-current` | this item is the current one (a link, a step, a page) |
| `data-focus` | the part, or the input it fronts, has focus |
| `data-focus-visible` | focus should be drawn |
| `data-hover` | the pointer is over the part |
| `data-pressed` | the part is being held down |
| `data-dragging` | a drag originating on this part is in progress |
| `data-empty` | the collection has no items |
| `data-complete` | the value is at its maximum, or every slot is filled |
| `data-loading` | an async operation is in flight |
| `data-nested` | this instance is inside another of the same kind |
| `data-swiping` | a swipe gesture is in progress |
| `data-scrolling` | the scroller is moving |
| `data-instant` | this transition should be skipped |
| `data-starting-style` | the enter phase, one commit |
| `data-ending-style` | the exit phase, until the animation finishes |

`data-valid` and `data-invalid` are a pair and neither is present before
validation has run, which is Base UI's and Kobalte's behavior and the only one
that lets CSS distinguish "not yet checked" from "checked and fine".

`data-focus` versus `data-focus-visible` is the distinction Zag's e2e suite
pins explicitly: after a pointer press the control has `data-focus` and not
`data-focus-visible`; after a keyboard move it has both. Worth a spec bullet
per component.

For an input-backed control (checkbox, switch, radio, slider thumb), the state
attributes go on the **visible part**, not the hidden input, because that is
what CSS can reach. Zag's switch model asserts exactly this: `data-focus=""` on
the control while real focus sits on the input.

`data-starting-style` and `data-ending-style` come from Base UI and Bits, and
the reason to prefer them over Ariakit's `data-enter`/`data-leave` or React
Aria's `data-entering`/`data-exiting` is what Bits does with them:
`observeTransitionAttrs(node)` watches the two attributes with a
`MutationObserver` and asserts the **sequence**. Two attributes whose whole
purpose is to be a CSS selector during one phase are easier to observe than a
value on a shared attribute.

### Value-bearing

| Attribute | Meaning |
| --- | --- |
| `data-value` | this item's or thumb's value, stringified |
| `data-index` | this item's zero-based position |
| `data-type` | a discriminator within a part (segment kind, item kind) |

`data-key` (Kobalte, React Aria) is the same thing as `data-value` for a keyed
collection. One name.

### CSS custom properties

Unprefixed, and named after what they measure rather than after the component,
following Zag and Base UI's newer components rather than Radix's
`--radix-popper-*` or Reka's `--reka-popper-*`. A prefix buys nothing inside a
component's own subtree and forces every consumer's CSS to name the library.
Reka's own notes concede the point: the prefixes mean a shared conformance
suite has to parameterise them.

| Property | Set on | Value |
| --- | --- | --- |
| `--available-width` / `--available-height` | a positioned part | px the part may occupy |
| `--anchor-width` / `--anchor-height` | a positioned part | the anchor's measured box |
| `--transform-origin` | a positioned part | an `x y` pair pointing at the anchor |
| `--content-width` / `--content-height` | a collapsible panel | `auto` when settled, px while transitioning |
| `--arrow-size`, `--arrow-offset` | an arrow | px |
| `--scrollbar-width` | the document element while scroll is locked | px, so locking does not shift the page |

Everything beyond that list is component-specific geometry and belongs in the
component's own spec file. The drawer alone needs eight
(`--swipe-movement-x`/`-y`, `--swipe-progress`, `--snap-point-offset`,
`--translate-x`/`-y`, `--keyboard-inset`, `--nested-count`) and the toast
needs more; naming them centrally would be pretending they generalize.

Two warnings from the research. First, Reka sets all five of its popper
properties and asserts none of them, and neither does anyone else: every
`--*-available-*`, `--*-transform-origin` and collapsible height property in
the union is untested, because jsdom reports zero for every measurement. Any
bullet about a custom property is `(browser-only)`. Second, snapshot tests are
the pragmatic way to pin them; Reka writes `.snap` files for `AspectRatio`,
`Avatar`, `ScrollArea`, `Tree` and `Popper` precisely because generated inline
styles and custom properties are tedious to assert one at a time.

## Radix lineage

Six of the eleven libraries share one attribute vocabulary, and it is Radix's.
Reka, Bits, Melt, Kobalte and Base UI all emit `data-state`, `data-disabled`,
`data-highlighted`, `data-side`, `data-align` and `data-orientation` with the
same meanings and, `data-state` aside, the same values. The research says it
plainly: the shared naming of `data-state`, `data-disabled`,
`data-highlighted`, `data-side`, `data-align` and `data-orientation` is
inherited from Radix, those names are the de facto contract all three of Reka,
Melt and Bits honor, and they are the strongest candidates for a
cross-framework conformance suite.

The lineage is direct. Reka is a Vue port of Radix, Bits a Svelte one, Kobalte
a Solid one; Melt arrived at the same names through Bits' author; Base UI is by
the MUI team but adopted the same vocabulary. Zag reached most of the same names
independently and differs mainly by adding `data-scope`/`data-part` and by
preferring `data-focus`/`data-hover` over the `-ed` spellings.

Where the lineage breaks is worth knowing, because it tells you which choices
were actually contested rather than inherited:

- **Base UI split `data-state` into `data-open`/`data-closed` and
  `data-checked`/`data-unchecked`.** It is the only Radix descendant to do so.
  It also added the field-state quartet `data-dirty`, `data-touched`,
  `data-filled`, `data-valid`, which nobody else has and which is genuinely
  useful.
- **Base UI and Bits introduced `data-starting-style` and
  `data-ending-style`.** Radix expresses the same phases through
  `data-state="open"` plus CSS `@keyframes` keyed on it, which cannot express
  "the exit is running but the element is still mounted" without the presence
  machinery leaking into the value.
- **Kobalte kept Radix's names and added `data-valid`, `data-progress`, and
  the `--kb-` prefixed properties.** Its `data-expanded`/`data-collapsed`
  spelling for disclosure comes from Corvu, not Radix.
- **React Aria shares almost none of it.** Its render-prop model produces
  `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`,
  `data-selected`, `data-disabled` and writes booleans as `="true"`. The only
  names it shares with the Radix family are `data-disabled`, `data-selected`,
  `data-orientation` and `data-invalid`.
- **Ariakit shares none of it either.** `data-active-item`, `data-enter`,
  `data-leave`, `data-placing`, `data-user-value`,
  `data-autocomplete-value`, `data-truly-disabled` are all its own, and several
  of them (`data-user-value` versus `data-autocomplete-value`,
  `data-truly-disabled`, `data-placing`) express distinctions no other library
  exposes at all.
- **Headless UI shares the names but adds a redundant aggregate.**
  `data-headlessui-state` holds a space-separated token list duplicating the
  individual attributes.

Following the Radix lineage is the right call for us, because five independent
ports converging on the same six names is as close to a standard as this space
has, and because a consumer moving from any of those libraries can bring their
CSS. Take Base UI's field quartet and its two transition attributes on top, and
Zag's `data-scope`/`data-part` for identity. Leave the React Aria and Ariakit
spellings alone.
