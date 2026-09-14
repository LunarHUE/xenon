# Listbox coverage

The core and Solid tests cover the implemented contract below. This is a supported/deferred map of `docs/spec/listbox.md`, not a claim that its full cross-library inventory passes.

## Supported

- Root `listbox` and item `option` roles, explicit `aria-selected` for both selection modes, disabled/read-only semantics, stable value-derived IDs, orientation, active and selected data attributes. Authors supply accessible names. Multi-selection sets `aria-multiselectable`.
- String single selection and string-array multiple selection. Focus and selection remain independent. Single activation replaces selection without clearing an already selected value. Multiple activation toggles without a modifier. Selection commits on click, Enter, or Space, never pointerdown.
- Controlled and uncontrolled selection/active state. Changing a controlled value to undefined restores the previous internal state. Initialization does not emit selection callbacks. Ref props and author event cancellation survive prop merging.
- Roving DOM focus by default; virtual focus is opt-in. Virtual mode gives the root a tab stop and active descendant, leaves items at tabindex -1, and prevents pointerdown from stealing an external focus owner's focus. Author tabindex overrides are honored. Programmatic root focus enters the selected or first enabled option in roving mode.
- Enabled-only arrow navigation, Home/End, horizontal RTL, and looping by default. `loop={false}` clamps. Dynamic disabling and removal update tab stops and virtual active references. Child-list mutations update DOM order after the mutation observer runs, including retained item hosts moved in the DOM.
- Shift+arrow/click extends or shrinks a fixed inclusive range, excludes disabled items, and replaces prior membership. Shift+arrow clamps even when ordinary arrows loop. A deleted anchor falls back to the current active item. Ctrl/Meta+A selects all enabled items. Bare navigation does not change selection.
- Locale-lowercased prefix typeahead with a 700ms idle reset. Repeated identical characters cycle starting after the active item; multi-character queries try the active item first. Disabled matches are skipped. Spaces extend a nonempty query. Unmatched prefixes remain buffered. Owner disposal clears the timer. Composition and Alt/Ctrl/Meta character shortcuts do not search.
- Events from nested presentational text target their containing option and commit once. Programmatic focus does not duplicate controlled active-change requests.

## Decisions and limits

The requested default is roving focus and wrapping navigation. This differs from inventory bullets that require container-only focus or clamping as the default. Both container virtual focus and explicit clamping are available. Single-select Space commits; it does not clear a selected option. Multiple selection consistently uses `aria-selected`, not `aria-checked`.

The tests use Node for core and jsdom for Solid. A Vite server-transform fixture also checks server-rendered custom Listbox IDs and initial selection, plus CheckboxGroup label/description associations through nested Fields. Browser accessibility tooling, assistive-technology interaction, hydration, pointer cancellation across actual touch gestures, and scroll visibility have not been verified by these tests. Registration settles on the client; SSR emits roles, IDs and selection attributes, but does not pre-register descendants to resolve their initial navigation order.

## Deferred

- Group/label/description/indicator/separator parts, automatic naming warnings, and live announcements.
- Form inputs, native form reset, required-selection validation, and value serialization.
- Hover highlighting, pointer-modality tracking, long press, press-state attributes, alternate replace-selection behavior, and links/actions inside options.
- Control+Shift+Home/End range extension, bare Shift anchor capture, platform-specific shortcuts beyond Ctrl/Meta+A, and deselect-all on repeated select-all.
- Automatic scrolling, virtualization, async loading, drag and drop, grid navigation, and automatic relocation of actual DOM focus when a focused item is removed.
- Popup triggers, placement, dismissal, and animation belong to Select/Combobox and their hosting adapters.
