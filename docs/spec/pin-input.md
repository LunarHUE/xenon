# Pin input and password input

Two `##` sections. `pin-input` is the segmented one-time-code field, shipped as
PinInput (reka, melt, bits, zag, ark), OtpField (corvu), OneTimePasswordField
(radix) and OTPField (base-ui). `password-input` is a single password field with
a visibility toggle, shipped as PasswordToggleField (radix) and PasswordInput
(zag, ark).

Bullets tagged `[apg]`, `[html]` or `[axe]` come from a standard or a linter
rather than a library, so they are normative and never carry `(candidate)`.
Neither component has an APG pattern page.

## pin-input

### Roles and attributes

- [ ] `pin-input.roles-and-attributes.1` Given a pin input, then the root is `role="group"` so assistive technology reports the slots as one control, and it survives being rendered as another tag through `asChild` or `render`. [radix, base-ui]
- [ ] `pin-input.roles-and-attributes.2` Given the anatomy, then the parts are root, label, control and input, plus a hidden input for form value. [zag, melt, bits]
- [ ] `pin-input.roles-and-attributes.3` Given the root, then it carries `data-invalid`, `data-disabled`, `data-readonly` and `data-complete`, and the label adds `data-required`. [zag, base-ui, reka]
- [ ] `pin-input.roles-and-attributes.4` Given every slot filled, then the root and every slot carry `data-complete`. [zag, base-ui, reka]
- [ ] `pin-input.roles-and-attributes.5` Given a slot, then it carries its index (`data-index` or `data-radix-index`), a filled marker when it holds a character (`data-filled`), and `data-disabled`, `data-readonly`, `data-invalid` and `aria-invalid` mirroring the root. [zag, radix, base-ui]
- [ ] `pin-input.roles-and-attributes.6` Given three slots, then each slot's `aria-label` reads "pin code 1 of 3", "pin code 2 of 3", "pin code 3 of 3" from a translated template. [zag, ark]
- [ ] `pin-input.roles-and-attributes.7` Given a numeric or OTP pin input, then each slot sets `inputmode="numeric"`, and a text pin input sets `inputmode="text"`; an explicit `inputMode` prop overrides the built-in choice for the first slot and the hidden input. [zag, base-ui, corvu]
- [ ] `pin-input.roles-and-attributes.8` Given each slot, then `autocapitalize` is off or none and `spellcheck` is false, so mobile keyboards do not mangle a code. [zag, corvu]
- [ ] `pin-input.roles-and-attributes.9` Given a slot, then `enterkeyhint` is `done` on the last slot and `next` on the others, so mobile keyboards show the right action key. [zag] (candidate)
- [ ] `pin-input.roles-and-attributes.10` Given a masked pin input, then the visible slots render as `input[type="password"]`; a per-slot `type` override wins over the mask, for example `type="tel"` on one slot. [melt, base-ui, zag, radix]
- [ ] `pin-input.roles-and-attributes.11` Given a `placeholder`, then it is shown on empty unfocused slots and blanked on the focused slot, so the caret is never competing with placeholder glyphs; the placeholder returns as soon as the slot is blurred while empty. [reka, melt, zag]
- [ ] `pin-input.roles-and-attributes.12` Given a `disabled` pin input, then every slot is disabled, the root carries `data-disabled`, and the hidden input is disabled too. [melt, bits, base-ui, radix, zag]
- [ ] `pin-input.roles-and-attributes.13` Given a `readOnly` pin input, then every slot carries the native `readonly` attribute and the root carries `data-readonly`; focusing a read-only slot still sets `data-focused` on the root. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.14` Given a length-validated pin input, then each visible slot gets a single-character `pattern`, for example `pattern="[a-zA-Z0-9]{1}"` for alphanumeric validation, while the hidden validation input gets the full-length pattern. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.15` Given a `length` and an overlong default value, then only the first visible slot carries `maxlength` equal to the length and the remaining slots carry no `maxlength`. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.16` Given a field label associated with the pin input, then every slot resolves to that accessible name (via `aria-labelledby` or a native `for` pointing at the first slot's id), and no slot carries `aria-describedby` for the field description; the description goes on the group instead. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.17` Given a native label plus a per-slot `aria-label` on the first slot, then the shared label wins on the first slot and the `aria-label` is dropped, while later slots keep their own `aria-label`. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.18` Given a root `aria-labelledby` or `aria-describedby`, then it lands on the `role="group"` root only and no slot carries it; an external `aria-describedby` is ordered before a field description id. [base-ui] (candidate)
- [ ] `pin-input.roles-and-attributes.19` Given a consumer-rendered slot layout, then the component exposes per-slot state instead of slot elements: a cells list with `char`, `isActive` and `hasFakeCaret`, plus `isFocused` and `isHovering`. [bits, corvu]
- [ ] `pin-input.roles-and-attributes.20` Divergence: each slot is its own focusable `input`, so the component manages a roving tabindex across slots, with `tabindex="0"` on the insertion point and `-1` on the rest. [zag, ark, reka, melt, radix, base-ui] (decision needed)
- [ ] `pin-input.roles-and-attributes.21` Divergence: one real transparent input sits over consumer-drawn slots and is the only focus target, with selection exposed as an active-slot index array so no slot needs its own input. [corvu, bits] (decision needed)
- [ ] `pin-input.roles-and-attributes.22` Divergence: `autocomplete="one-time-code"` goes on the first slot only and every other slot gets `autocomplete="off"`. [base-ui] (decision needed)
- [ ] `pin-input.roles-and-attributes.23` Divergence: `autocomplete="one-time-code"` goes on every slot when the field is in OTP mode, and `off` on every slot when it is not. [zag, ark, corvu] (decision needed)

### Keyboard

- [ ] `pin-input.keyboard.1` Given a character typed into a slot, then it lands in that slot and focus advances to the next one; a character typed into the last slot leaves focus there. [reka, melt, bits, zag, ark, radix, base-ui]
- [ ] `pin-input.keyboard.2` Given the last slot is filled, when more characters are typed, then the overflow is dropped and focus stays on the last slot. [reka, melt, zag]
- [ ] `pin-input.keyboard.3` Given a slot receives two characters at once, then only one character is kept in that slot. [zag, base-ui]
- [ ] `pin-input.keyboard.4` Given a slot already holding a character, when the same character is typed again, then the value is unchanged and focus still advances to the next slot. [zag, base-ui]
- [ ] `pin-input.keyboard.5` Given a filled slot is refocused and a different character typed, then that slot holds only the new character, the following slots keep their values, and focus advances. [zag, bits, base-ui]
- [ ] `pin-input.keyboard.6` Given ArrowLeft and ArrowRight, then focus steps one slot back and forward; ArrowLeft on the first slot keeps focus there rather than wrapping. [reka, melt, bits, zag, radix, base-ui]
- [ ] `pin-input.keyboard.7` Given Home, then focus moves to the first slot. [melt, bits, zag, base-ui]
- [ ] `pin-input.keyboard.8` Given a partially filled pin input, when ArrowRight is pressed past the insertion point, then focus stays at the insertion point instead of jumping into empty slots ahead of it. [zag, base-ui]
- [ ] `pin-input.keyboard.9` Given Backspace on a filled slot, then that slot is cleared and focus moves to the previous slot; on the first slot focus stays put. [reka, melt, bits, zag, ark, base-ui]
- [ ] `pin-input.keyboard.10` Given Backspace on an empty non-first slot, then the previous filled slot is cleared and focus moves to it. [reka, melt, zag, ark, base-ui]
- [ ] `pin-input.keyboard.11` Given Backspace pressed repeatedly from the last slot, then each press clears one slot walking backward, ending with focus on the first slot and every slot empty. [reka, melt] (candidate)
- [ ] `pin-input.keyboard.12` Given Delete on a filled slot, then that slot's character is removed and focus stays put. [reka, melt, base-ui, zag]
- [ ] `pin-input.keyboard.13` Given Delete on an empty slot, then nothing changes and no change callback fires. [zag, base-ui]
- [ ] `pin-input.keyboard.14` Given a numeric pin input, when a non-digit such as `a`, `!` or `$` is typed, then the slot stays empty and focus does not advance; zeros are accepted as real characters, so `00000` fills every slot. [reka, bits, zag, base-ui]
- [ ] `pin-input.keyboard.15` Given `type="alphabetic"` or alpha validation, when a digit is typed, then it is rejected, and a letter is accepted with focus advancing. [zag, base-ui]
- [ ] `pin-input.keyboard.16` Given a filled slot, when an invalid character is typed into it, then the existing character is kept, focus stays, and the character stays selected so the next keystroke replaces it. [base-ui] (candidate)
- [ ] `pin-input.keyboard.17` Given the modifier form of the delete gestures, then Ctrl or Cmd plus Backspace clears the whole value and moves focus to the first slot, and Home followed by Delete clears the first slot; Ctrl or Cmd plus A then X cuts and removes the selected characters. [zag, base-ui]
- [ ] `pin-input.keyboard.18` Given ArrowUp, then focus jumps to the first slot; given ArrowDown, focus jumps to the first empty slot (or stays on the final slot when the value is complete). Both events are canceled and their propagation stopped, so a surrounding key handler does not also see them. [base-ui, bits]
- [ ] `pin-input.keyboard.19` Given a modifier plus ArrowLeft or ArrowRight, then focus jumps to the first slot or to the first empty slot respectively, for both Ctrl and Cmd. [base-ui] (candidate)
- [ ] `pin-input.keyboard.20` Given a read-only pin input, then ArrowLeft, ArrowRight, Home, End, ArrowUp and ArrowDown all still move focus, while Delete, Backspace and typing leave the value untouched. [base-ui] (candidate)
- [ ] `pin-input.keyboard.21` Given a disabled pin input, then vertical arrow keys are left unhandled: nothing calls `preventDefault` and a surrounding key handler receives the events. [base-ui] (candidate)
- [ ] `pin-input.keyboard.22` Given a completed pin input whose last slot holds the character being typed again, then the selection is not reset, so no needless re-select fires. [base-ui] (candidate)
- [ ] `pin-input.keyboard.23` Given a value shorter than the slot count and typing into the last slot for the first time, then focus stays there and the character is selected (`selectionStart` 0, `selectionEnd` 1) because there is no next slot to advance to. [base-ui] (candidate)
- [ ] `pin-input.keyboard.24` Given the caret placed at the start or the end of a slot that already holds a character, when a new character is typed, then the slot holds exactly the new character and focus advances; caret offset within a slot does not change the outcome. [reka] (candidate)
- [ ] `pin-input.keyboard.25` Given a `pattern` such as digits-only, when a non-matching key is typed, then the value does not change; typing `1$` leaves just `1`. [bits, corvu]
- [ ] `pin-input.keyboard.26` Given the single-input design, then the only key tracked directly is Shift, which latches a flag used to widen the normalized selection so shift-extension can cover more than one slot; ArrowLeft and ArrowRight are handled by snapping the selection to a one-character range with a direction of backward or forward. [corvu] (candidate)
- [ ] `pin-input.keyboard.27` Given the caret at index 0, then the normalized selection becomes `[0, 1]` with direction forward; at the maximum length it becomes `[maxLength - 1, maxLength]` with direction backward. [corvu] (candidate)
- [ ] `pin-input.keyboard.28` Divergence: Delete and Backspace splice the value and shift the remaining characters left so the value never has holes; deleting the middle of `1`,`2`,`3` gives `1`,`3`,`""`. [zag, base-ui] (decision needed)
- [ ] `pin-input.keyboard.29` Divergence: Delete and Backspace clear only the targeted slot and leave a hole, so deleting the second slot of `t`,`e`,`s`,`t` gives `t`,`""`,`s`,`t`. [reka, melt] (decision needed)
- [ ] `pin-input.keyboard.30` Divergence: End moves focus to the last FILLED slot, so a partially filled field lands on the last character rather than the next empty box. [zag] (decision needed)
- [ ] `pin-input.keyboard.31` Divergence: End moves focus to the first EMPTY slot, which is the insertion point for the next character. [base-ui] (decision needed)

### Pointer

- [ ] `pin-input.pointer.1` Given a partially filled pin input, when a slot past the insertion point is clicked, then focus is redirected to the insertion point; filled slots stay directly clickable. [zag, base-ui, reka]
- [ ] `pin-input.pointer.2` Given a filled slot, when it is pressed, then its character is selected (`selectionStart` 0, `selectionEnd` 1) so typing replaces rather than appends. [base-ui] (candidate)
- [ ] `pin-input.pointer.3` Given a consumer `onMouseDown` that calls `preventDefault`, then the component's own focus-on-mousedown is suppressed and the slot does not receive focus. [base-ui] (candidate)
- [ ] `pin-input.pointer.4` Given a pasted code, then consecutive slots fill from the focused slot forward, the value is truncated to the available slots, and characters to the left of the paste point are preserved. [reka, zag, radix, base-ui]
- [ ] `pin-input.pointer.5` Given a paste into a filled field, then the pasted characters overwrite from the caret onward and focus lands on the slot after the last pasted character. [zag, base-ui]
- [ ] `pin-input.pointer.6` Given a numeric pin input, when mixed text such as `a1b2c3` is pasted, then only the digits are kept in order and non-digits are dropped; a paste with no digits leaves every slot empty. [reka, base-ui]
- [ ] `pin-input.pointer.7` Given a sanitizing transform, when `1-2-3` or `1-2-3-4-5-6` is pasted, then separators are stripped before the length check, so a transformed paste longer than the slot count still completes. [zag, bits]
- [ ] `pin-input.pointer.8` Given a paste longer than the slot count, then the value is sliced to the slot count before validation runs. [corvu, radix]
- [ ] `pin-input.pointer.9` Given a read-only pin input, when text is pasted, then the value and focus are unchanged. [base-ui] (candidate)
- [ ] `pin-input.pointer.10` Given a paste event whose clipboard read throws (for example a `SecurityError`), then the value is unchanged and exactly one development warning names the failed clipboard read; a paste event with no clipboard data at all is still canceled and changes nothing. [base-ui] (candidate)
- [ ] `pin-input.pointer.11` Given a filled pin input, when the clear trigger is clicked, then every slot is cleared and focus returns to the first slot. [zag] (candidate)
- [ ] `pin-input.pointer.12` Given the single-input design, then the root is `pointer-events: none` while the input is `pointer-events: all`, so a click anywhere in the slot layout lands on the invisible full-size input; the input's next sibling is forced back to `pointer-events: all` so a visible slot wrapper stays interactive. [corvu] (candidate)
- [ ] `pin-input.pointer.13` Given the input is not disabled, when the pointer enters it, then a hovered flag is set and cleared on leave; a disabled input never sets it. [corvu] (candidate)

### Focus management

- [ ] `pin-input.focus-management.1` Given an empty slot after a gap is focused programmatically, then focus is redirected to the first empty slot, so a user cannot start typing in the middle of a code. [reka, base-ui]
- [ ] `pin-input.focus-management.2` Given only one slot is tabbable, when Tab is pressed from the active slot, then focus leaves the field entirely and lands on the next control (for example the clear button or a Next button) rather than walking through the remaining slots. [zag, base-ui]
- [ ] `pin-input.focus-management.3` Given focus on the control after the field, when Shift+Tab is pressed, then focus re-enters at the insertion point, which is the last slot when every slot is filled. [zag] (candidate)
- [ ] `pin-input.focus-management.4` Given `autoFocus`, then the first slot is focused on mount. [ark] (candidate)
- [ ] `pin-input.focus-management.5` Given a pin input inside a field wrapper, when the field label is clicked, then the first slot receives focus. [ark, base-ui]
- [ ] `pin-input.focus-management.6` Given `blurOnComplete`, when the last character is entered, then the last slot is blurred; pressing Backspace on the last slot afterwards moves focus to the previous slot instead of blurring again. [zag] (candidate)
- [ ] `pin-input.focus-management.7` Given a hidden validation input focused programmatically, then focus is redirected to the first visible slot. [base-ui] (candidate)
- [ ] `pin-input.focus-management.8` Given an exposed input ref, when a consumer calls focus on it, then the real (hidden) input takes focus. [bits] (candidate)
- [ ] `pin-input.focus-management.9` Given a controlled value whose change is never accepted, then focus does not move later when the value changes for another reason; given a change accepted asynchronously, focus moves to the next slot once it lands. [base-ui] (candidate)
- [ ] `pin-input.focus-management.10` Given a consumer `onFocus` or `onBlur` that calls `preventDefault`, then the DOM focus still moves but the component's own focused state does not follow, so `data-focused` on the root can be suppressed or preserved deliberately. [base-ui] (candidate)
- [ ] `pin-input.focus-management.11` Given the single-input design, when the input is focused, then the selection is first collapsed to the end of the value, the focused flag is set, and the selection is normalized into active slots; on blur the shift flag clears, active slots empty and the inserting flag is false. [corvu] (candidate)
- [ ] `pin-input.focus-management.12` Given a selection change while the input is not the active element, or with a null selection range, then the selection is recorded as null, active slots empty and the inserting flag is false. [corvu] (candidate)

### State

- [ ] `pin-input.state.1` Given every slot filled, then the completion callback fires once with the joined value, and with an array form of it where the library exposes one; a numeric field reports numbers rather than strings. [reka, melt, bits, zag, ark, corvu, base-ui]
- [ ] `pin-input.state.2` Given a completed pin input that is cleared and refilled, then the completion callback fires again, including when the last slot is refilled with the same character. [bits, zag, ark]
- [ ] `pin-input.state.3` Given an incomplete value, then the completion callback does not fire. [bits, base-ui]
- [ ] `pin-input.state.4` Given a controlled value set externally, then every slot re-renders to the new characters, a reset clears them, and typing still works afterwards. [bits, zag, corvu]
- [ ] `pin-input.state.5` Given a change in one slot, then the change callback receives the whole next value, not only the edited character. [melt, base-ui]
- [ ] `pin-input.state.6` Given a default value longer than the slot count, then it is clamped to the slot count and the hidden input holds the clamped string. [base-ui, corvu]
- [ ] `pin-input.state.7` Given slots rendered with no explicit index, then indexes come from render order, and slots split across wrapper elements with a separator between them still count as one sequence. [base-ui] (candidate)
- [ ] `pin-input.state.8` Given validation of `alpha`, `alphanumeric` or `numeric`, then typed and pasted characters outside the class are filtered out before the value updates, for example `1a2b3C` becoming `abC` under alpha and `A1-B2c3` becoming `A1B2c3` under alphanumeric. [base-ui, corvu]
- [ ] `pin-input.state.9` Given a custom normalizer, then built-in validation runs FIRST and the normalizer receives the already-filtered string; its output is filtered through validation again and then clamped to the length. With validation set to none the normalizer is the only filter. [base-ui] (candidate)
- [ ] `pin-input.state.10` Given a normalizer or built-in validation that removed characters, then the invalid callback fires once with the RAW input and a reason of `input-change` or `input-paste`, while the change callback carries the accepted value. [base-ui] (candidate)
- [ ] `pin-input.state.11` Given a change callback that cancels the change, then the value stays, focus stays where it was for typing, Backspace and paste alike, and the completion callback never fires. [base-ui] (candidate)
- [ ] `pin-input.state.12` Given a controlled value whose parent rejects a change, then the DOM input is snapped back to the context value. [corvu] (candidate)
- [ ] `pin-input.state.13` Given the change reason, then it distinguishes typing (`input-change`), clearing a slot (`input-clear`), pasting (`input-paste`) and key-driven deletion (`keyboard`), and the details object narrows the event type per reason. [base-ui] (candidate)
- [ ] `pin-input.state.14` Given a controlled complete value replaced by another complete value from outside, then the completion callback does not fire again; a stale unaccepted completion never fires it late; an asynchronously accepted completion fires it once. [base-ui] (candidate)
- [ ] `pin-input.state.15` Given a complete value pasted over an already complete value, then the completion callback fires once per paste, even when the pasted value is identical to the previous one. [base-ui] (candidate)
- [ ] `pin-input.state.16` Given the single-input design, then the inserting flag is true exactly when the value is shorter than the maximum length and the caret sits at the end of the value, which is the signal for drawing a fake caret; active slots are the indexes covered by the normalized selection, so one caret yields one index and a shift-selection yields several. [corvu] (candidate)
- [ ] `pin-input.state.17` Given a completed pin input whose value is reset to empty, then the placeholders return on the now-empty slots. [reka] (candidate)

### Forms

- [ ] `pin-input.forms.1` Given a `name`, then a hidden input carries that name and the joined value, and it is not visible; with no `name` the hidden input still exists under a derived id. [melt, bits, zag, radix, base-ui]
- [ ] `pin-input.forms.2` Given a hidden input that a password manager autofills with a longer or dirtier string, then the value is filtered and split across the slots, focus lands on the last slot, and the invalid callback reports the raw string while the change and completion callbacks report the accepted value. [base-ui] (candidate)
- [ ] `pin-input.forms.3` Given a disabled or read-only pin input, then hidden-input autofill is ignored entirely: the value stays empty and no change, invalid or completion callback fires. [base-ui] (candidate)
- [ ] `pin-input.forms.4` Given a required pin input in a form, then `checkValidity()` is false while the code is incomplete and true once it is complete, driven by `minlength`, `maxlength` and a full-length `pattern` on the hidden input. [base-ui] (candidate)
- [ ] `pin-input.forms.5` Given a pin input inside a field wrapper, then `required`, `disabled` and `readOnly` reach the hidden input, helper text renders, and error text appears only when the field is invalid; a disabled field drops `aria-invalid` while an invalid read-only field keeps it on every slot. [ark, base-ui]
- [ ] `pin-input.forms.6` Given field validation in on-blur mode, then blurring from one slot to another slot does NOT validate, and blurring to a control outside the field validates once with the latest value. [base-ui] (candidate)
- [ ] `pin-input.forms.7` Given a form reset, then the value resyncs from the DOM input after the next paint rather than being left stale. [corvu] (candidate)
- [ ] `pin-input.forms.8` Divergence: completing the code submits the owning form automatically, with no opt-in prop. [zag] (decision needed)
- [ ] `pin-input.forms.9` Divergence: completing the code does not submit the form unless `autoSubmit` is set; with it set the form submits exactly once with the completed value, an associated external form by id is submitted instead of an ancestor form, a non-form element with that id submits nothing, an incomplete code submits nothing, and a form with no `requestSubmit` keeps the value without submitting. [base-ui] (decision needed)

### RTL and i18n

- [ ] `pin-input.rtl-and-i18n.1` Given `dir="rtl"`, then the horizontal arrows are mirrored: ArrowRight moves toward the previous slot and ArrowLeft toward the next; modifier-plus-arrow boundary jumps mirror the same way. [zag, base-ui]
- [ ] `pin-input.rtl-and-i18n.2` Given an IME composition in progress, then focus does not shift between slots, arrow keys do not move, and nothing is written into a slot until composition ends; on `compositionend` the committed value is processed and distributed one character per slot, with focus landing after the last one. A numeric field rejects a non-numeric committed composition outright. [reka] (candidate)

### SSR and hydration

- [ ] `pin-input.ssr-and-hydration.1` Given server rendering with a root id, then slot ids are deterministic: the first slot reuses the root id and later slots append a 1-based suffix. [base-ui] (candidate)
- [ ] `pin-input.ssr-and-hydration.2` Given server rendering, then the hidden validation input is emitted with `minlength`, `maxlength` and the full-length pattern so a no-JavaScript form still validates. [base-ui] (candidate)
- [ ] `pin-input.ssr-and-hydration.3` Given a React 17 id fallback where `useId` is unavailable, then generated slot ids are omitted during SSR until the client assigns them. [base-ui] (candidate)
- [ ] `pin-input.ssr-and-hydration.4` Given a no-script CSS fallback, then a `<noscript><style>` block is emitted on the server restoring color, background, caret, letter spacing, centered text, a visible border, full width, inherited font size and no clip path, so the field is usable without JavaScript; the block is not rendered on the client, so hydration must tolerate a server-only node. Setting the fallback to null emits nothing and hands the no-JavaScript appearance to the consumer. [corvu] (candidate)

### Accessibility tooling

- [ ] `pin-input.accessibility-tooling.1` Given a default pin input, when axe runs, then there are no violations; this holds for the numeric variant too. [reka, melt, zag, ark, radix]
- [ ] `pin-input.accessibility-tooling.2` Given a length that does not match the number of rendered slots, then exactly one development warning names both numbers, with singular wording for one input. [base-ui] (candidate)
- [ ] `pin-input.accessibility-tooling.3` Given a length of 0, -1, 3.7, NaN or Infinity, then exactly one development warning says the length must be a positive integer. [base-ui] (candidate)
- [ ] `pin-input.accessibility-tooling.4` Given an `aria-label` on the first slot with no associated label, then exactly one development warning says the first input's `aria-label` is ignored; with a native label or a field label present, no warning fires. [base-ui] (candidate)
- [ ] `pin-input.accessibility-tooling.5` Given the single-input design, then assistive technology sees one text input with `inputmode="numeric"` and `autocomplete="one-time-code"`, and the visible slots are decorative markup the consumer must label; because the real text is transparent, only the consumer's slot rendering conveys the value under zoom or high contrast. [corvu] (candidate)

### Notes and edge cases

- [ ] `pin-input.notes-and-edge-cases.1` Given the value helpers behind a pin input, then they are worth testing directly: whitespace stripping removes spaces, tabs and newlines and maps nullish input to the empty string; normalization filters by validation type, applies the custom normalizer after the built-in filter, refilters its output and clamps last (a negative length yields the empty string); replacement rewrites from an index and preserves suffix characters when normalization drops part of the replacement; character removal at an out-of-bounds index leaves the value unchanged. [base-ui] (candidate)
- [ ] `pin-input.notes-and-edge-cases.2` Given a part rendered with no root ancestor, then it throws a named context error rather than rendering a broken tree. [base-ui, corvu]
- [ ] `pin-input.notes-and-edge-cases.3` Given the conformance harness, then it needs per-slot locators by index, a real-clipboard paste helper, a key-at-a-time fill helper (not programmatic value assignment), per-slot focus and value assertions, an assertion over all slot values in order, attribute presence and absence assertions, and a count of slots with `tabindex="0"` to prove only one is tabbable. [zag] (candidate)
- [ ] `pin-input.notes-and-edge-cases.4` Given jsdom, then several single-input behaviors cannot be asserted: `ResizeObserver` is missing so the root throws without a polyfill, `offsetHeight` is 0 so the computed font size is `0px`, `selectionchange` never fires on its own so tests must dispatch it synthetically after moving the caret, the form-reset resync needs two animation frames, and neither `clip-path` nor `@supports` conditions are observable through computed style. [corvu] (candidate)
- [ ] `pin-input.notes-and-edge-cases.5` Given the shared injected stylesheet in the single-input design, then it is module-level mutable state with a refcount, so a test that unmounts without running framework cleanup leaves the `<style>` node in `document.head` and blocks later cleanup; its CSS text also carries stray trailing characters, so a rule-count assertion will not match the source. [corvu] (candidate)
- [ ] `pin-input.notes-and-edge-cases.6` Given a sanitizing regex built as `new RegExp('[^' + pattern.source + ']', 'g')`, then an anchored pattern such as `^\d*$` is spliced into a character class and the filter matches the literal characters `^`, `\d`, `*` and `$`, so its behavior is incidental rather than designed; a pattern of null disables sanitizing entirely and accepts every character. [corvu] (candidate)
- [ ] `pin-input.notes-and-edge-cases.7` Given a required-but-unset maximum length, then nothing supplies a fallback and the slice and insertion logic compare against `undefined`; a spec implementation MUST default or reject it instead. [corvu] (candidate)
- [ ] `pin-input.notes-and-edge-cases.8` Given ark's Solid suite, then the backspace, completion, OTP autocomplete and replace-last cases and the whole field block are commented out, so Solid only proves the aria labels and forward focus movement; Vue wraps every render in a next-tick helper because the machine's initial effects land after Vue's first flush. [ark] (candidate)
- [ ] `pin-input.notes-and-edge-cases.9` Given reka's suite, then the placeholder of the last slot after a reset cannot be asserted because jsdom does not update `document.activeElement` in time. [reka] (candidate)
- [ ] `pin-input.notes-and-edge-cases.10` Given a password manager that writes each slot directly and fires a plain `input` event with no `data`, then every slot takes its character and the completion callback still fires. [reka] (candidate)
- [ ] `pin-input.notes-and-edge-cases.11` Given the single-input design, then it reserves a right-hand gutter for password manager icons by default, widening the input to `calc(100% + 40px)` with a `clip-path` of `inset(0 40px 0 0)`; disabling that leaves the input at `100%` with no clip path. [corvu] (candidate)

## password-input

### Roles and attributes

- [ ] `password-input.roles-and-attributes.1` Given a password input, then the anatomy is root, label, control, input, indicator and visibility trigger. [zag] (candidate)
- [ ] `password-input.roles-and-attributes.2` Given a password input, then the input starts at `type="password"` and toggles to `type="text"` when visibility is on, exposing `data-state` of `hidden` or `visible`. [radix, zag]
- [ ] `password-input.roles-and-attributes.3` Given the visibility trigger, then it is `type="button"` with `aria-controls` pointing at the input id, `aria-expanded` reflecting visibility, `data-state`, `data-disabled`, `data-readonly` and a translated `aria-label` that changes with visibility. [zag] (candidate)
- [ ] `password-input.roles-and-attributes.4` Given a toggle rendered with visible and hidden text slots, then its accessible name and text content are the hidden-state label ("Show") while the password is masked and flip to the visible-state label ("Hide") once revealed. [radix] (candidate)
- [ ] `password-input.roles-and-attributes.5` Given an icon pair instead of text, then only the state-matching icon is in the document at a time, and the rendered icon carries `data-icon` naming the state plus `aria-hidden="true"`. [radix] (candidate)
- [ ] `password-input.roles-and-attributes.6` Given the indicator part, then it is `aria-hidden` and mirrors `data-state`, so it is decorative. [zag] (candidate)
- [ ] `password-input.roles-and-attributes.7` Given the root, label, control and indicator, then each carries `data-disabled`, `data-invalid` and `data-readonly`, and the label adds `data-required`. [zag] (candidate)
- [ ] `password-input.roles-and-attributes.8` Given the input, then it sets `autocapitalize` off and `spellcheck` false, and `autocomplete="current-password"`. [radix, zag]
- [ ] `password-input.roles-and-attributes.9` Given the input, then it carries password-manager opt-out attributes `data-1p-ignore`, `data-lpignore="true"`, `data-bwignore="true"`, `data-form-type="other"` and `data-protonpass-ignore="true"`, pinning the quirks of 1Password, LastPass, Bitwarden, Dashlane and Proton Pass. [zag] (candidate)

### Pointer

- [ ] `password-input.pointer.1` Given a masked password input, when the visibility trigger is clicked, then the input type becomes `text`; clicking again returns it to `password`. [radix, zag]
- [ ] `password-input.pointer.2` Given a typed value, when visibility is toggled, then the input still holds the same value. [radix] (candidate)

### Focus management

- [ ] `password-input.focus-management.1` Given a caret position or a selection range in the input, when visibility is toggled, then the caret and selection are restored exactly, and they survive a second toggle. [radix, zag]
- [ ] `password-input.focus-management.2` Given the toggle is clicked, then focus returns to the input rather than staying on the button. [radix] (candidate)
- [ ] `password-input.focus-management.3` Divergence: the visibility trigger is excluded from the tab order (`tabindex="-1"`), so Tab goes from the password field straight to the next control. [zag] (decision needed)
- [ ] `password-input.focus-management.4` Divergence: the visibility trigger is an ordinary focusable button in the tab order, reachable between the input and the next control. [radix] (decision needed)

### Forms

- [ ] `password-input.forms.1` Given a password input inside an invalid field, then the input has `aria-invalid="true"` and `data-invalid`, and the field's error message renders. [ark] (candidate)
- [ ] `password-input.forms.2` Given a revealed password inside a form, when the form is submitted, then visibility resets to hidden and the input type returns to `password`. [radix] (candidate)

### Accessibility tooling

- [ ] `password-input.accessibility-tooling.1` Given a password input with a label and a text or icon toggle, when axe runs, then there are no violations. [radix, zag]

### Notes and edge cases

- [ ] `password-input.notes-and-edge-cases.1` Given unconsumed props on the input or the toggle, then they land on the rendered element and the ref resolves to it; `asChild` onto an `<input>` or a `<button>` keeps the part's own attributes. [radix] (candidate)
- [ ] `password-input.notes-and-edge-cases.2` Given the conformance harness, then it needs the input and visibility-trigger locators, a click on the trigger, type-attribute assertions in both directions, and a caret assertion reading `selectionStart` and `selectionEnd` to prove the caret survives the type swap. [zag] (candidate)
- [ ] `password-input.notes-and-edge-cases.3` Given ark's password input, then Svelte is the only framework with a test and it covers only field invalid propagation, so ark is weak evidence for this component. [ark] (candidate)

## Sources

- `docs/research/reka-melt-bits.md`, section `pin-input` (reka `PinInput.test.ts`, melt `PinInput.spec.ts`, bits `pin-input.browser.test.ts`).
- `docs/research/zag-and-ark.md`, sections `pin-input`, `password-input`, `e2e/models/pin-input.model.ts` and `e2e/models/password-input.model.ts` (zag anatomy, connect and Playwright e2e; ark React, Solid, Vue and Svelte tests).
- `docs/research/kobalte-and-corvu.md`, section `otp-field` (corvu `packages/otp-field`, read from source rather than tests; kobalte ships no OTP field).
- `docs/research/radix-and-base-ui.md`, sections `one-time-password-field` (radix) and `password-toggle-field` (radix), plus base-ui's `otp-field` root, input, utils and type-only suites.
- No APG pattern, axe rule or HTML element corresponds to either component. The nearest normative material is the `group` role and the HTML `autocomplete="one-time-code"` token, neither of which is covered in the research files.

## Deferred

- One input per slot versus one input overlaid on drawn slots (`pin-input.roles-and-attributes.20` and `.21`). This is the architectural fork for the whole component. It decides whether the suite asserts per-slot focus and roving tabindex at all, or asserts a selection-to-active-slot mapping instead. Everything in Focus management depends on it.
- Delete and Backspace splicing (`pin-input.keyboard.28` and `.29`). Holes in the middle of a code are either possible or not, which changes what the value type can be (`string` versus a fixed-length array with gaps).
- Where End goes (`pin-input.keyboard.30` and `.31`). Last filled slot versus first empty slot. Small, but it changes the insertion-point definition used by click redirection too.
- Auto-submit on completion (`pin-input.forms.8` and `.9`). zag submits by default; base-ui requires opting in. Submitting a form as a side effect of a keystroke is the kind of default that needs a deliberate decision.
- `autocomplete` placement (`pin-input.roles-and-attributes.22` and `.23`). First slot only versus every slot. Browsers differ on which one actually triggers SMS autofill, so this needs testing on real devices, not in the suite.
- Visibility-trigger tab order (`password-input.focus-management.3` and `.4`). Excluding the toggle from the tab order makes it keyboard-unreachable, which is hard to defend; keeping it in the order adds a tab stop between a password field and the submit button. Neither side is obviously right.
- Corvu's injected global stylesheet, iOS letter-spacing workaround and password-manager gutter (`pin-input.notes-and-edge-cases.5`, `.6`, `.11`). Real problems with browser-specific fixes, but they are styling decisions the consumer should own, not conformance bullets.
- Fake caret rendering. bits exposes `hasFakeCaret` per cell and corvu exposes an inserting flag for the same purpose. Neither is tested as behavior, so the spec records the state flags and not their appearance.
- ariakit and headlessui contribute nothing here: neither ships a pin input or a password toggle.
