# Accessible icon

The alpha adapter exports `AccessibleIcon` with a required `label`. A default
`span` exposes `role="img"` and `aria-label`. An inner `aria-hidden` span contains
the caller's decorative artwork. The wrapper supplies one accessible image name
without cloning or modifying the caller's SVG. Children must be noninteractive.

`as` changes the noninteractive host. Author props, events, and refs reach it;
author role and ARIA attributes override generated attributes. Empty artwork is
allowed, unlike Radix's clone-based single-child restriction. This utility needs
no framework-independent state engine.
