import { Checkbox, Field, Toggle } from '@kit/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

export function FieldDemo(): JSX.Element {
  const [address, setAddress] = createSignal('')
  const [locked, setLocked] = createSignal(false)

  const invalid = () => address().length > 0 && !address().includes('@')

  return (
    <Section
      index="12"
      title="Field"
      blurb="The wiring nobody wants to write twice: one id base, a label that points at the
        control, and a description list the control actually references."
    >
      <Bench caption="Label, description, error" note="aria-describedby">
        <Field class="fieldset" id="email" invalid={invalid()} required>
          <Field.Label class="fieldset__label">Work address</Field.Label>
          <Field.Description class="fieldset__hint">We only use it for receipts.</Field.Description>
          <Field.Control
            class="input"
            type="email"
            placeholder="you@example.com"
            value={address()}
            onInput={(event) => setAddress(event.currentTarget.value)}
          />
          <Field.Error class="fieldset__error">
            <span aria-hidden="true">✗ </span>That address is missing its @.
          </Field.Error>
        </Field>
        <p class="prose">
          Type something without an <code>@</code>. The error element is not hidden while valid, it
          is not rendered, and its id joins <code>aria-describedby</code> only while the field is
          invalid. The description keeps its place at the front of that list, so the hint is read
          first and the complaint second. Nothing rides in <code>aria-errormessage</code>, which
          VoiceOver and NVDA still do not support.
        </p>
        <Readout
          rows={[
            ['aria-describedby', invalid() ? 'email-description email-error' : 'email-description'],
            ['aria-invalid', invalid() ? 'true' : 'absent'],
          ]}
        />
      </Bench>

      <Bench caption="A checkbox as the control" note="disabled · required">
        <div class="stack">
          <Toggle class="toggle" pressed={locked()} onPressedChange={(next) => setLocked(next)}>
            {locked() ? 'unlock the field' : 'lock the field'}
          </Toggle>
          <Field class="fieldset" id="terms" name="terms" disabled={locked()} required>
            <Field.Label class="fieldset__label fieldset__label--inline">
              <Checkbox class="check" value="accepted" />
              <span>Accept the terms</span>
            </Field.Label>
            <Field.Description class="fieldset__hint">
              The checkbox takes the field's id and name; it never declares either itself.
            </Field.Description>
          </Field>
        </div>
        <p class="prose">
          A field-aware control merges the field's flags with its own. Most props go to the control,
          but <code>disabled</code>, <code>required</code>, <code>readonly</code> and{' '}
          <code>invalid</code> are OR-ed, so locking the field really does disable the box and no
          prop on the box can climb back out. Outside a field the same checkbox behaves exactly as
          it did in section 02.
        </p>
        <Readout
          rows={[
            ['field', locked() ? 'disabled' : 'enabled'],
            ['checkbox disabled', String(locked())],
          ]}
        />
      </Bench>
    </Section>
  )
}
