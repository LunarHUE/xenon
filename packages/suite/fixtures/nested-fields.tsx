import { Checkbox, Field, Switch } from '@xenon-ui/solid'
import { Show, omit } from 'solid-js'
import type { ComponentProps } from '@solidjs/web'

/**
 * Custom input host that forwards remaining props and appends its own help ID.
 * The data marker records whether the incoming description was truthy before appending.
 */
function CustomInput(props: ComponentProps<'input'>) {
  const rest = omit(props, 'aria-describedby')
  return (
    <input
      {...rest}
      data-has-description={props['aria-describedby'] ? 'yes' : 'no'}
      aria-describedby={[props['aria-describedby'], 'custom-help'].filter(Boolean).join(' ')}
    />
  )
}

/** Exercises nested field ownership, wrapped controls, custom hosts, and escaped association IDs across SSR and hydration. */
export function NestedFields() {
  let constructions = 0
  /** Counts constructions of the wrapped control to expose duplicate construction during rendering. */
  function CountedControl() {
    constructions++
    return <Field.Control id="wrapped-control" aria-describedby="author-help" />
  }

  return (
    <section aria-label="Nested field associations">
      <p id="author-help">Author help</p>
      <Field invalid>
        <div>
          <Field.Label>Wrapped control</Field.Label>
          <section>
            <CountedControl />
          </section>
        </div>
        <div>
          <Field.Description id={'help"&<one>'}>First help</Field.Description>
          <Field.Description id="second-help">Second help</Field.Description>
          <Field.Error id={'error"&<two>'}>Required value</Field.Error>
        </div>
        <Field>
          <div>
            <Field.Control id="inner-control" />
          </div>
          <div>
            <Field.Label>Inner control</Field.Label>
            <Field.Description id="inner-help">Inner help</Field.Description>
          </div>
        </Field>
      </Field>
      <span data-testid="control-constructions">{constructions}</span>
      <Field>
        <div>
          <Field.Control id="unannotated-control" aria-label="No description" />
        </div>
        <Show when={false}>
          <Field.Description>Absent help</Field.Description>
        </Show>
        <Field.Error>Inactive error</Field.Error>
      </Field>
      <Field>
        <div>
          <Field.Control as="div" role="textbox" id="generic-control" />
        </div>
        <div>
          <Field.Label>Generic wrapped control</Field.Label>
          <Field.Description id="generic-help">Generic help</Field.Description>
        </div>
      </Field>
      <Field>
        <div>
          <Checkbox id="wrapped-checkbox" />
        </div>
        <div>
          <Field.Label>Wrapped checkbox</Field.Label>
          <Field.Description id="checkbox-help">Checkbox help</Field.Description>
        </div>
      </Field>
      <Field>
        <div>
          <Switch id="wrapped-switch" />
        </div>
        <div>
          <Field.Label>Wrapped switch</Field.Label>
          <Field.Description id="switch-help">Switch help</Field.Description>
        </div>
      </Field>
      <p id="custom-help">Custom host help</p>
      <Field>
        <Field.Control as={CustomInput} aria-label="Custom absent description" />
      </Field>
      <Field>
        <Field.Description id="custom-field-help">Field help</Field.Description>
        <Field.Control
          as={CustomInput}
          aria-label="Custom merged description"
          aria-describedby="author-help"
        />
      </Field>
      <pre>{'aria-describedby="xenon-field-authored" & <unchanged>'}</pre>
    </section>
  )
}
