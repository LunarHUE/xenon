import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

import { Slider } from '@xenon-ui/solid/slider'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))
function mount(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Slider aria-label="Budget" defaultValue={[20, 60]} {...props}>
        <Slider.Label>Budget</Slider.Label>
        <Slider.Control data-testid="control">
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="Minimum" />
          <Slider.Thumb index={1} aria-label="Maximum" />
        </Slider.Control>
        <Slider.ValueText />
      </Slider>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

test('slider.roles.1 and slider.roles.2 expose decimal slider value and bounds attributes', async () => {
  const view = mount({ min: -100, max: 100, step: 0.5, defaultValue: [-35.5] })
  const lower = view.getByRole('slider', { name: 'Minimum' })
  expect(lower).toHaveAttribute('aria-valuenow', '-35.5')
  expect(lower).toHaveAttribute('aria-valuemin', '-100')
  expect(lower).toHaveAttribute('aria-valuemax', '100')
  await expectNoViolations(view.container, ['aria-required-attr'])
  const defaults = mount({ defaultValue: [35.5] })
  const defaultThumb = defaults.getByRole('slider', { name: 'Minimum' })
  expect(defaultThumb).toHaveAttribute('aria-valuenow', '35.5')
  expect(defaultThumb).toHaveAttribute('aria-valuemin', '0')
  expect(defaultThumb).toHaveAttribute('aria-valuemax', '100')
})

test('slider.roles.9 gives the slider group its own accessible name', () => {
  const view = mount()
  const group = view.getByRole('group', { name: 'Budget' })
  expect(group).toHaveAccessibleName('Budget')
  expect(view.getByRole('slider', { name: 'Minimum' })).toHaveAccessibleName('Minimum')
})

test('slider.roles.21 leaves the control wrapper without a tabindex', () => {
  const view = mount()
  expect(view.getByTestId('control')).not.toHaveAttribute('tabindex')
})

test('slider.roles.1 and slider.roles.2 axe metadata require value now while default bounds stay optional', async () => {
  const missing = document.createElement('div')
  missing.setAttribute('role', 'slider')
  missing.setAttribute('aria-label', 'Missing value')
  document.body.append(missing)
  cleanups.push(() => missing.remove())
  const negative = await axe.run(missing, {
    runOnly: { type: 'rule', values: ['aria-required-attr'] },
  })
  expect(negative.violations).toHaveLength(1)
  expect(negative.violations[0]?.id).toBe('aria-required-attr')
  expect(negative.violations[0]?.impact).toBe('critical')

  const positive = document.createElement('div')
  positive.setAttribute('role', 'slider')
  positive.setAttribute('aria-label', 'Value')
  positive.setAttribute('aria-valuenow', '35.5')
  document.body.append(positive)
  cleanups.push(() => positive.remove())
  const valid = await axe.run(positive, {
    runOnly: { type: 'rule', values: ['aria-required-attr'] },
  })
  expect(valid.violations).toHaveLength(0)
  missing.remove()
  positive.remove()
})
