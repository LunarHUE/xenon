import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { describe, expect, onTestFinished } from 'vitest'

import { spec } from '../spec'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, view: within(container) }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

describe('field additional coverage', () => {
  spec('field.roles.5', async () => {
    const [labelable, setLabelable] = createSignal(false)
    const mounted = mount(() => (
      <Field id="choice">
        <Field.Label>Choice</Field.Label>
        {labelable() ? (
          <Field.Control as="button" aria-label="Choice control" />
        ) : (
          <Field.Control as="div" tabindex={0} />
        )}
      </Field>
    ))
    const label = mounted.view.getByText('Choice') as HTMLLabelElement
    const generic = mounted.container.querySelector('[role="group"] > div[tabindex]')
    expect(generic).toHaveAttribute('aria-labelledby', 'choice-label')
    expect(label).toHaveAttribute('for', 'choice-control')

    setLabelable(true)
    await settle()
    const button = mounted.view.getByRole('button', { name: 'Choice control' })
    expect(button).toHaveAttribute('id', 'choice-control')
    expect(label).toHaveAttribute('for', 'choice-control')
    expect(button).not.toHaveAttribute('aria-labelledby')
  })

  spec('field.roles.6', async () => {
    const [showFirst, setShowFirst] = createSignal(true)
    const mounted = mount(() => (
      <Field id="choice">
        <Field.Label>Choice</Field.Label>
        {showFirst() ? <Field.Control as="input" aria-label="First" /> : null}
        <Field.Control as="input" aria-label="Second" />
      </Field>
    ))
    const label = mounted.view.getByText('Choice') as HTMLLabelElement
    const second = mounted.view.getByRole('textbox', { name: 'Second' })
    expect(label).toHaveAttribute('for', second.id)
    setShowFirst(false)
    await settle()
    expect(label).toHaveAttribute('for', second.id)
    expect(mounted.view.queryByRole('textbox', { name: 'First' })).toBeNull()
  })

  spec('field.state.7', () => {
    let control!: HTMLInputElement
    const mounted = mount(() => (
      <Field>
        <Field.Control
          defaultValue="default"
          ref={(element) => (control = element as HTMLInputElement)}
        />
      </Field>
    ))
    control.value = 'edited'
    control.focus()
    fireEvent.focus(control)
    flush()
    expect(control).toHaveFocus()
    expect(control.value).toBe('edited')
    expect(mounted.container.querySelector('input')).toBe(control)
  })
})
