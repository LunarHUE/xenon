# Avatar

The alpha API is `Avatar`, `Avatar.Image`, and `Avatar.Fallback`. Root and fallback
default to `span` with an `as` escape hatch. Image always renders a native `img`.
One Image is supported per root. `data-state` on each rendered part is `idle`,
`loading`, `loaded`, or `error`.

A client effect creates a native detached image probe with the source, responsive
source configuration, CORS mode, and referrer policy. No source stays idle.
Successful loads require positive natural width. Cached complete probes resolve
immediately. Source/config changes dispose old listeners and invalidate stale
callbacks. Image unmount restores idle state and fallback. Server rendering does
not construct images or start timers. The image enters the DOM only after load.

Image requires consumer-provided `alt`, including an empty string for decorative
images. Fallback text is readable in the document; initials should have a complete
name supplied by the author with appropriate semantics, for example
`<Avatar.Fallback role="img" aria-label="Ada Lovelace">AL</Avatar.Fallback>`.
Only the loaded image or fallback is rendered at a time.

Root `fallbackDelay` defaults to zero. Nonfinite or negative values use zero.
The delay starts when fallback is needed; changing to zero reveals immediately.
Changing delay does not hide already visible fallback. A loaded image resets the
fallback timer. Author attributes and image events override/compose through spread;
all parts forward refs. No loading callback fires on mount because this API has no
loading callback. The image state is adapter-local because its inputs are native
loading events; no empty framework-independent engine is introduced.

Deferred research APIs include keepMounted, loading-status callbacks, transition
presence, multiple-image warnings, and injected loading probes. This alpha chooses
the default unmounted-while-loading behavior from the merged research.
