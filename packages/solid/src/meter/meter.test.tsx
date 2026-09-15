import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Meter } from './meter'
test('native measurement updates its values and CSS without replacing the host', () => {
  const [value, setValue] = createSignal(20)
  const { getByRole } = render(() => <Meter value={value()} aria-label="Disk usage" />)
  const el = getByRole('meter') as HTMLMeterElement
  expect(el.tagName).toBe('METER')
  expect(el.value).toBe(20)
  setValue(200)
  flush()
  expect(getByRole('meter')).toBe(el)
  expect(el.value).toBe(100)
  expect(el.style.getPropertyValue('--meter-percentage')).toBe('100')
})
test('generic hosts are named meters and author value text wins', () => {
  const { getByRole } = render(() => (
    <Meter as="div" value={30} aria-label="Storage" aria-valuetext="30 GB" />
  ))
  expect(getByRole('meter', { name: 'Storage' })).toHaveAttribute('aria-valuetext', '30 GB')
})
