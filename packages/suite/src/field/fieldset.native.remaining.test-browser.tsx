import { Field } from '@xenon-ui/solid/field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

/**
 * A literal fieldset owns native disabled inheritance. Independent Field controls
 * do not receive a disabled Field owner. Field as=fieldset also propagates Field
 * metadata to descendants; its first-legend behavior is outside these cases.
 */
function Controls(props: { prefix: string }) {
  return (
    <Field as="span">
      <Field.Control
        id={`${props.prefix}-input`}
        name={`${props.prefix}-input`}
        aria-label={`${props.prefix} input`}
        value="Input value"
      />
      <Field.Control
        as="textarea"
        id={`${props.prefix}-textarea`}
        name={`${props.prefix}-textarea`}
        aria-label={`${props.prefix} textarea`}
        value="Textarea value"
      />
      <Field.Control
        as="select"
        id={`${props.prefix}-select`}
        name={`${props.prefix}-select`}
        aria-label={`${props.prefix} select`}
        value="selected"
      >
        <option value="selected">Selected</option>
      </Field.Control>
      <Field.Control as="button" id={`${props.prefix}-button`} type="button">
        {props.prefix} button
      </Field.Control>
    </Field>
  )
}
const kinds = ['input', 'textarea', 'select', 'button'] as const
function assertDisabled(container: HTMLElement, prefix: string, disabled: boolean) {
  for (const kind of kinds) {
    const control = container.querySelector<HTMLElement>(`#${prefix}-${kind}`)!
    expect(control, `${prefix} ${kind} exists`).not.toBeNull()
    // The own attribute stays absent: effective disabled state comes from the
    // ancestor fieldset and its first-legend exception, rather than Field props.
    expect(control).not.toHaveAttribute('disabled')
    expect(control.matches(':disabled'), `${prefix} ${kind} native disabled state`).toBe(disabled)
    if (disabled) expect(control).toBeDisabled()
    else expect(control).toBeEnabled()
  }
}
function dataNames(form: HTMLFormElement) {
  return [...new FormData(form).keys()].sort()
}
function names(...prefixes: string[]) {
  return prefixes
    .flatMap((prefix) => ['input', 'select', 'textarea'].map((kind) => `${prefix}-${kind}`))
    .sort()
}

test('disabled native fieldset enables only its first legend across Field control types fieldset.forms.1', async () => {
  const m = mount(() => (
    <form data-testid="form">
      <fieldset disabled>
        <legend>
          First legend <Controls prefix="first" />
        </legend>
        <legend>
          Second legend <Controls prefix="second" />
        </legend>
        <Controls prefix="body" />
        <fieldset>
          <legend>Nested enabled fieldset</legend>
          <Controls prefix="nested" />
        </fieldset>
      </fieldset>
    </form>
  ))
  assertDisabled(m.container, 'first', false)
  for (const prefix of ['second', 'body', 'nested']) assertDisabled(m.container, prefix, true)
  const first = m.getByRole('textbox', { name: 'first input' })
  await userEvent.click(first)
  expect(first).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(m.getByRole('textbox', { name: 'first textarea' })).toHaveFocus()
  expect(dataNames(m.getByTestId('form') as HTMLFormElement)).toEqual(names('first'))
})
