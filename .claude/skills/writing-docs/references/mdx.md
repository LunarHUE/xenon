# MDX components and demo files

Every page can use these without importing them. They're registered in
`apps/docs/src/components/mdx/index.ts`, and each component's source comment
has the full contract.

## Section

A numbered row with its title in a mono gutter. Most pages are a stack of
these.

```mdx
<Section title="pending">

Use `pending` while an action is in progress. Button stops activation and stays
focusable.

Provide a visible progress label. `pending` does not add one for you.

<Example slot="example" name="button/pending" />

</Section>
```

- Leave a blank line after the opening tag and before the closing tag, or the
  Markdown inside won't parse.
- The first paragraph is the lead. Later paragraphs render small and muted.
- `slot="example"` puts the demo beside the text. Without it, content stacks.
- The title becomes the anchor, so keep it short and stable.

## Example

```mdx
<Example name="popover/controlled" />
<Example name="popover/controlled" caption="The count updates on every close." />
```

This loads `src/examples/popover/controlled.tsx` as a live demo and shows the
same file as its source. If `controlled.unstyled.tsx` exists, the footer gets
the Tailwind toggle. Use a caption only for something the reader should try or
notice.

## Anatomy

````mdx
<Anatomy name="popover/anatomy" caption="Only Root, Trigger, Positioner and Content are required.">

```tsx title="Anatomy"
<Popover>
  <Popover.Trigger />
  <Popover.Portal>
    <Popover.Positioner>
      <Popover.Content>
        <Popover.Title />
        <Popover.Description />
        <Popover.Close />
      </Popover.Content>
    </Popover.Positioner>
  </Popover.Portal>
</Popover>
```

</Anatomy>
````

The demo marks each part with `data-anatomy="Popover.Trigger"`, and CSS draws
the outline and label from that attribute. Every part in the code tree should
be marked in the demo, so the labels can't drift from the code.

## Props and Prop

```mdx
<Props title="Trigger" type="PopoverTriggerProps<T>">

The button that opens the popover. Renders a `<button>`.

<Prop name="disabled" type="boolean" default="false">

Disables the trigger. The popover can't open from it.

</Prop>

</Props>
```

- The first paragraph of `<Props>` is the part description.
- The first paragraph of `<Prop>` is the description. Later paragraphs are
  muted notes.
- A fenced block inside `<Prop>` becomes its code sample on the right. Give it
  a `title="name.tsx"`.
- `type` is the type as written in source. `default` is code, like
  `"'button'"` or `"false"`.
- Only the first group gets `note="Native props are forwarded"`.

## Attributes and Attribute

```mdx
<Props title="Trigger" type="PopoverTriggerProps<T>">

<Prop name="disabled" type="boolean" default="false">...</Prop>

<Attributes>
<Attribute name="data-disabled">Present while `disabled` is set.</Attribute>
<Attribute name="data-state" value="open">The popover is open.</Attribute>
<Attribute name="data-state" value="closed">The popover is closed.</Attribute>
</Attributes>

</Props>
```

- Put the table inside the part's `<Props>`, after the last `<Prop>`. The
  group gives each row's anchor its part prefix, like `#trigger-data-state-open`.
- `value` makes an enum row: `name="data-state" value="open"` shows
  `data-state="open"`. Leave it out for a boolean attribute.
- Keep each description on the same line as its tags. Write it with the stems
  in `references/patterns.md`.

## Definitions

```mdx
<Definitions>
  <Definition term="Popover">Rich content anchored to a trigger. Focus moves in.</Definition>
  <Definition term="Tooltip">A short hint on hover or focus. Focus stays on the trigger.</Definition>
</Definitions>
```

Use this for "which one do I need" lists and for the Author checklist. Pass
`mono` when the terms are labels rather than names. Keep each description to
one line.

## Kbd and tables

```mdx
| Key                               | Behavior                                         |
| --------------------------------- | ------------------------------------------------ |
| <Kbd>Enter</Kbd>, <Kbd>Space</Kbd> | Opens or closes the popover.                     |
| <Kbd>Escape</Kbd>                 | Closes the popover and moves focus to the trigger. |
```

Use plain Markdown tables for keyboard and focus. Data attributes use
`<Attributes>`. Name keys the way the keyboard prints them: Enter, Space,
Escape, Tab, Shift, Arrow Down, Home, End, Page Up.

## Callout

```mdx
<Callout type="warning">
`pending` does not add a progress label. Change the button text yourself.
</Callout>
```

Use at most one per page, and only for a trap that breaks behavior without an
error. `note` is plain, and `warning` gets the accent bar.

## Code fences

Fences outside a component render as a titled CodeBlock. Always give them a
title: a file name like `title="editor.tsx"`, or a label like `title="Anatomy"`.

## Demo files

Demos live in `apps/docs/src/examples/<slug>/<name>.tsx`. The default export is
the demo.

- Import from the subpath, like `@xenon-ui/solid/popover`, the way readers
  will.
- Keep each demo to one idea and under about 40 lines, since readers copy it
  whole.
- Use real product copy: "Save changes", "Delete project?", "Notifications".
  Never use "Click me", "Item 1" or lorem ipsum.
- Styled demos use Tailwind classes only, and style state through `data-*`
  variants like `data-pending:opacity-70`. Every interactive element gets a
  `focus-visible` outline. Use `dark:` variants for dark mode.
- The `.unstyled.tsx` twin has the same markup and behavior with every class
  removed. Readers flip between the two, so keep the structure identical.
- A demo that shows state should print it, like `<p>Open: {String(open())}</p>`,
  so the reader can see the change.
- `anatomy.tsx` marks parts with `data-anatomy` and has no twin.
