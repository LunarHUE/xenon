# Pagination coverage

`pagination.alpha.1` passes in jsdom, Chromium and WebKit. It covers landmark
naming, current-page changes, boundary disabling, ordinary tab-stop attributes,
decorative ellipses and the suite's axe rules. `alpha.2` and `alpha.3` pass in
Chromium and WebKit with native Tab, Enter and Space input, button form behavior,
and enabled/disabled anchor semantics.

Core tests cover the bounded range, invalid numeric inputs, current/repeated
selection and cancellation. Solid tests cover controlled/uncontrolled state,
count clamping, reactive For ranges, author cancellation and stable hosts. The
SSR fixture verifies render-function ranges and links with href/current state.

No roving focus, routing library, item-count/page-size conversion, locale labels,
or constant-width range is shipped. Windows cap at 100 to bound allocations.
Custom forwarding components, hydration and assistive-technology speech are not
covered by these tests. Modified-link activation retains native browser behavior;
the native tests here exercise Enter and Space, not opening a separate tab.
