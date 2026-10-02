import { afterEach, expect, test, vi } from 'vitest'
import { subscribeFormReset } from './form-reset'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.useRealTimers()
})

function mount() {
  vi.useFakeTimers()
  const form = document.createElement('form')
  const other = document.createElement('form')
  form.id = 'reset-owner'
  other.id = 'other-owner'
  const input = document.createElement('input')
  input.defaultValue = 'initial'
  input.value = 'edited'
  form.append(input)
  document.body.append(form, other)
  const restored = vi.fn(() => {
    input.value = 'restored'
  })
  const dispose = subscribeFormReset(document, () => input.form, restored)
  cleanups.push(dispose)
  return { form, other, input, restored, dispose }
}

test('restoration waits until after dispatch and native reset default action', () => {
  const view = mount()
  view.form.addEventListener('reset', () => expect(view.restored).not.toHaveBeenCalled())
  view.form.reset()
  expect(view.input.value).toBe('initial')
  expect(view.restored).not.toHaveBeenCalled()
  vi.runAllTimers()
  expect(view.input.value).toBe('restored')
  expect(view.restored).toHaveBeenCalledTimes(1)
})

test('every registered control restores even when form bubbling is stopped', () => {
  const view = mount()
  const second = vi.fn()
  cleanups.push(subscribeFormReset(document, () => view.input.form, second))
  view.form.addEventListener('reset', (event) => event.stopPropagation())
  view.form.reset()
  vi.runAllTimers()
  expect(view.restored).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)
})

for (const capture of [true, false]) {
  test(`final cancellation in ${capture ? 'form capture' : 'late window bubble'} suppresses restoration`, () => {
    const view = mount()
    const target = capture ? view.form : window
    const cancel = (event: Event) => event.preventDefault()
    target.addEventListener('reset', cancel, capture)
    cleanups.push(() => target.removeEventListener('reset', cancel, capture))
    view.form.reset()
    vi.runAllTimers()
    expect(view.input.value).toBe('edited')
    expect(view.restored).not.toHaveBeenCalled()
  })
}

test('reset follows reactive native form ownership and ignores unrelated forms', () => {
  const view = mount()
  view.input.setAttribute('form', view.other.id)
  view.form.reset()
  vi.runAllTimers()
  expect(view.restored).not.toHaveBeenCalled()
  view.other.reset()
  vi.runAllTimers()
  expect(view.restored).toHaveBeenCalledTimes(1)
})

test('ownership changing during dispatch prevents restoration for the former owner', () => {
  const view = mount()
  view.form.addEventListener('reset', () => view.input.setAttribute('form', view.other.id))
  view.form.reset()
  vi.runAllTimers()
  expect(view.restored).not.toHaveBeenCalled()
})

test('disposal removes observation and cancels pending restoration', () => {
  const view = mount()
  view.form.reset()
  expect(vi.getTimerCount()).toBe(1)
  view.dispose()
  expect(vi.getTimerCount()).toBe(0)
  vi.runAllTimers()
  view.form.reset()
  vi.runAllTimers()
  expect(view.restored).not.toHaveBeenCalled()
})
