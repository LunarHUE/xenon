import { createSignal } from 'solid-js'
import { Field } from '@xenon/solid'

export function FieldLabelToggle() {
  const [shown, setShown] = createSignal(true)
  return (
    <section aria-label="Field label toggle">
      <Field>
        {shown() && <Field.Label>Removable label</Field.Label>}
        <Field.Control
          as="div"
          role="textbox"
          tabindex={0}
          id="field-label-toggle-control"
          aria-label={shown() ? undefined : 'Fallback control'}
        />
      </Field>
      <button type="button" onClick={() => setShown(false)}>
        Remove label
      </button>
    </section>
  )
}
