# Changelog

## 0.1.1 — 2026-10-02

This release preserves Solid 2 host prop types and behavior across the adapter.
It is tested against `solid-js` and `@solidjs/web` 2.0.0-rc.8.

- Accept native boolean attribute values for behavior-owned `disabled`, `readonly`,
  `required`, and `autofocus`. Both `true` and `""` enable the attribute.
- Preserve ref inference for default, selected, and custom hosts. Compose consumer
  callback refs and nested ref arrays with internal refs using Solid's lifecycle.
- Compose optional handlers, functions, and bound event tuples. Preserve handler
  receivers, bound data, cancellation, event-name casing, and listener-object options.
- Preserve native `class` values and intrinsic properties. Restore NumberField host
  prop forwarding and distinguish Editable input and textarea props.
- Honor explicit attribute removal, including NumberField associations and
  Dialog/Popover naming. Keep registered IDs consistent with rendered attributes.

### Compatibility notes

- Button and input-button hosts support `button`, `submit`, and `reset`. Omitting
  `type` defaults to `button`; explicit `type={undefined}` removes the attribute.
  Removal restores the native host default: usually submission for a button in a
  form, and a text field for an input. Other hosts retain their own type meaning.
- Ref types now describe the actual host more precisely. Dialog.Content accepts a
  div-or-dialog ref because its host depends on whether it is inside a Viewport.
- `classList` compatibility is not added. Use Solid's native `class` values.
- Core and DOM dependencies remain at `^0.1.0`.
