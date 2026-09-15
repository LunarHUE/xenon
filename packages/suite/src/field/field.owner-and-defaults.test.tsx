import { Field } from '@xenon/solid'
import { fireEvent, screen } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { mount } from '../harness/solid'

describe('field control ownership and defaults', () => {
  test('changing the external form owner moves submission and reset ownership', async () => {
    const [owner, setOwner] = createSignal('first')
    const m = mount('field', {
      name: 'email',
      children: () => (
        <>
          <form id="first" />
          <form id="second" />
          <Field.Control id="email" form={owner()} defaultValue="first value" aria-label="Email" />
        </>
      ),
    })
    await m.settle()
    const control = screen.getByRole('textbox') as HTMLInputElement
    expect(control.form?.id).toBe('first')
    expect(control).toHaveAttribute('name', 'email')
    fireEvent.input(control, { target: { value: 'edited' } })
    setOwner('second')
    await m.settle()
    expect(screen.getByRole('textbox')).toBe(control)
    const first = m.container.querySelector<HTMLFormElement>('#first')!
    const second = m.container.querySelector<HTMLFormElement>('#second')!
    expect(control.form).toBe(second)
    expect(new FormData(first).has('email')).toBe(false)
    expect(new FormData(second).get('email')).toBe('edited')
    first.reset()
    expect(control.value).toBe('edited')
    second.reset()
    await new Promise((resolve) => setTimeout(resolve))
    expect(control.value).toBe('first value')
  })

  test('updates inherited required and name while preserving the control element', async () => {
    const m = mount('field', {
      name: 'before',
      children: () => <Field.Control aria-label="Account" />,
    })
    await m.settle()
    const control = screen.getByRole('textbox') as HTMLInputElement
    expect(control).not.toBeRequired()
    expect(control).toHaveAttribute('name', 'before')
    m.setProps({ name: 'after', required: true })
    await m.settle()
    expect(screen.getByRole('textbox')).toBe(control)
    expect(control).toBeRequired()
    expect(control).toHaveAttribute('name', 'after')
  })
})
