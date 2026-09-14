import { Button, Checkbox, Switch } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

export function FormDemo(): JSX.Element {
  const [entries, setEntries] = createSignal<[string, string][]>([])

  const submit = (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setEntries([...data.entries()].map(([key, value]) => [key, String(value)]))
  }

  return (
    <Section
      index="05"
      title="Forms"
      blurb="Nothing here is re-implemented. The native control submits, resets and validates; the
        non-native one borrows a hidden input to do the same."
    >
      <Bench caption="Submit and reset" note="name · value · form">
        <form class="form" onSubmit={submit} onReset={() => setEntries([])}>
          <label class="field">
            <Checkbox class="check" name="terms" value="accepted" required />
            <span>
              Accept the terms <em>(required)</em>
            </span>
          </label>
          <label class="field">
            <Checkbox class="check" name="newsletter" value="weekly" defaultChecked />
            <span>Weekly digest</span>
          </label>
          <div class="field">
            <Checkbox class="check" as="button" name="beta" value="yes" />
            <span>Join the beta, from a button host</span>
          </div>
          <label class="field field--wide">
            <span>Ship it on Fridays</span>
            <Switch class="track" name="fridays" value="yes" />
          </label>
          <div class="row row--end">
            <Button class="btn" type="reset">
              reset
            </Button>
            <Button class="btn btn--accent" type="submit">
              submit
            </Button>
          </div>
        </form>
        <p class="prose">
          Submit with an empty terms box and the browser's own validation stops you, because the
          control really is <code>input[type=checkbox]</code>. Unchecked boxes send nothing, exactly
          as HTML does. Reset puts every control back to the value it was born with, hidden inputs
          included.
        </p>
        <Readout rows={entries().length === 0 ? [['FormData', 'empty']] : entries()} />
      </Bench>
    </Section>
  )
}
