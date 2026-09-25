import { Field } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
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
  defaultValue,
  length = 4,
  autofocus = false,
  next = false,
  onKeyDown,
}: {
  defaultValue?: string
  length?: number
  autofocus?: boolean
  next?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <PinInput defaultValue={defaultValue} length={length}>
          <For each={Array.from({ length }, (_value, index) => index)}>
            {(index) => (
              <PinInput.Input
                index={index}
                autofocus={autofocus && index === 0}
                onKeyDown={(event) => onKeyDown?.(event)}
              />
            )}
          </For>
        </PinInput>
        {next ? <button type="button">Next</button> : null}
      </>
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
    next: container.querySelector<HTMLButtonElement>('button')!,
  }
}

// Native autofocus requires a fresh document before another control has taken
// focus. Run this first in the browser file and wait for the browser's processing.
test('pin-input.focus.4 native autofocus on the first slot focuses it on mount', async () => {
  const { slots } = mountPin({ autofocus: true })
  expect(slots[0]).toHaveAttribute('autofocus')
  await expect.poll(() => document.activeElement).toBe(slots[0])
})

test('pin-input.focus.1 programmatic focus past a gap redirects to the insertion slot', () => {
  const { slots } = mountPin({ defaultValue: '12' })

  slots[3]!.focus()
  expect(document.activeElement).toBe(slots[2])
})

test.each([
  ['12', 0],
  ['12', 1],
  ['12', 2],
  ['1234', 0],
  ['1234', 2],
  ['1234', 3],
] as const)(
  'pin-input.focus.2 Tab exits the active slot to the next control (%s, %i)',
  async (defaultValue, active) => {
    const { slots, next } = mountPin({ defaultValue, next: true })
    slots[active]!.focus()
    expect(document.activeElement).toBe(slots[active])
    await userEvent.tab()
    expect(document.activeElement).toBe(next)
    const insertion = Math.min(defaultValue.length, slots.length - 1)
    expect(slots.map((slot) => slot.tabIndex)).toEqual(
      slots.map((_slot, index) => (index === insertion ? 0 : -1))
    )
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(slots[insertion])
  }
)

test('pin-input.focus.2 consumer cancellation keeps Tab on the active earlier slot', async () => {
  const { slots } = mountPin({
    defaultValue: '12',
    next: true,
    onKeyDown: (event) => {
      if (event.key === 'Tab') event.preventDefault()
    },
  })
  slots[0]!.focus()
  await userEvent.tab()
  expect(document.activeElement).toBe(slots[0])
  expect(slots.map((slot) => slot.tabIndex)).toEqual([-1, -1, 0, -1])
})

test('pin-input.focus.3 Shift+Tab re-enters at the insertion point for partial and complete values', async () => {
  for (const [defaultValue, insertion] of [
    ['12', 2],
    ['1234', 3],
  ] as const) {
    const fixture = mountPin({ defaultValue, next: true })
    await userEvent.click(fixture.next)
    await userEvent.tab({ shift: true })
    expect(document.activeElement).toBe(fixture.slots[insertion])
  }
})

test('pin-input.focus.5 clicking a Field label focuses the first slot', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Field>
        <Field.Label>Verification code</Field.Label>
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

  await userEvent.click(container.querySelector('label')!)
  expect(document.activeElement).toBe(container.querySelector('[data-index="0"]'))
})
