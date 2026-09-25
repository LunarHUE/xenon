import { render } from '@solidjs/web'
import { Meter } from '@xenon-ui/solid/meter'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect } from 'vitest'
import { expectNoViolations } from '../a11y'
import { spec } from '../spec'
let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
spec('meter.alpha.1', async () => {
  host = document.createElement('div')
  document.body.append(host)
  const [value, setValue] = createSignal<number | undefined>(25)
  dispose = render(
    () => (
      <>
        <Meter value={value()} aria-label="Disk usage" />
        <Meter as="div" min={-5} max={5} value={0} aria-label="Temperature" />
      </>
    ),
    host
  )
  flush()
  const native = host.querySelector('meter')!
  expect(native.value).toBe(25)
  expect(native.getAttribute('aria-valuenow')).toBe('25')
  expect(host.querySelector('[role="meter"]')).toHaveAttribute('aria-valuetext', '50%')
  native.focus()
  expect(native).not.toHaveFocus()
  await expectNoViolations(host)
  setValue(undefined)
  flush()
  expect(native.value).toBe(0)
  expect(native).toHaveAttribute('aria-valuenow', '0')
  expect(native.style.getPropertyValue('--meter-percentage')).toBe('0')
  await expectNoViolations(host)
})
