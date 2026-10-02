import { Button } from '@xenon-ui/solid/button'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const disposers: (() => void)[] = []
afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose()
})

function mount(view: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const dispose = render(view, container)
  disposers.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return container
}

test('removed button types restore native form submission and explicit reset behavior', () => {
  const [type, setType] = createSignal<'button' | 'submit' | 'reset' | undefined>('button')
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const container = mount(() => (
    <form onSubmit={submit}>
      <input name="value" defaultValue="initial" />
      <Button type={type()}>Action</Button>
      <Button data-default="">Default</Button>
    </form>
  ))
  const action = container.querySelector('button')!
  const input = container.querySelector('input')!
  action.click()
  expect(submit).not.toHaveBeenCalled()
  setType(undefined)
  flush()
  expect(action).not.toHaveAttribute('type')
  expect(action.type).toBe('submit')
  action.click()
  expect(submit).toHaveBeenCalledOnce()
  container.querySelector<HTMLButtonElement>('[data-default]')!.click()
  expect(submit).toHaveBeenCalledOnce()
  input.value = 'changed'
  setType('reset')
  flush()
  action.click()
  expect(input.value).toBe('initial')
})

test('empty disabled attributes, composed refs, and optional handlers agree with native DOM state', () => {
  const [disabled, setDisabled] = createSignal<JSX.BooleanAttribute | undefined>('')
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, [undefined, second]]
  const consumer = vi.fn()
  const [handler, setHandler] = createSignal<
    JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined
  >([consumer, 0])
  const container = mount(() => (
    <Button disabled={disabled()} ref={refs} onClick={handler()}>
      Action
    </Button>
  ))
  const button = container.querySelector('button')!
  expect(first).toHaveBeenCalledWith(button)
  expect(second).toHaveBeenCalledWith(button)
  expect(button.disabled).toBe(true)
  button.click()
  expect(consumer).not.toHaveBeenCalled()
  setDisabled(false)
  flush()
  expect(button).not.toHaveAttribute('disabled')
  expect(button).not.toHaveAttribute('data-disabled')
  button.click()
  expect(consumer).toHaveBeenCalledOnce()
  expect(consumer.mock.calls[0]![0]).toBe(0)
  setHandler(undefined)
  flush()
  button.click()
  expect(consumer).toHaveBeenCalledOnce()
})
