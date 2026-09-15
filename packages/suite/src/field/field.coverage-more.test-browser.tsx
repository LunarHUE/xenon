import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mountInto(parent: Element | ShadowRoot, children: () => JSX.Element) {
  const host = document.createElement('div')
  parent.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(host)
}

test('field.pointer.3: an individually disabled control label keeps focus on the body', async () => {
  const query = mountInto(document.body, () => (
    <Field>
      <Field.Label>Disabled control</Field.Label>
      <Field.Control aria-label="Disabled control" disabled />
    </Field>
  ))
  await userEvent.click(query.getByText('Disabled control'), { force: true })
  expect(document.activeElement).toBe(document.body)
})

test('field.roles.13: shadow-root descriptions and errors resolve locally', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const shadow = host.attachShadow({ mode: 'open' })
  const query = mountInto(shadow, () => (
    <Field id="shadow-field" invalid>
      <Field.Description>Help text</Field.Description>
      <Field.Error>Required</Field.Error>
      <Field.Control aria-label="Value" />
    </Field>
  ))
  await new Promise((resolve) => setTimeout(resolve, 30))
  const control = query.getByRole('textbox', { name: 'Value' })
  expect(control).toHaveAttribute('aria-describedby', 'shadow-field-description shadow-field-error')
  expect(shadow.querySelector('#shadow-field-description')).toBeTruthy()
  expect(shadow.querySelector('#shadow-field-error')).toBeTruthy()
  host.remove()
})
