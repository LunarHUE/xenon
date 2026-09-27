# Sentence patterns

Use one stem for each kind of line and keep it the same on every page. A reader
scanning a prop table learns the stems after two rows and reads faster from
then on. Every library we studied except React Aria mixes three or four stems
for callbacks alone.

## Part descriptions

The first paragraph inside a part's `<Props>`. Say what the part is or does,
then what it renders.

| Stem | Example |
| --- | --- |
| The [thing] that [job]. Renders a `<tag>`. | The button that opens the popover. Renders a `<button>`. |
| [Verb]s [what]. Renders a `<tag>`. | Positions the content against the trigger. Renders a `<div>`. |
| Groups the parts and holds the state. Renders no element. | For a root that is context only. |
| Moves its children to [where]. Renders no element. | Portal. |

Say when a part is optional, and what happens if it's left out:

> The heading that names the popover. Renders an `<h2>`. Optional. Without it,
> give Content an `aria-label`.

When a part is built on another component, say so and link it: "Built on
[Button](/docs/components/button/), so it takes the same props."

## Props

| Kind | Stem | Example |
| --- | --- | --- |
| Boolean flag | Verb for what `true` does. | Disables the button. / Keeps a disabled button in the tab order. |
| Controlled value | The [state]. Pair it with `onXChange` to control the [thing]. | The open state. Pair it with `onOpenChange` to control the popover. |
| Initial value | The [state] on first render. Later changes are ignored. Use `x` to control it. | The open state on first render. Later changes are ignored. Use `open` to control it. |
| Change callback | Called when [who or what] asks to change the [state]. Receives the new [state]. | Called when the trigger, Escape or an outside click asks to open or close. Receives the new state. |
| Preventable event | Called when [event]. Call `event.preventDefault()` to [what it stops]. | Called when Escape is pressed while open. Call `event.preventDefault()` to keep the popover open. |
| Enum | The [noun]. Then one sentence per value that changes behavior. | The native button type. `submit` submits the parent form. |
| Number | The [noun], in [unit]. | The gap between the trigger and the content, in pixels. |
| Element or component | The element or component to render. | For `as`. |
| Ref | Receives the rendered [element]. | Receives the rendered element. |
| ID | The id of [element]. Defaults to a generated id. | For `contentId`, `titleId`. |

Second sentences carry what the first can't: an interaction with another prop,
a consequence, or a constraint.

- "Ignored when `modal` is set."
- "Requires `Popover.Positioner` around the content."
- "A native disabled button leaves the tab order."

A description must say something the name and the type don't. Rewrite until it
does.

| Restates the name | Says what changes |
| --- | --- |
| The orientation of the tabs. | Which arrow keys move between tabs. Also sets `data-orientation`. |
| Whether the popover is modal. | Locks page scroll, keeps focus inside, and hides the rest of the page from screen readers while open. |
| Force mounts the content. | Keeps the content in the DOM while closed, so you can animate it out or measure it. |

## Data attributes

`<Attributes>` renders the columns `Attribute | Present when`. An enum row is
`<Attribute name="data-state" value="open">`; a value attribute like
`data-orientation` gets one row without `value`.

| Kind | Stem |
| --- | --- |
| Boolean | Present when the [thing] is [state]. |
| Enum, one row per value | `data-state="open"` / The popover is open. |
| Value | Set to the [noun]. For example, `data-orientation` is set to the orientation. |
| Conditional | Present when [state]. Only inside a Field. |

Link the attribute to the prop or state that drives it. "Present while
`pending` is set." beats "Present when pending."

## Keyboard rows

Table columns are `Key | Behavior`. Write keys with `<Kbd>`, and join a chord
with ` + `. Put keys that do the same thing in one row, separated by a comma.

Stem: [When focus is on X,] verb + object [+ where focus goes].

- Opens or closes the popover.
- Closes the popover and moves focus to the trigger.
- Moves focus to the next tab and shows its panel.
- When focus is on the trigger, opens the menu and focuses the first item.
- Moves focus to the first tab. With `loop`, wraps from the last tab to the
  first.

Present tense, no subject, ending with a period. When a prop changes what a key
does, name the prop in the row.

## Section leads

| Situation | Stem |
| --- | --- |
| A prop enables something | Use `x` to [outcome]. |
| The default needs saying first | [Component] [default behavior]. Set `x` to [change]. |
| Controlled state | Pass `x` and `onXChange` to control the [thing]. `onXChange` runs when [actions] and receives the new [state]. |
| A requirement | [Thing] needs [requirement]. Without it, [what breaks]. |

## Before and after

These are real lines from other libraries, rewritten for Xenon.

| Before | After | Why |
| --- | --- | --- |
| An easily stylable checkbox component. | A box that toggles between checked and unchecked, with an optional mixed state. | Every Xenon component is stylable. Say what this one does. |
| The Dialog component in Xenon provides a flexible and accessible way to create dialogs in your Solid applications. | A window over the page that keeps focus inside until it closes. | The before line fits any library. The after line fits only a dialog. |
| This section covers how to manage the `value` state of the component. | Pass `value` and `onValueChange` to control the selected tab. | The before line restates its own heading. |
| Used to force mounting when more control is needed. | Keeps the content mounted while closed. | Say what the prop does, not when someone might want it. |
| The popover will automatically close when the user clicks outside. | Clicking outside closes the popover. | Present tense, no "automatically". |
| Popover handles focus management intelligently. | Opening moves focus to the first tab stop in the content. Closing returns it to the trigger. | Name the behavior. |
| Note: make sure to add an accessible label. | Give Content an `aria-label` when there is no Popover.Title. | Say which prop, on which part, and when. |
| Radix Primitives are unstyled—and compatible with any styling solution—giving you complete control. | Xenon ships no CSS. Style the elements with any tool, and use the `data-*` attributes for state. | No em dashes, no filler. Say what the reader does. |

## Words

| Avoid | Write |
| --- | --- |
| will close | closes |
| is used to render | renders |
| in order to | to |
| e.g. / i.e. | for example / that is |
| Whether or not | Whether, or a verb stem |
| utilize, leverage | use |
| ensure that X | say what happens: "X stays focusable" |
| automatically | leave it out, or name what does it |
| component (as the head noun in a description) | the concrete noun: button, panel, list |
| handles X | the mechanism: sets, moves, prevents |
| accessible (as an adjective for the whole component) | the fact: sets `aria-expanded`, keeps a tab stop |
