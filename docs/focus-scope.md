# Focus scopes

`registerFocusScope` in `@xenon/dom` owns initial focus, Tab containment, and focus
restoration. It is separate from `registerLayer`: dismissal and focus management
can end at different points during a component's close sequence. Neither handle
creates a portal or makes the page modal.

```ts
const focusScope = registerFocusScope(content, {
  parent: parentFocusScope,
  initialFocus: heading,
  finalFocus: trigger,
})
const release = focusScope.registerBranch(portalledContent)
// At the end of this focus session:
release()
focusScope.dispose()
```

Register after attaching the content. `contain` and `restoreFocus` default to
`true`. Initial focus runs synchronously: a usable explicit target inside the
scope wins, followed by focus already inside, an `autofocus` descendant, the
first tab stop, and finally the container. `initialFocus: false` leaves current
focus alone. Explicit targets must belong to the scope's document; initial
targets must also be inside its content or branches.

An empty region gets a temporary `tabindex="-1"` only if the container needs it.
Disposal removes that value only while it is still the value xenon supplied.
Author tabindex values are preserved. Focus requests use `preventScroll: true`.

Each document has one scope manager. The newest containing scope owns Tab and
rejects programmatic focus attempts outside its region. A child scope can live
in a portal and pause its parent's containment. A child with `contain: false`
adds its content and branches to the parent region without adding another trap.
Parent handles must be active in the same document when a child registers.

Content, branches, and non-containing children contribute tab stops in that
order. Each root uses its own tabbable order; duplicate nodes are removed. A
named radio group contributes its checked radio, or its first eligible radio
when nothing is checked. Groups are distinguished by name, form owner, and tree
root. Positive tabindex values sort within each root, not across portal roots.

Tab and Shift+Tab cycle through these stops. The listener runs in bubble phase
and honors cancellation and Alt, Control, or Meta modifiers. Escape remains the
dismissal layer's responsibility. Candidate discovery uses
[`tabbable`](https://github.com/focus-trap/tabbable#api) with normal visibility
checks and open-shadow traversal enabled. There is no production jsdom bypass.
Real-browser tests cover visibility, disabled fieldsets, radios, and shadow slots.

Candidates are refreshed on navigation. A mutation observer also detects when
focused content is removed, hidden, disabled, or made inert. Recovery prefers
the last usable inside target, then the first tab stop, then the container. If a
replacement view already focused its own control, that focus is preserved.
Observation includes discovered open shadow roots and registered branches.

`update` replaces `contain`, `restoreFocus`, and `finalFocus`; omitted options
return to their defaults. It preserves registration order. Parent and initial
focus are fixed for the session. Enabling containment reclaims focus when the
scope becomes the active trap. Branch registration is reference-counted and
its cleanup is idempotent.

Disposal removes the scope from the stack before restoring focus. A top scope
restores only while focus is still in its region or has fallen to the document
body after its focused content disappeared. A non-containing scope leaves an
outside destination alone if the user or application deliberately focused it.
Usable explicit final focus wins over the saved opener. If the opener belonged
to a disposed ancestor, restoration walks back through the saved ancestor
openers, even while exit content is still mounted. Closing an ancestor before
its child never steals the child's focus.

`restoreFocus: false` suppresses return to the opener. A remaining parent trap
still reclaims focus when necessary to enforce its own containment. Final
cleanup disconnects observers and document listeners.

This is focus management, not a complete modal implementation. Background
inertness, scroll locking, native dialog synchronization, and restoration across
document boundaries are separate work. A scope can be owned by an iframe's
document, but this does not promise containment across embedded iframe documents
or traversal through closed shadow roots. CSS-only changes that produce no
observed mutation are re-evaluated on the next navigation or focus event.
