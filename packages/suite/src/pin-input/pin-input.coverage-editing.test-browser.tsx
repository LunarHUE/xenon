import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
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

function mount({
  defaultValue,
  length = 4,
  onValueChange,
}: {
  defaultValue?: string
  length?: number
  onValueChange?: (value: string) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput defaultValue={defaultValue} length={length} onValueChange={onValueChange}>
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
  return Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
}

function values(slots: HTMLInputElement[]) {
  return slots.map((slot) => slot.value)
}

test('pin-input.keyboard.5 replaces a filled slot while preserving following slots and advancing focus', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', onValueChange: changed })

  await userEvent.click(slots[1]!)
  await userEvent.keyboard('9')

  expect(values(slots)).toEqual(['1', '9', '3', '4'])
  expect(document.activeElement).toBe(slots[2])
  expect(changed).toHaveBeenLastCalledWith('1934')
})

test('pin-input.keyboard.9 Backspace clears every filled slot and moves focus backward, including the first', async () => {
  for (const index of [0, 1, 2, 3]) {
    const changed = vi.fn()
    const slots = mount({ defaultValue: '1234', onValueChange: changed })

    await userEvent.click(slots[index]!)
    await userEvent.keyboard('{Backspace}')

    const expected = '1234'.slice(0, index) + '1234'.slice(index + 1)
    expect(values(slots)).toEqual([...expected, ...Array(4 - expected.length).fill('')])
    expect(document.activeElement).toBe(slots[Math.max(0, index - 1)])
    expect(changed).toHaveBeenLastCalledWith(expected)
  }
})

test('pin-input.keyboard.11 repeated Backspace from the last slot clears the whole filled value', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', onValueChange: changed })

  await userEvent.click(slots[3]!)
  for (const remaining of [3, 2, 1, 0]) {
    await userEvent.keyboard('{Backspace}')
    expect(values(slots)).toEqual([...'1234'.slice(0, remaining), ...Array(4 - remaining).fill('')])
    expect(document.activeElement).toBe(slots[Math.max(0, remaining - 1)])
    expect(changed).toHaveBeenLastCalledWith('1234'.slice(0, remaining))
  }
  expect(changed.mock.calls.map(([value]) => value)).toEqual(['123', '12', '1', ''])
})

test('pin-input.keyboard.13 Delete on an empty slot is silent and keeps focus and values', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '12', onValueChange: changed })

  await userEvent.click(slots[2]!)
  expect(document.activeElement).toBe(slots[2])
  await userEvent.keyboard('{Delete}')

  expect(values(slots)).toEqual(['1', '2', '', ''])
  expect(document.activeElement).toBe(slots[2])
  expect(changed).not.toHaveBeenCalled()
})

test('pin-input.keyboard.16 invalid input preserves a filled slot and its selection for replacement', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', onValueChange: changed })

  await userEvent.click(slots[0]!)
  await userEvent.keyboard('{ArrowRight}')
  expect(slots[1]?.selectionStart).toBe(0)
  expect(slots[1]?.selectionEnd).toBe(1)
  await userEvent.keyboard('a')

  expect(slots[1]).toHaveValue('2')
  expect(document.activeElement).toBe(slots[1])
  expect(slots[1]?.selectionStart).toBe(0)
  expect(slots[1]?.selectionEnd).toBe(1)
  expect(changed).not.toHaveBeenCalled()

  await userEvent.keyboard('9')
  expect(values(slots)).toEqual(['1', '9', '3', '4'])
  expect(document.activeElement).toBe(slots[2])
  expect(changed).toHaveBeenLastCalledWith('1934')
})
