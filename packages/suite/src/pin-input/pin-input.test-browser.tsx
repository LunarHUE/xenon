import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { For, flush, createSignal } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
const disposers: (() => void)[] = []
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
})
test('pin input browser paste, keyboard, required validation and form reset', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const completed = vi.fn()
  const dispose = render(
    () => (
      <form>
        <PinInput name="otp" length={4} required onValueComplete={completed}>
          <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
        </PinInput>
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </form>
    ),
    container
  )
  disposers.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const slots = Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
  const form = container.querySelector('form')!
  expect(form.reportValidity()).toBe(false)
  expect(document.activeElement).toBe(slots[0])
  await userEvent.keyboard('12')
  expect(document.activeElement).toBe(slots[2])
  const clipboard = new DataTransfer()
  clipboard.setData('text', 'a3-4-5')
  // Firefox's ClipboardEvent constructor discards the supplied DataTransfer.
  const paste = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(paste, 'clipboardData', { value: clipboard })
  slots[2]!.dispatchEvent(paste)
  flush()
  expect(slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4'])
  expect(completed).toHaveBeenCalledExactlyOnceWith('1234')
  expect(form.checkValidity()).toBe(true)
  expect([...new FormData(form)]).toEqual([['otp', '1234']])
  await userEvent.keyboard('{Home}{ArrowRight}{Delete}')
  expect(slots.map((slot) => slot.value)).toEqual(['1', '3', '4', ''])
  expect(document.activeElement).toBe(slots[1])
  await userEvent.click(container.querySelector('button[type="reset"]')!)
  flush()
  expect(slots.map((slot) => slot.value)).toEqual(['', '', '', ''])
})

test('form reset follows a dynamically reassigned external owner in a real browser', async () => {
  const [owner, setOwner] = createSignal('otp-first')
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <form id="otp-first" />
        <form id="otp-second" />
        <PinInput form={owner()} defaultValue="1" name="otp" length={2}>
          <PinInput.Input index={0} />
          <PinInput.Input index={1} />
        </PinInput>
      </>
    ),
    container
  )
  disposers.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const slots = container.querySelectorAll<HTMLInputElement>('[data-index]')
  await userEvent.fill(slots[1]!, '2')
  setOwner('otp-second')
  flush()
  const forms = container.querySelectorAll('form')
  forms[0]!.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(slots[1]!.value).toBe('2')
  forms[1]!.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(slots[0]!.value).toBe('1')
  expect(slots[1]!.value).toBe('')
  expect(new FormData(forms[1]!).get('otp')).toBe('1')
})

test('native reset activation retains untouched default and controlled codes', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <form>
        <PinInput defaultValue="12" length={2}>
          <PinInput.Input index={0} />
          <PinInput.Input index={1} />
        </PinInput>
        <PinInput value="34" length={2}>
          <PinInput.Input index={0} />
          <PinInput.Input index={1} />
        </PinInput>
        <button type="reset">Reset</button>
      </form>
    ),
    container
  )
  disposers.push(() => {
    dispose()
    container.remove()
  })
  flush()
  await userEvent.click(container.querySelector('button')!)
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(
    [...container.querySelectorAll<HTMLInputElement>('[data-index]')].map((input) => input.value)
  ).toEqual(['1', '2', '3', '4'])
})
