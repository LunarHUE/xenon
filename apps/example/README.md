# @xenon/example

A single page that renders every component in `@xenon/solid` the way you would
actually use it: no wrappers, no demo-only props, and no styling from the
library. All of the CSS in `src/styles.css` hangs off the data attributes the
core sets (`data-state`, `data-disabled`, `data-pending`, `data-orientation`),
which is the intended way to skin these components.

```sh
bun run dev      # http://127.0.0.1:5173
bun run build
```

Each section is worth driving from the keyboard, since that is where the
behavior lives: Space and Enter on the four button hosts, Space on a switch,
arrows inside the toolbar, and the browser's own validation on the form.
