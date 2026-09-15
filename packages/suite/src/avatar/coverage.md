# Avatar coverage

Four shared tests cover idle/loading/loaded/error, stale completion, source
replacement, image removal, native responsive props, refs, fallback delays,
cached completion, zero-width failure, and axe on fallback and image states.
They pass in jsdom, Chromium, and WebKit. A browser-only test verifies real
SVG data-image loading followed by broken-image failure in both browsers.

The Solid SSR test covers fallback output and confirms that rendering creates
no native image. It also verifies server semantics for VisuallyHidden and
AccessibleIcon. Hydration node identity and image transitions are not covered.
