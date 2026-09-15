# Breadcrumbs

Breadcrumbs renders a `nav` named "Breadcrumbs" by default. Author attributes,
including ARIA naming, override defaults. `List` renders `ol`; `Item` renders
`li`; `Link` renders a native anchor. Supply href for navigable links.

Mark the current page explicitly with `Link current` or `Current`, which renders
a noninteractive span. Both expose `aria-current="page"`. Current links retain
href and native focusability. No last-item inference, routing integration,
collapsing, or synthetic keyboard interaction is supplied.

`Separator` renders an aria-hidden span with author-supplied content. Place it
inside an Item to preserve valid ordered-list structure. The library supplies no
separator text, artwork, or styles. `data-state` distinguishes current and idle
links and marks Current as current.

Core tests cover landmark naming, native semantics and current/decorative
attributes. Solid tests cover ordered structure, current text, preserved link
navigation and reactive current-state updates without replacing the host.

Reference: [APG Breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/).
