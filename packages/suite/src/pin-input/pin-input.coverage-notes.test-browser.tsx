import { render } from '@solidjs/web'
import { PinInput } from '@xenon/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mountPin(onValueComplete?: (value: string) => void) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput length={4} onValueComplete={onValueComplete}>
        <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
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

test('pin-input.notes.2 an Input rendered without PinInput throws a named context error', () => {
  const container = document.createElement('div')
  document.body.append(container)
  cleanups.push(() => container.remove())
  expect(() => render(() => <PinInput.Input index={0} />, container)).toThrow(
    'PinInput.Input must be rendered inside a <PinInput>'
  )
})

test('pin-input.notes.10 direct password-manager writes with plain input events join and complete once', () => {
  const completed = vi.fn()
  const fixture = mountPin(completed)

  for (const [index, character] of ['1', '2', '3', '4'].entries()) {
    fixture.slots[index]!.value = character
    fixture.slots[index]!.dispatchEvent(new Event('input', { bubbles: true }))
    flush()
  }

  expect(fixture.slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4'])
  expect(completed).toHaveBeenCalledExactlyOnceWith('1234')
})
