/**
 * Native browser behavior of the shipped Field flags: the browser's own
 * constraint validation, native editing rules and form ownership that
 * `Field.Control`'s attributes feed. Flag mirroring, id/association registry
 * updates and reactive re-rendering stay in the shared DOM conformance suites;
 * every case here needs a real engine (native validity, key input, focus).
 *
 * @packageDocumentation
 */
import { Field } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

/**
 * Registers a canceling submit spy on a form fixture.
 * Without the cancellation an accepted submit would navigate the test page.
 * @returns The spy, whose call count is the observable submission outcome.
 */
function submitSpy(form: HTMLFormElement) {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  form.addEventListener('submit', submit)
  return submit
}

describe('field native validity, editing and form ownership', () => {
  test('a required field blocks native submission with valueMissing and focuses the invalid control', async () => {
    const m = mount('field', {
      name: 'account',
      required: true,
      children: () => (
        <form>
          <Field.Control aria-label="Account" />
          <button type="submit">Save</button>
        </form>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const form = m.container.querySelector('form')!
    const control = scope.getByRole('textbox') as HTMLInputElement
    const submit = submitSpy(form)

    expect(control).toHaveAttribute('required', '')
    expect(control.validity.valueMissing).toBe(true)
    expect(control.matches(':invalid')).toBe(true)
    expect(form.checkValidity()).toBe(false)

    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).not.toHaveBeenCalled()
    expect(control).toHaveFocus()
    // The browser owns this rejection; the field publishes no validity state of its own.
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(control).not.toHaveAttribute('data-invalid')

    await userEvent.fill(control, 'person@example.com')
    expect(control.matches(':invalid')).toBe(false)
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(new FormData(form).get('account')).toBe('person@example.com')
  })

  test('an invalid field is ARIA-only and never clears an authored custom validity message', async () => {
    const m = mount('field', {
      invalid: true,
      name: 'account',
      children: () => (
        <form>
          <Field.Control aria-label="Account" />
          <button type="submit">Save</button>
        </form>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const form = m.container.querySelector('form')!
    const control = scope.getByRole('textbox') as HTMLInputElement
    const submit = submitSpy(form)

    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control.validity.valid).toBe(true)
    expect(form.checkValidity()).toBe(true)
    await userEvent.type(control, 'person@example.com')
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)

    control.setCustomValidity('Server rejected this account')
    expect(control.validity.customError).toBe(true)
    expect(form.checkValidity()).toBe(false)

    m.setProps({ invalid: false })
    await m.settle()
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(control.validationMessage).toBe('Server rejected this account')
    expect(form.checkValidity()).toBe(false)
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)

    control.setCustomValidity('')
    expect(form.checkValidity()).toBe(true)
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(2)
  })

  test('a readonly field refuses native key input yet still submits its value', async () => {
    const m = mount('field', {
      name: 'account',
      readonly: true,
      children: () => (
        <form>
          <Field.Control aria-label="Account" defaultValue="initial" />
          <button type="submit">Save</button>
        </form>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const form = m.container.querySelector('form')!
    const control = scope.getByRole('textbox') as HTMLInputElement
    const submit = submitSpy(form)

    expect(control.readOnly).toBe(true)
    control.focus()
    await userEvent.keyboard('typed')
    expect(control).toHaveValue('initial')
    expect(new FormData(form).get('account')).toBe('initial')

    m.setProps({ readonly: false })
    await m.settle()
    expect(control.readOnly).toBe(false)
    await userEvent.fill(control, 'edited')
    expect(control).toHaveValue('edited')
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)
    expect(new FormData(form).get('account')).toBe('edited')
  })

  test('a non-native required host publishes aria-required only, so the form keeps native submission', async () => {
    const m = mount('field', {
      required: true,
      children: () => (
        <form>
          <Field.Control as="div" role="textbox" tabindex={0} aria-label="Account" />
          <button type="submit">Save</button>
        </form>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const form = m.container.querySelector('form')!
    const control = scope.getByRole('textbox')
    const submit = submitSpy(form)

    expect(control).toHaveAttribute('aria-required', 'true')
    expect(control).not.toHaveAttribute('required')
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(form.checkValidity()).toBe(true)
    await userEvent.click(scope.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledTimes(1)
  })

  test('an authored form owner validates and collects the control instead of the ancestor form', async () => {
    const m = mount('field', {
      name: 'account',
      required: true,
      children: () => (
        <>
          <form id="field-external-owner">
            <button type="submit">External</button>
          </form>
          <form id="field-ancestor">
            <Field.Control form="field-external-owner" aria-label="Account" />
            <button type="submit">Ancestor</button>
          </form>
        </>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const external = m.container.querySelector('#field-external-owner') as HTMLFormElement
    const ancestor = m.container.querySelector('#field-ancestor') as HTMLFormElement
    const control = scope.getByRole('textbox') as HTMLInputElement
    const externalSubmit = submitSpy(external)
    const ancestorSubmit = submitSpy(ancestor)

    expect(control.form).toBe(external)
    expect(external.checkValidity()).toBe(false)
    expect(ancestor.checkValidity()).toBe(true)
    expect(new FormData(ancestor).has('account')).toBe(false)

    await userEvent.type(control, 'person@example.com')
    expect(external.checkValidity()).toBe(true)
    expect(new FormData(external).get('account')).toBe('person@example.com')

    await userEvent.click(scope.getByRole('button', { name: 'External' }))
    expect(externalSubmit).toHaveBeenCalledTimes(1)
    expect(ancestorSubmit).not.toHaveBeenCalled()

    await userEvent.click(scope.getByRole('button', { name: 'Ancestor' }))
    expect(ancestorSubmit).toHaveBeenCalledTimes(1)
    expect(new FormData(ancestor).has('account')).toBe(false)
  })
})
