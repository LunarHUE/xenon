import { Field } from '@xenon-ui/solid'
import { Loading } from '@solidjs/web'
import { createMemo } from 'solid-js'

/**
 * Field association fixture containing an asynchronous child behind a Loading boundary.
 * Its message resolves after a 10 ms timer; buffered SSR must await the child content.
 */
export function StreamingField() {
  const message = createMemo(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
    return 'Asynchronous field content'
  })
  return (
    <Field>
      <div>
        <Field.Control aria-label="Streaming control" />
      </div>
      <div>
        <Field.Description id="streaming-help">Streaming help</Field.Description>
      </div>
      <Loading fallback={<span>Loading child</span>}>
        <p>{message()}</p>
      </Loading>
    </Field>
  )
}
