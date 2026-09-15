import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import { PinInput } from '@xenon/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mountPin({
  name,
  defaultValue,
  length = 4,
  required,
  disabled,
  readonly,
  invalid,
  onValueChange,
  onValueComplete,
}: {
  name?: string
  defaultValue?: string
  length?: number
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  onValueChange?: (value: string) => void
  onValueComplete?: (value: string) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        name={name}
        defaultValue={defaultValue}
        length={length}
        required={required}
        disabled={disabled}
        readonly={readonly}
        invalid={invalid}
        onValueChange={onValueChange}
        onValueComplete={onValueComplete}
      >
        <For each={Array.from({ length }, (_value, index) => index)}>
          {(index) => <PinInput.Input index={index} />}
        </For>
      </PinInput>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return {
    container,
    slots: Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]')),
  }
}

function mountField(props: {
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Field {...props}>
        <Field.Label>Verification</Field.Label>
        <Field.Description>Enter the four digit code</Field.Description>
        <Field.Error>Code is invalid</Field.Error>
        <PinInput length={4}>
          <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
        </PinInput>
      </Field>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return {
    container,
    slots: Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]')),
  }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('pin-input.forms.1 named and unnamed hidden proxies exist, carry values, and stay hidden', () => {
  const named = mountPin({ name: 'otp', defaultValue: '1234' })
  const namedProxy = named.container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!
  expect(namedProxy).toHaveAttribute('name', 'otp')
  expect(namedProxy).toHaveValue('1234')
  expect(namedProxy).toHaveAttribute('aria-hidden', 'true')
  expect(namedProxy).toHaveAttribute('tabindex', '-1')
  expect(namedProxy).toHaveStyle({
    position: 'absolute',
    width: '1px',
    height: '1px',
  })
  expect(namedProxy.style.clipPath).toBe('inset(50%)')

  const unnamed = mountPin({ defaultValue: '12' })
  const unnamedProxy = unnamed.container.querySelector<HTMLInputElement>(
    'input[aria-hidden="true"]'
  )!
  expect(unnamedProxy).toBeInTheDocument()
  expect(unnamedProxy).toHaveValue('12')
  expect(unnamedProxy).not.toHaveAttribute('name')
  expect(unnamedProxy).toHaveAttribute('aria-hidden', 'true')
  expect(unnamedProxy).toHaveAttribute('tabindex', '-1')
  expect(unnamedProxy).toHaveStyle({
    position: 'absolute',
    width: '1px',
    height: '1px',
  })
  expect(unnamedProxy.style.clipPath).toBe('inset(50%)')
})

// forms.3 remains partial: no invalid callback API is exposed, and disabled
// proxy DOM repair after a scripted input event is not an adopted guarantee.
test.each([
  ['disabled', ''],
  ['disabled', '5678'],
  ['readonly', ''],
  ['readonly', '5678'],
] as const)(
  'pin-input.forms.3 %s proxy edits preserve form semantics for original value %s',
  async (mode, defaultValue) => {
    const changed = vi.fn()
    const completed = vi.fn()
    const fixture = mountPin({
      [mode]: true,
      name: 'otp',
      defaultValue,
      onValueChange: changed,
      onValueComplete: completed,
    })
    const form = document.createElement('form')
    document.body.append(form)
    form.append(fixture.container)
    cleanups.push(() => form.remove())
    const proxy = fixture.container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!

    expect(proxy).toHaveValue(defaultValue)
    proxy.value = '1234'
    proxy.dispatchEvent(new InputEvent('input', { bubbles: true, data: '1234' }))
    await settle()

    expect(fixture.slots.map((slot) => slot.value)).toEqual(
      Array.from({ length: 4 }, (_, index) => defaultValue[index] ?? '')
    )
    if (mode === 'readonly') {
      expect(proxy).toHaveValue(defaultValue)
      expect(new FormData(form).getAll('otp')).toEqual([defaultValue])
    } else {
      expect(new FormData(form).getAll('otp')).toEqual([])
    }
    expect(changed).not.toHaveBeenCalled()
    expect(completed).not.toHaveBeenCalled()
  }
)

test('pin-input.forms.4 required proxy exposes full-length pattern validity for incomplete and complete codes', async () => {
  const form = document.createElement('form')
  document.body.append(form)
  const fixture = mountPin({ required: true, name: 'otp', defaultValue: '12' })
  form.append(fixture.container)
  cleanups.push(() => form.remove())
  const proxy = fixture.container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!

  expect(proxy).toBeRequired()
  expect(proxy).toHaveAttribute('pattern', '.{4}')
  expect(proxy).not.toHaveAttribute('minlength')
  expect(proxy).not.toHaveAttribute('maxlength')
  expect(form.checkValidity()).toBe(false)

  await userEvent.click(fixture.slots[2]!)
  await userEvent.type(fixture.slots[2]!, '34')
  await settle()
  expect(form.checkValidity()).toBe(true)
})

test('pin-input.forms.5 Field state reaches slots and proxy, descriptions stay available, and errors follow invalid state', () => {
  const valid = mountField({ required: true })
  const validProxy = valid.container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!
  expect(validProxy).toBeRequired()
  expect(valid.slots[0]).toHaveAccessibleDescription('Enter the four digit code')
  expect(valid.container.textContent).not.toContain('Code is invalid')

  const invalid = mountField({ invalid: true })
  expect(invalid.slots.every((slot) => slot.getAttribute('aria-invalid') === 'true')).toBe(true)
  expect(invalid.slots[0]).toHaveAccessibleDescription('Enter the four digit code Code is invalid')
  expect(invalid.container.textContent).toContain('Code is invalid')

  const disabled = mountField({ disabled: true, invalid: true })
  const disabledProxy = disabled.container.querySelector<HTMLInputElement>(
    'input[aria-hidden="true"]'
  )!
  expect(disabledProxy).toBeDisabled()
  expect(disabled.slots.every((slot) => slot.disabled)).toBe(true)
  expect(disabled.slots.every((slot) => slot.getAttribute('aria-invalid') === 'true')).toBe(true)

  const readonly = mountField({ readonly: true, invalid: true })
  const readonlyProxy = readonly.container.querySelector<HTMLInputElement>(
    'input[aria-hidden="true"]'
  )!
  expect(readonlyProxy).toHaveAttribute('readonly')
  expect(readonly.slots.every((slot) => slot.readOnly)).toBe(true)
  expect(readonly.slots.every((slot) => slot.getAttribute('aria-invalid') === 'true')).toBe(true)
})
