# Breadcrumbs coverage

`breadcrumbs.alpha.1` passes in jsdom, Chromium and WebKit. It checks landmark
naming, native ordered-list entries, focusable anchors, noninteractive current
text, decorative separators and the suite's axe rules. Core tests cover explicit
current state and unchanged link semantics. Solid tests cover reactive current
links without replacing their hosts. Pagination's SSR fixture verifies list
structure, href and current-page text before client JavaScript.

No automatic last-item inference, collapse menu, routing library, disabled-link
API, or synthetic keyboard interaction is shipped. Consumers explicitly mark the
current page and place separators inside list entries. Hydration, modified-click
navigation and assistive-technology speech are not covered here.
