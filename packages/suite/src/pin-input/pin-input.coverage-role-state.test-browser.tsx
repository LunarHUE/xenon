import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import { PinInput } from '@xenon/solid/pin-input'
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

function mount({
  length = 4,
  defaultValue,
  type,
  disabled,
  readonly,
  invalid,
  getSlotLabel,
  firstInputMode,
}: {
  length?: number
  defaultValue?: string
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  getSlotLabel?: (index: number, length: number) => string
  firstInputMode?: 'tel'
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        length={length}
        defaultValue={defaultValue}
        type={type}
        disabled={disabled}
        readonly={readonly}
        invalid={invalid}
        getSlotLabel={getSlotLabel}
      >
        <For each={Array.from({ length }, (_value, index) => index)}>
          {(index) =>
            index === 0 && firstInputMode !== undefined ? (
              <PinInput.Input index={index} inputmode={firstInputMode} />
            ) : (
              <PinInput.Input index={index} />
            )
          }
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
    root: container.firstElementChild as HTMLElement,
    slots: Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]')),
    proxy: container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!,
  }
}

test('pin-input.roles.3 root state flags and Field.Label required state are exposed', () => {
  const fixture = mount({ defaultValue: '1234', disabled: true, readonly: true, invalid: true })
  expect(fixture.root).toHaveAttribute('data-disabled', '')
  expect(fixture.root).toHaveAttribute('data-readonly', '')
  expect(fixture.root).toHaveAttribute('data-invalid', '')
  expect(fixture.root).toHaveAttribute('data-complete', '')

  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Field required>
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
  expect(container.querySelector('[data-part="label"]')).toHaveAttribute('data-required', '')
})

test('pin-input.roles.5 slots expose index, filled state, root flags, and aria-invalid', () => {
  const { slots } = mount({
    length: 4,
    defaultValue: '12',
    disabled: true,
    readonly: true,
    invalid: true,
  })

  expect(slots).toHaveLength(4)
  slots.forEach((slot, index) => {
    expect(slot).toHaveAttribute('data-index', String(index))
    expect(slot).toHaveAttribute('data-disabled', '')
    expect(slot).toHaveAttribute('data-readonly', '')
    expect(slot).toHaveAttribute('data-invalid', '')
    expect(slot).toHaveAttribute('aria-invalid', 'true')
  })
  expect(slots[0]).toHaveAttribute('data-filled', '')
  expect(slots[1]).toHaveAttribute('data-filled', '')
  expect(slots[2]).not.toHaveAttribute('data-filled')
  expect(slots[3]).not.toHaveAttribute('data-filled')
})

test('pin-input.roles.6 localized slot labels use the translated index template for all three slots', () => {
  const { slots } = mount({
    length: 3,
    getSlotLabel: (index, length) => `pin code ${index + 1} of ${length}`,
  })

  expect(slots.map((slot) => slot.getAttribute('aria-label'))).toEqual([
    'pin code 1 of 3',
    'pin code 2 of 3',
    'pin code 3 of 3',
  ])
})

test('pin-input.roles.7 numeric and text modes select inputmode and a first-slot override wins', () => {
  const numeric = mount({ length: 3, type: 'numeric', firstInputMode: 'tel' })
  expect(numeric.slots.map((slot) => slot.getAttribute('inputmode'))).toEqual([
    'tel',
    'numeric',
    'numeric',
  ])

  const text = mount({ length: 3, type: 'alphabetic' })
  expect(text.slots.map((slot) => slot.getAttribute('inputmode'))).toEqual(['text', 'text', 'text'])
  // PinInput currently exposes mode selection through `type`; an explicit root
  // inputMode override and proxy override are not part of its public API.
  expect(numeric.proxy).not.toHaveAttribute('inputmode')
})

test('pin-input.roles.20 maintains one roving tab stop and moves focus through every slot', async () => {
  const { slots } = mount({ length: 4 })
  const expectRoving = (index: number) => {
    expect(slots.filter((slot) => slot.tabIndex === 0)).toHaveLength(1)
    expect(slots.map((slot) => slot.tabIndex)).toEqual(
      slots.map((_slot, slotIndex) => (slotIndex === index ? 0 : -1))
    )
  }

  expectRoving(0)
  for (const [index, value] of [1, 2, 3, 4].entries()) {
    await userEvent.type(slots[index]!, value.toString())
    expect(slots.map((slot) => slot.value)).toEqual(
      Array.from({ length: 4 }, (_, slotIndex) => (slotIndex <= index ? String(slotIndex + 1) : ''))
    )
    expect(document.activeElement).toBe(slots[Math.min(index + 1, 3)])
    expectRoving(Math.min(index + 1, 3))
  }

  // Tab entry follows the first empty slot; Backspace focus moves to the
  // preceding filled slot independently. A final deletion returns both to zero.
  for (const [focusIndex, insertionIndex, values] of [
    [2, 3, ['1', '2', '3', '']],
    [1, 2, ['1', '2', '', '']],
    [0, 1, ['1', '', '', '']],
    [0, 0, ['', '', '', '']],
  ] as const) {
    await userEvent.keyboard('{Backspace}')
    flush()
    expect(slots.map((slot) => slot.value)).toEqual(values)
    expect(document.activeElement).toBe(slots[focusIndex])
    expectRoving(insertionIndex)
  }
})
