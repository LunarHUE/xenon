import { render } from '@solidjs/web'
import { AccessibleIcon } from '../../../solid/src/accessible-icon'
import { createSignal, flush } from 'solid-js'
import { within } from '@testing-library/dom'
import { afterEach, expect, test } from 'vitest'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

test('one named image hides decorative SVG names, updates its label and forwards ref', async () => {
  const root = document.createElement('div')
  document.body.append(root)
  const [label, setLabel] = createSignal('Close')
  let node: HTMLElement | undefined
  const dispose = render(
    () => (
      <AccessibleIcon
        label={label()}
        ref={(el) => {
          node = el
        }}
        data-author="yes"
      >
        <svg role="img" aria-label="artwork">
          <title>Artwork</title>
        </svg>
      </AccessibleIcon>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  expect(within(root).getAllByRole('img')).toHaveLength(1)
  expect(within(root).getByRole('img', { name: 'Close' })).toBe(node)
  expect(node).toHaveAttribute('data-author', 'yes')
  setLabel('Dismiss')
  flush()
  expect(node).toHaveAccessibleName('Dismiss')
  expect(node).not.toHaveAttribute('tabindex')
  await expectNoViolations(root)
})
