import { Checkbox, Field } from '@tenon/solid'
import { screen } from '@testing-library/dom'
import { Show, createSignal } from 'solid-js'
import { describe, expect, vi } from 'vitest'
import { expectNoViolations } from '../a11y'

import { mount } from '../harness/solid'
import { spec } from '../spec'
import { fieldContract, descriptionLifecycle } from './contract'

describe('field conformance', () => {
  spec('field.roles.5', async () => {
    const [id, setId] = createSignal<string | undefined>('author-control')
    const m = mount('field', {
      children: () => (
        <>
          <Field.Label>Email</Field.Label>
          <Field.Control id={id()} />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'author-control')
    expect(m.container.querySelector('label')).toHaveAttribute('for', 'author-control')
    setId('replacement')
    await m.settle()
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'replacement')
    setId(undefined)
    await m.settle()
    expect(screen.getByLabelText('Email').id).toMatch(/-control$/)
  })
  spec('label.roles.6', async () => {
    const m = mount('field', { children: () => <Field.Control as="div" role="textbox" /> })
    await m.settle()
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-labelledby')
  })
  spec('field.roles.1', () => {
    const m = mount('field', {})
    expect(screen.getByRole('group')).not.toHaveAttribute('data-disabled')
    m.setProps({ disabled: true, invalid: true, readonly: true })
    for (const flag of ['disabled', 'invalid', 'readonly'])
      expect(screen.getByRole('group')).toHaveAttribute(`data-${flag}`, '')
    m.setProps({ as: 'fieldset' })
    expect(m.container.querySelector('fieldset')).toBeDisabled()
    expect(m.container.querySelector('fieldset')).not.toHaveAttribute('role')
  })

  spec('field.roles.4', () => fieldContract('input'))
  spec('field.forms.5', () => fieldContract('textarea'))
  spec('description.roles.6', () => descriptionLifecycle('input'))

  spec('description.roles.1', async () => {
    const m = mount('field', {
      children: () => (
        <>
          <Field.Description id="first">First</Field.Description>
          <Field.Description id="second">Second</Field.Description>
          <Field.Control aria-label="Account" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'first second')
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('First Second')
  })

  spec('description.roles.2', async () => {
    const m = mount('field', {
      invalid: true,
      children: () => (
        <>
          <Field.Description id="help">Helpful text</Field.Description>
          <Field.Error id="error">Fix this</Field.Error>
          <Field.Control aria-label="Account" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help error')
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Helpful text Fix this')
  })

  spec('description.roles.3', async () => {
    const m = mount('field', {
      invalid: true,
      children: () => (
        <>
          <Field.Description id="help">Helpful text</Field.Description>
          <Field.Control aria-label="Account" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'help')
    m.unmount()
    const valid = mount('field', {
      children: () => (
        <>
          <Field.Error>Fix this</Field.Error>
          <Field.Control />
        </>
      ),
    })
    await valid.settle()
    expect(screen.queryByText('Fix this')).toBeNull()
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
  })

  spec('description.roles.4', async () => {
    const m = mount('field', { children: () => <Field.Control /> })
    await m.settle()
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
  })

  spec('field.forms.26', async () => {
    const m = mount('field', {
      invalid: true,
      children: () => (
        <>
          <Field.Description id="">Help</Field.Description>
          <Field.Error id="">Error</Field.Error>
          <Field.Control aria-describedby="author" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'author')
  })

  spec('field.roles.6', async () => {
    const [second, setSecond] = createSignal(true)
    const m = mount('field', {
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Field.Control id="first" />
          <Show when={second()}>
            <Field.Control id="second" />
          </Show>
        </>
      ),
    })
    await m.settle()
    expect(screen.getByLabelText('Account')).toHaveAttribute('id', 'second')
    setSecond(false)
    await m.settle()
    expect(screen.getByLabelText('Account')).toHaveAttribute('id', 'first')
  })

  spec('label.roles.1', async () => {
    const [visible, setVisible] = createSignal(true)
    const [id, setId] = createSignal<string | undefined>('first')
    const m = mount('field', {
      children: () => (
        <>
          <Show when={visible()}>
            <Field.Label id={id()}>First</Field.Label>
          </Show>
          <Field.Label id="second">Second</Field.Label>
          <Field.Control as="div" role="textbox" aria-labelledby="author" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'author first second')
    setId('renamed')
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'author renamed second')
    setId(undefined)
    await m.settle()
    const generatedLabelId = screen.getByText('First').id
    expect(generatedLabelId).toMatch(/-label$/)
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-labelledby',
      `author ${generatedLabelId} second`
    )
    setVisible(false)
    await m.settle()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-labelledby', 'author second')
  })

  spec('field.focus.1', async () => {
    const root = vi.fn(),
      label = vi.fn(),
      control = vi.fn(),
      description = vi.fn()
    const m = mount('field', {
      ref: root,
      children: () => (
        <>
          <Field.Label ref={label}>Account</Field.Label>
          <Field.Control ref={control} />
          <Field.Description ref={description}>Help</Field.Description>
        </>
      ),
    })
    await m.settle()
    m.setProps({ 'data-custom': 'next', invalid: true })
    await m.settle()
    for (const ref of [root, label, control, description]) expect(ref).toHaveBeenCalledTimes(1)
  })

  spec('field.focus.4', async () => {
    const [descriptionId, setDescriptionId] = createSignal('original-help')
    const m = mount('field', {
      children: () => (
        <>
          <Field.Control aria-label="Account" />
          <Field.Description id={descriptionId()}>Help</Field.Description>
          <Field.Error>Error</Field.Error>
        </>
      ),
    })
    const control = screen.getByRole('textbox') as HTMLInputElement
    control.focus()
    control.value = 'typed'
    m.setProps({ invalid: true })
    await m.settle()
    expect(screen.getByRole('textbox')).toBe(control)
    expect(control).toHaveFocus()
    expect(control).toHaveValue('typed')
    expect(screen.getByText('Error')).toBeVisible()
    setDescriptionId('renamed-help')
    m.setProps({ readonly: true, required: true })
    await m.settle()
    expect(screen.getByRole('textbox')).toBe(control)
    expect(control).toHaveFocus()
    expect(control).toHaveValue('typed')
    expect(control.getAttribute('aria-describedby')?.split(' ')).toContain('renamed-help')
    expect(control.getAttribute('aria-describedby')?.split(' ')).not.toContain('original-help')
  })

  spec('field.forms.28', () => fieldContract('input'))
  spec('field.forms.30', () => fieldContract('textarea'))

  spec('field.a11y.1', async () => {
    const m = mount('field', {
      required: true,
      invalid: true,
      children: () => (
        <>
          <Field.Label>
            Account <span aria-hidden="true">*</span>
          </Field.Label>
          <Field.Control />
          <Field.Description>Use a work account</Field.Description>
          <Field.Error>Required</Field.Error>
        </>
      ),
    })
    await m.settle()
    await expectNoViolations(m.container)
  })

  spec('field.notes.3', async () => {
    const m = mount('field', {
      invalid: true,
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Field.Control />
          <Field.Description>Help</Field.Description>
          <Field.Error>Error</Field.Error>
        </>
      ),
    })
    await m.settle()
    const control = screen.getByLabelText('Account')
    const base = control.id.replace(/-control$/, '')
    expect(base).not.toBe('')
    expect(screen.getByText('Account')).toHaveAttribute('id', `${base}-label`)
    expect(screen.getByText('Help')).toHaveAttribute('id', `${base}-description`)
    expect(screen.getByText('Error')).toHaveAttribute('id', `${base}-error`)
    expect(control).toHaveAttribute('aria-describedby', `${base}-description ${base}-error`)
  })

  spec('field.notes.6', async () => {
    const m = mount('field', {
      children: () => (
        <Field.Label>
          <Checkbox />
          Accept
        </Field.Label>
      ),
    })
    await m.settle()
    const checkbox = screen.getByRole('checkbox', { name: 'Accept' })
    m.setProps({ invalid: true })
    await m.settle()
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBe(checkbox)
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
  })
})
