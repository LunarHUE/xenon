import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { HoverCard } from './hover-card'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('shared trigger focus transfers an open card immediately without remounting or close callbacks', () => {
  vi.useFakeTimers()
  const handle = HoverCard.createHandle<string>()
  const changed = vi.fn()
  const view = render(() => (
    <>
      <HoverCard.Trigger handle={handle} payload="Ada" href="#ada">
        Ada
      </HoverCard.Trigger>
      <HoverCard.Trigger handle={handle} payload="Grace" href="#grace">
        Grace
      </HoverCard.Trigger>
      <button>Outside</button>
      <HoverCard handle={handle} openDelay={200} closeDelay={0} onOpenChange={changed}>
        {(state) => (
          <HoverCard.Positioner>
            <HoverCard.Content aria-label="Person">
              {state.payload}
              <button>Inside</button>
            </HoverCard.Content>
          </HoverCard.Positioner>
        )}
      </HoverCard>
    </>
  ))
  flush()
  const ada = view.getByRole('link', { name: 'Ada' })
  const grace = view.getByRole('link', { name: 'Grace' })
  ada.focus()
  flush()
  vi.advanceTimersByTime(199)
  flush()
  expect(ada).toHaveAttribute('aria-expanded', 'false')
  vi.advanceTimersByTime(1)
  flush()
  const content = view.getByRole('dialog', { hidden: true })
  expect(content).toHaveTextContent('Ada')
  expect(ada).toHaveAttribute('data-current')
  grace.focus()
  flush()
  expect(grace).toHaveFocus()
  expect(grace).toHaveAttribute('aria-expanded', 'true')
  expect(view.getByRole('dialog', { hidden: true })).toBe(content)
  expect(content).toHaveTextContent('Grace')
  expect(ada).not.toHaveAttribute('data-current')
  expect(grace).toHaveAttribute('data-current')
  expect(changed.mock.calls).toEqual([[true]])
  view.getByText('Inside').focus()
  flush()
  ada.focus()
  flush()
  expect(view.getByRole('dialog', { hidden: true })).toBe(content)
  expect(content).toHaveTextContent('Ada')
  expect(ada).toHaveAttribute('data-current')
  expect(grace).not.toHaveAttribute('data-current')
  expect(changed.mock.calls).toEqual([[true]])
  view.getByRole('button', { name: 'Outside' }).focus()
  flush()
  expect(ada).toHaveAttribute('aria-expanded', 'false')
  expect(changed.mock.calls).toEqual([[true], [false]])
})
