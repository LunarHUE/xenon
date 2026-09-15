import { cleanup, render } from '@solidjs/testing-library'
import { For, flush, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { PinInput } from './index'
import { Field } from '../field'
afterEach(cleanup)
function Slots() {
  return <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
}
function input(el: HTMLInputElement, value: string) {
  el.value = value
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: value }))
  flush()
}
describe('PinInput', () => {
  test.each([
    { disabled: false, readonly: false, button: 0, focused: true },
    { disabled: false, readonly: true, button: 0, focused: true },
    { disabled: true, readonly: false, button: 0, focused: false },
    { disabled: false, readonly: false, button: 2, focused: false },
  ])('mousedown respects $disabled disabled, $readonly readonly, and button $button', (state) => {
    const view = render(() => (
      <PinInput length={2} defaultValue="12" disabled={state.disabled} readonly={state.readonly}>
        <PinInput.Input index={0} />
        <PinInput.Input index={1} />
      </PinInput>
    ))
    const slot = view.getAllByRole('textbox')[1] as HTMLInputElement
    slot.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: state.button })
    )
    expect(document.activeElement === slot).toBe(state.focused)
    if (state.focused) expect([slot.selectionStart, slot.selectionEnd]).toEqual([0, 1])
  })
  test('a bound mousedown handler can veto focus', () => {
    const veto = vi.fn((cancel: boolean, event: MouseEvent) => {
      if (cancel) event.preventDefault()
    })
    const view = render(() => (
      <PinInput length={2} defaultValue="12">
        <PinInput.Input index={0} />
        <PinInput.Input index={1} onMouseDown={[veto, true]} />
      </PinInput>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    slots[0]!.focus()
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    slots[1]!.dispatchEvent(down)
    slots[1]!.click()
    expect(veto).toHaveBeenCalledExactlyOnceWith(true, down)
    expect(document.activeElement).toBe(slots[0])
  })
  test('a canceled mousedown leaves the inactive slot selection untouched on click', () => {
    const view = render(() => (
      <PinInput length={2} defaultValue="12">
        <PinInput.Input index={0} />
        <PinInput.Input index={1} onMouseDown={(event) => event.preventDefault()} />
      </PinInput>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    slots[0]!.focus()
    slots[1]!.setSelectionRange(1, 1)
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    slots[1]!.dispatchEvent(down)
    expect(down.defaultPrevented).toBe(true)
    slots[1]!.click()
    expect(document.activeElement).toBe(slots[0])
    expect([slots[1]!.selectionStart, slots[1]!.selectionEnd]).toEqual([1, 1])
  })
  test('distributes autofill and submits one scalar value with completion', () => {
    const complete = vi.fn()
    const view = render(() => (
      <form>
        <PinInput length={4} name="otp" onValueComplete={complete}>
          <Slots />
        </PinInput>
      </form>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    input(slots[0]!, '0123')
    expect(slots.map((el) => el.value)).toEqual(['0', '1', '2', '3'])
    expect(document.activeElement).toBe(slots[3])
    expect(complete).toHaveBeenCalledExactlyOnceWith('0123')
    expect([...new FormData(view.container.querySelector('form')!)]).toEqual([['otp', '0123']])
    input(slots[3]!, '3')
    expect(complete).toHaveBeenCalledTimes(1)
  })
  test('controlled rejection restores characters and does not complete', () => {
    const change = vi.fn()
    const complete = vi.fn()
    const view = render(() => (
      <PinInput length={4} value="12" onValueChange={change} onValueComplete={complete}>
        <Slots />
      </PinInput>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    input(slots[2]!, '34')
    expect(change).toHaveBeenCalledWith('1234')
    expect(slots.map((el) => el.value)).toEqual(['1', '2', '', ''])
    expect(complete).not.toHaveBeenCalled()
  })
  test('invalid replacement restores the selected character before the next input', () => {
    const change = vi.fn()
    const view = render(() => (
      <PinInput length={4} defaultValue="1234" onValueChange={change}>
        <Slots />
      </PinInput>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    const slot = slots[1]!
    slot.focus()
    expect([slot.selectionStart, slot.selectionEnd]).toEqual([0, 1])
    input(slot, 'a')
    expect(slot.value).toBe('2')
    expect(document.activeElement).toBe(slot)
    expect([slot.selectionStart, slot.selectionEnd]).toEqual([0, 1])
    expect(change).not.toHaveBeenCalled()
    input(slot, '9')
    expect(slots.map((el) => el.value)).toEqual(['1', '9', '3', '4'])
    expect(document.activeElement).toBe(slots[2])
    expect(change).toHaveBeenCalledExactlyOnceWith('1934')
  })
  test('inherits Field state and restores initial form value silently', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <Field required name="code">
          <Field.Label>Verification</Field.Label>
          <PinInput length={4} defaultValue="12" onValueChange={change}>
            <Slots />
          </PinInput>
        </Field>
      </form>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    const form = view.container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    input(slots[2]!, '34')
    expect(form.checkValidity()).toBe(true)
    form.reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(slots.map((el) => el.value)).toEqual(['1', '2', '', ''])
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('composition commits once and canceled handlers suppress edits', () => {
    const change = vi.fn()
    const view = render(() => (
      <PinInput length={2} onValueChange={change}>
        <PinInput.Input index={0} />
        <PinInput.Input index={1} onPaste={(event) => event.preventDefault()} />
      </PinInput>
    ))
    const slots = view.getAllByRole('textbox') as HTMLInputElement[]
    slots[0]!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    input(slots[0]!, '1')
    expect(change).not.toHaveBeenCalled()
    slots[0]!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '1' }))
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith('1')
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => '2' } })
    slots[1]!.dispatchEvent(paste)
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('canceled input restores the browser DOM without requesting a change', () => {
    const change = vi.fn()
    const view = render(() => (
      <PinInput length={2} defaultValue="12" onValueChange={change}>
        <PinInput.Input index={0} onInput={(event) => event.preventDefault()} />
        <PinInput.Input index={1} />
      </PinInput>
    ))
    const slot = view.getAllByRole('textbox')[0] as HTMLInputElement
    slot.value = '9'
    slot.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: '9' }))
    expect(slot.value).toBe('1')
    expect(change).not.toHaveBeenCalled()
  })
})

test('reset follows a changed explicit form owner and honors cancellation', async () => {
  const [owner, setOwner] = createSignal('first-form')
  const changed = vi.fn()
  const view = render(() => (
    <>
      <form id="first-form" />
      <form id="second-form" />
      <PinInput form={owner()} name="otp" length={4} defaultValue="12" onValueChange={changed}>
        <Slots />
      </PinInput>
    </>
  ))
  const slots = view.getAllByRole('textbox') as HTMLInputElement[]
  input(slots[2]!, '34')
  setOwner('second-form')
  flush()
  const forms = view.container.querySelectorAll('form')
  forms[0]!.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(slots.map((slot) => slot.value).join('')).toBe('1234')
  forms[1]!.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(slots.map((slot) => slot.value).join('')).toBe('12')
  input(slots[2]!, '34')
  forms[1]!.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  forms[1]!.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(slots.map((slot) => slot.value).join('')).toBe('1234')
  expect(changed).toHaveBeenCalledTimes(2)
})

test('readonly autofill cannot mutate the submitted proxy, and slots inherit descriptions', () => {
  const view = render(() => (
    <form>
      <Field>
        <Field.Label>Verification</Field.Label>
        <Field.Description>Sent to your phone</Field.Description>
        <PinInput readonly name="otp" defaultValue="1234" length={4}>
          <Slots />
        </PinInput>
      </Field>
    </form>
  ))
  const proxy = view.container.querySelector('input[name="otp"]') as HTMLInputElement
  proxy.value = '9999'
  proxy.dispatchEvent(new InputEvent('input', { bubbles: true }))
  expect(new FormData(view.container.querySelector('form')!).get('otp')).toBe('1234')
  expect(view.getAllByRole('textbox')[0]).toHaveAccessibleDescription('Sent to your phone')
})
