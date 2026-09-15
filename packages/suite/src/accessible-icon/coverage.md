# Accessible icon coverage

The shared test checks one accessible image despite named SVG artwork, reactive
label replacement, ref/attribute forwarding, absence of wrapper tab stops, and
axe. It passes in jsdom, Chromium, and WebKit. Server output is exercised by the
avatar utility SSR fixture. Interactive children are outside the API contract.
