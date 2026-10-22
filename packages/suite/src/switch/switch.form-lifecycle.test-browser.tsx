import { Switch } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

for (const as of ['input', 'button', 'div'] as const) {
  test(`switch.forms.1: ${as} required owner blocks submission until checked and disabled projection preserves checkedness`, async () => {
    const [disabled, setDisabled] = createSignal(false)
    const change = vi.fn()
    const submissions: FormDataEntryValue[][] = []
    const view = mount(() => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submissions.push(new FormData(event.currentTarget).getAll('lights'))
        }}
      >
        <Switch
          as={as}
          style={{ display: 'inline-block', width: '24px', height: '24px' }}
          name="lights"
          value="on"
          required
          disabled={disabled()}
          aria-label="Lights"
          onCheckedChange={change}
        />
        <button type="submit">Save</button>
      </form>
    ))
    const control = view.getByRole('switch')
    const form = view.container.querySelector('form')!
    const native = view.container.querySelector('input')!
    expect(native.form).toBe(form)
    expect(native.required).toBe(true)
    expect(form.checkValidity()).toBe(false)
    await userEvent.click(view.getByRole('button', { name: 'Save' }))
    expect(submissions).toEqual([])
    await userEvent.click(control)
    await settle()
    expect(native.checked).toBe(true)
    expect(form.checkValidity()).toBe(true)
    await userEvent.click(view.getByRole('button', { name: 'Save' }))
    expect(submissions).toEqual([['on']])
    setDisabled(true)
    await settle()
    expect(native.disabled).toBe(true)
    expect(native.checked).toBe(true)
    await userEvent.click(view.getByRole('button', { name: 'Save' }))
    expect(submissions).toEqual([['on'], []])
    setDisabled(false)
    await settle()
    expect(native.checked).toBe(true)
    expect(new FormData(form).get('lights')).toBe('on')
    expect(change.mock.calls).toEqual([[true]])
  })

  test(`switch.forms.1: ${as} canceled reset preserves state and stopped reset restores defaults silently`, async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form>
        <Switch
          as={as}
          style={{ display: 'inline-block', width: '24px', height: '24px' }}
          name="lights"
          defaultChecked
          aria-label="Lights"
          onCheckedChange={change}
        />
        <button type="reset">Reset</button>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const native = view.container.querySelector('input')!
    await userEvent.click(view.getByRole('switch'))
    await settle()
    expect(native.checked).toBe(false)
    const cancel = (event: Event) => event.preventDefault()
    form.addEventListener('reset', cancel)
    await userEvent.click(view.getByRole('button', { name: 'Reset' }))
    await settle()
    expect(native.checked).toBe(false)
    form.removeEventListener('reset', cancel)
    form.addEventListener('reset', (event) => event.stopPropagation())
    await userEvent.click(view.getByRole('button', { name: 'Reset' }))
    await settle()
    expect(native.checked).toBe(true)
    expect(new FormData(form).get('lights')).toBe('on')
    expect(change.mock.calls).toEqual([[false]])
  })
}

for (const as of ['input', 'button', 'div'] as const) {
  test(`switch ${as} readonly transitions retain selected submission and reject activation until unlocked`, async () => {
    const [readonly, setReadonly] = createSignal(false)
    const change = vi.fn()
    const view = mount(() => (
      <form>
        <Switch
          as={as}
          style={{ display: 'inline-block', width: '24px', height: '24px' }}
          readonly={readonly()}
          defaultChecked
          name="lights"
          aria-label="Lights"
          onCheckedChange={change}
        />
      </form>
    ))
    const control = view.getByRole('switch')
    const native = view.container.querySelector('input')!
    const form = view.container.querySelector('form')!
    setReadonly(true)
    await settle()
    expect(view.getByRole('switch')).toBe(control)
    expect(control).toHaveAttribute('data-readonly', '')
    await userEvent.click(control)
    await settle()
    expect(native.checked).toBe(true)
    expect(new FormData(form).get('lights')).toBe('on')
    expect(change).not.toHaveBeenCalled()
    setReadonly(false)
    await settle()
    expect(control).not.toHaveAttribute('data-readonly')
    await userEvent.click(control)
    await settle()
    expect(native.checked).toBe(false)
    expect(new FormData(form).has('lights')).toBe(false)
    expect(change.mock.calls).toEqual([[false]])
  })
}
