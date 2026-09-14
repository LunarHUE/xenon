import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Progress } from './progress'

describe('<Progress />', () => {
  test('renders a progressbar with explicit bounds', () => {
    const { getByRole } = render(() => <Progress value={40} aria-label="Upload" />)
    const el = getByRole('progressbar')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveAttribute('aria-valuemin', '0')
    expect(el).toHaveAttribute('aria-valuemax', '100')
    expect(el).toHaveAttribute('aria-valuenow', '40')
    expect(el).toHaveAttribute('aria-valuetext', '40%')
    expect(el).toHaveAttribute('data-state', 'loading')
    expect(el.style.getPropertyValue('--progress-percentage')).toBe('40')
  })

  test('the value and the custom property are reactive', () => {
    const [value, setValue] = createSignal(10)
    const { getByRole } = render(() => <Progress value={value()} aria-label="Upload" />)
    const el = getByRole('progressbar')
    setValue(100)
    flush()
    expect(el).toHaveAttribute('aria-valuenow', '100')
    expect(el).toHaveAttribute('data-state', 'complete')
    expect(el.style.getPropertyValue('--progress-percentage')).toBe('100')
  })

  test('dropping the value goes indeterminate and takes the percentage with it', () => {
    const [value, setValue] = createSignal<number | undefined>(30)
    const { getByRole } = render(() => <Progress value={value()} aria-label="Upload" />)
    const el = getByRole('progressbar')
    setValue(undefined)
    flush()
    expect(el).not.toHaveAttribute('aria-valuenow')
    expect(el).not.toHaveAttribute('aria-valuetext')
    expect(el).toHaveAttribute('data-state', 'indeterminate')
    expect(el.style.getPropertyValue('--progress-percentage')).toBe('')
  })

  test('format drives aria-valuetext', () => {
    const { getByRole } = render(() => (
      <Progress
        value={3}
        max={4}
        format={(d) => `step ${d.value} of ${d.max}`}
        aria-label="Wizard"
      />
    ))
    expect(getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'step 3 of 4')
  })

  test('an author aria-valuetext wins, and as= keeps the role', () => {
    const { getByRole } = render(() => (
      <Progress as="span" value={50} aria-label="Upload" aria-valuetext="halfway" />
    ))
    const el = getByRole('progressbar')
    expect(el.tagName).toBe('SPAN')
    expect(el).toHaveAttribute('aria-valuetext', 'halfway')
    expect(el).toHaveAttribute('aria-valuenow', '50')
  })
})
