import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { Progress } from './progress'

test('progress clears and restores its controlled value across indeterminate transitions', () => {
  const [value, setValue] = createSignal<number | undefined>(20)
  const view = render(() => <Progress value={value()} aria-label="Upload" />)
  const progress = view.getByRole('progressbar')

  setValue(undefined)
  flush()
  expect(progress).toHaveAttribute('data-state', 'indeterminate')
  expect(progress).not.toHaveAttribute('aria-valuenow')
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('')
  setValue(80)
  flush()
  expect(progress).toHaveAttribute('data-state', 'loading')
  expect(progress).toHaveAttribute('aria-valuenow', '80')
  expect(progress).toHaveAttribute('aria-valuetext', '80%')
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('80')
})

test('progress format receives normalized values while two instances update independently', () => {
  const firstFormat = vi.fn(
    ({ value, percentage }: { value: number; percentage: number }) => `${value}/${percentage}`
  )
  const [first, setFirst] = createSignal(5)
  const [second, setSecond] = createSignal(10)
  const view = render(() => (
    <>
      <Progress value={first()} min={0} max={10} format={firstFormat} aria-label="First" />
      <Progress value={second()} min={0} max={20} aria-label="Second" />
    </>
  ))
  const firstProgress = view.getByRole('progressbar', { name: 'First' })
  const secondProgress = view.getByRole('progressbar', { name: 'Second' })

  expect(firstProgress).toHaveAttribute('aria-valuetext', '5/50')
  expect(firstFormat).toHaveBeenCalledWith({ value: 5, min: 0, max: 10, percentage: 50 })
  expect(secondProgress).toHaveAttribute('aria-valuetext', '50%')
  setFirst(15)
  flush()
  expect(firstProgress).toHaveAttribute('aria-valuenow', '10')
  expect(firstProgress).toHaveAttribute('aria-valuetext', '10/100')
  expect(secondProgress).toHaveAttribute('aria-valuenow', '10')
  setSecond(20)
  flush()
  expect(secondProgress).toHaveAttribute('data-state', 'complete')
  expect(firstProgress).toHaveAttribute('aria-valuetext', '10/100')
})
