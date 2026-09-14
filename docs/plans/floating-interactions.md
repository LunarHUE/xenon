# Floating interactions

Build Tooltip, HoverCard, ContextMenu, Menubar, and NavigationMenu as separate
headless component subpaths, with pure core logic and reusable browser behavior.
Reuse the established overlay Portal/Positioner/Content/Viewport parts and native
top-layer hosting. Keep focused commits, public TSDoc, and browser regressions.

## Agreed Tooltip API

```tsx
<Tooltip.Provider openDelay={600} closeDelay={100} skipDelay={300} hoverable>
  <Tooltip openDelay={0}>
    <Tooltip.Trigger>Save</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner side="top">
        <Tooltip.Content>
          <Tooltip.Arrow />
          <Tooltip.Viewport>Save your changes</Tooltip.Viewport>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip>
</Tooltip.Provider>
```

The provider supplies behavior and timing only. There is no adapter prop, global
styling, component renderer injection, or theme. Resolution is local prop, then
nearest provider defining the property, then library default. Undefined inherits;
zero and false override. Nested providers share their parent's delay coordinator
unless `isolated` is supplied. A root without a provider owns its own coordinator,
so there is no process-global state to leak between SSR requests or applications.

Individual roots own open/defaultOpen/onOpenChange. Provider configuration includes
openDelay, closeDelay, skipDelay, hoverable, closeOnPress and closeOnEscape. Typed
createHandle connections remain separate from provider delay sharing: handles
switch one popup between triggers and payloads, while providers coordinate roots.

Tooltip content stays role=tooltip without focus or restoration. Triggers retain
native semantics and receive aria-describedby, never generated expanded/haspopup
attributes. Hover and keyboard focus each hold it open; focus opens immediately.
Touch does not synthesize hover. Root disabled gates the tooltip; aria-disabled
on an otherwise focusable trigger still allows explanation. Escape targets the
top layer. Hoverable content uses a bounded measured travel corridor.

## Family decisions

- HoverCard: native anchor trigger, 600ms hover/focus opening and 300ms closing,
  nonmodal interactive content, no focus theft on hover. Escape restores focus only
  when it originated inside the card.
- ContextMenu: native contextmenu and keyboard invocation, point-based anchor,
  cancelable 500ms touch hold, shared Menu parts and keyboard model.
- Menubar: menubar/menuitem semantics with roving top triggers; wrapping by default,
  first/last item keyboard opening, existing Menu submenu ownership and dismissal.
- NavigationMenu: native navigation, links, and disclosure buttons rather than
  menu roles. Null is explicit controlled closed state; undefined is uncontrolled.
  Shared positioner/viewport supports panel changes and native link navigation.

Coverage ledgers record specific choices and optional library candidates. Real
pointer geometry, focus, portal ancestry and native dismissal require Chromium
and WebKit coverage. Unit tests cover timing and controlled-state decisions.
