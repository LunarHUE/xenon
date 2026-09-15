# Visually hidden

The alpha adapter exports `VisuallyHidden`. The default host is `span`, with
`as` for another host. Its full clip-path recipe preserves text in accessible
names without requiring a stylesheet. Author object and string styles override
library defaults. Props, events, children, and refs reach the host.

`focusable` reveals the host while it or a descendant has focus. It does not
create a tab stop. Focus leaving the subtree reapplies the hiding recipe.

This utility has no framework-independent state engine. Focus tracking and style
merging belong to the adapter. Research divergences are resolved in favor of
`clip-path: inset(50%)`, rather than legacy `clip` or incomplete CSS.
