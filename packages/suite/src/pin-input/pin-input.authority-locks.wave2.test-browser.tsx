import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  flush()
})
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
function mount(controlled = false) {
  const [readonly, setReadonly] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const [value, setValue] = createSignal('12')
  const changed = vi.fn()
  const completed = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <form>
        <PinInput
          length={3}
          name="code"
          defaultValue="12"
          value={controlled ? value() : undefined}
          readonly={readonly()}
          disabled={disabled()}
          onValueChange={changed}
          onValueComplete={completed}
        >
          <PinInput.Input index={0} />
          <PinInput.Input index={1} />
          <PinInput.Input index={2} />
        </PinInput>
        <button type="reset">Reset</button>
        <button type="button">Outside</button>
      </form>
    ),
    host
  )
  cleanup = () => {
    dispose()
    host.remove()
  }
  flush()
  return {
    slots: [...host.querySelectorAll<HTMLInputElement>('input[data-index]')],
    q: within(host),
    form: host.querySelector('form')!,
    changed,
    completed,
    setReadonly,
    setDisabled,
    setValue,
  }
}

test('rejected controlled completion restores the empty slot and never reports completion', async () => {
  const m = mount(true)
  for (const digit of ['3', '4']) {
    await userEvent.click(m.slots[2]!)
    await userEvent.keyboard(digit)
    expect(m.slots.map((slot) => slot.value)).toEqual(['1', '2', ''])
    expect(new FormData(m.form).get('code')).toBe('12')
  }
  expect(m.changed.mock.calls).toEqual([['123'], ['124']])
  expect(m.completed).not.toHaveBeenCalled()
  m.setValue('789')
  await settle()
  expect(m.slots.map((slot) => slot.value)).toEqual(['7', '8', '9'])
  expect(m.completed).not.toHaveBeenCalled()
})

test('rejected controlled Backspace proposals keep the stored character across repeated keys', async () => {
  const m = mount(true)
  await userEvent.click(m.slots[1]!)
  await userEvent.keyboard('{Backspace}')
  expect(m.slots.map((slot) => slot.value)).toEqual(['1', '2', ''])
  await userEvent.click(m.slots[1]!)
  await userEvent.keyboard('{Backspace}')
  expect(m.changed.mock.calls).toEqual([['1'], ['1']])
  expect(new FormData(m.form).get('code')).toBe('12')
})

test('readonly can be applied to the focused insertion slot and released before completion', async () => {
  const m = mount()
  await userEvent.click(m.slots[2]!)
  m.setReadonly(true)
  await settle()
  await userEvent.keyboard('9{Backspace}{Delete}')
  expect(m.slots.map((slot) => slot.value)).toEqual(['1', '2', ''])
  expect(m.changed).not.toHaveBeenCalled()
  m.setReadonly(false)
  await settle()
  await userEvent.click(m.slots[2]!)
  await userEvent.keyboard('3')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith('123')
  expect(m.completed).toHaveBeenCalledExactlyOnceWith('123')
})

test('disabled transitions exclude submission then restore the same partial code for typing', async () => {
  const m = mount()
  m.setDisabled(true)
  await settle()
  expect(m.slots.every((slot) => slot.disabled)).toBe(true)
  expect(new FormData(m.form).has('code')).toBe(false)
  m.setDisabled(false)
  await settle()
  expect(new FormData(m.form).get('code')).toBe('12')
  await userEvent.click(m.slots[2]!)
  await userEvent.keyboard('3')
  expect(new FormData(m.form).get('code')).toBe('123')
  expect(m.completed).toHaveBeenCalledExactlyOnceWith('123')
})

test('canceled reset preserves a completed code and an allowed reset restores the initial partial code silently', async () => {
  const m = mount()
  await userEvent.click(m.slots[2]!)
  await userEvent.keyboard('3')
  m.changed.mockClear()
  m.completed.mockClear()
  m.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(new FormData(m.form).get('code')).toBe('123')
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(m.slots.map((slot) => slot.value)).toEqual(['1', '2', ''])
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.completed).not.toHaveBeenCalled()
  await userEvent.click(m.slots[2]!)
  await userEvent.keyboard('4')
  expect(m.completed).toHaveBeenCalledExactlyOnceWith('124')
})
