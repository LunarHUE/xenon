import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { Popover } from './popover'

afterEach(cleanup)

describe('Popover.Close accessible name', () => {
  test('names an icon-only close when its label is explicitly undefined', () => {
    const { getByRole } = render(() => (
      <Popover>
        <Popover.Close aria-label={undefined}>
          <svg aria-hidden="true" />
        </Popover.Close>
      </Popover>
    ))
    expect(getByRole('button', { name: 'Close popover' })).toHaveAttribute(
      'aria-label',
      'Close popover'
    )
  })

  test('preserves absent, custom, and explicitly empty labels', () => {
    const { getAllByRole } = render(() => (
      <Popover>
        <Popover.Close />
        <Popover.Close aria-label="Dismiss details" />
        <Popover.Close aria-label="">Close details</Popover.Close>
      </Popover>
    ))
    const buttons = getAllByRole('button')
    expect(buttons[0]).toHaveAccessibleName('Close popover')
    expect(buttons[1]).toHaveAccessibleName('Dismiss details')
    expect(buttons[2]).toHaveAttribute('aria-label', '')
    expect(buttons[2]).toHaveAccessibleName('Close details')
  })

  test('updates between an authored label and the default', () => {
    const [label, setLabel] = createSignal<string | undefined>('Dismiss details')
    const { getByRole } = render(() => (
      <Popover>
        <Popover.Close aria-label={label()} />
      </Popover>
    ))
    const close = getByRole('button', { name: 'Dismiss details' })
    setLabel(undefined)
    flush()
    expect(close).toHaveAccessibleName('Close popover')
    setLabel('Dismiss again')
    flush()
    expect(close).toHaveAccessibleName('Dismiss again')
  })
})
