# Resizable coverage

Core tests cover adjacent transfer invariants, total preservation across many
requests, invalid constraints and values, RTL and vertical keys, boundaries,
collapse and restore capacity. DOM tests isolate primary pointer ownership,
measured percent displacement, missed release, cleanup and external style ownership.

Solid tests cover stable nodes, live author IDs, controlled rejection, cancellation,
collapse inertness, registry cleanup, commit deduplication and SSR associations.
Browser tests cover native Tab focus, keyboard behavior, native mouse dragging,
RTL and vertical keys, axe, synthetic touch pointer ownership, cancellation and
unmount selection cleanup in Chromium and WebKit. Synthetic touch dispatch verifies
the pointer path but does not establish physical touchscreen scrolling behavior.
