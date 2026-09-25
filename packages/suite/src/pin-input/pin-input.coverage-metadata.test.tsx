import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

import { expectNoViolations } from '../a11y'

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
  disabled,
  length = 4,
  mask,
  type,
  overrideSecondType,
}: {
  defaultValue?: string
  disabled?: boolean
  length?: number
  mask?: boolean
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  overrideSecondType?: boolean
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        defaultValue={defaultValue}
        disabled={disabled}
        length={length}
        mask={mask}
        type={type}
      >
        {overrideSecondType ? (
          <>
            <PinInput.Input index={0} />
            <PinInput.Input index={1} type="tel" />
            <PinInput.Input index={2} />
            <PinInput.Input index={3} />
          </>
        ) : (
          <For each={Array.from({ length }, (_value, index) => index)}>
            {(index) => <PinInput.Input index={index} />}
          </For>
        )}
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

test('pin-input.a11y.1 default and explicit numeric inputs pass the configured axe rules', async () => {
  const defaults = mount({})
  await expectNoViolations(defaults.root)

  const numeric = mount({ type: 'numeric' })
  await expectNoViolations(numeric.root)
})

test('pin-input.roles.10 mask sets password slots while a per-slot native type wins', () => {
  const m = mount({ mask: true, overrideSecondType: true })

  expect(m.slots.map((slot) => slot.type)).toEqual(['password', 'tel', 'password', 'password'])
})

test('pin-input.roles.12 disabled state reaches the root, every slot and the form proxy', () => {
  const m = mount({ disabled: true })

  expect(m.root).toHaveAttribute('data-disabled', '')
  expect(m.slots).toHaveLength(4)
  for (const slot of m.slots) expect(slot).toBeDisabled()
  expect(m.proxy).toBeDisabled()
})

test('pin-input.roles.4 complete state marks the root and every slot', () => {
  const m = mount({ defaultValue: '1234', length: 4 })

  expect(m.root).toHaveAttribute('data-complete', '')
  expect(m.slots).toHaveLength(4)
  for (const slot of m.slots) {
    expect(slot).toHaveAttribute('data-complete', '')
    expect(slot).toHaveAttribute('data-filled', '')
  }
})

test('pin-input.roles.8 every slot disables autocapitalization and spellcheck', () => {
  const m = mount({ length: 5, type: 'alphabetic' })

  expect(m.slots).toHaveLength(5)
  for (const slot of m.slots) {
    expect(slot).toHaveAttribute('autocapitalize', 'off')
    expect(slot).toHaveAttribute('spellcheck', 'false')
  }
})
