import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { PopoverDemo } from '../../../../apps/example/src/demos/popover'
import '../../../../apps/example/src/styles.css'

let dispose: (() => void) | undefined
afterEach(() => {
  dispose?.()
  dispose = undefined
})

test('example popover keeps the arrow behind its panel throughout opacity animations', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const unmount = render(() => <PopoverDemo />, container)
  dispose = () => {
    unmount()
    container.remove()
  }
  flush()
  const trigger = [...container.querySelectorAll('button')].find(
    (el) => el.textContent === 'Edit note'
  )!
  trigger.click()
  flush()
  await expect.poll(() => document.querySelector('.demo-popover')).not.toBeNull()
  const content = document.querySelector<HTMLElement>('.demo-popover')!
  await expect.poll(() => getComputedStyle(content.parentElement!).visibility).toBe('visible')
  const arrow = content.querySelector<HTMLElement>('.demo-popover__arrow')!
  // Enable hit testing on the decorative arrow to inspect its paint order.
  arrow.style.pointerEvents = 'auto'
  const assertPanelCoversArrow = () => {
    const panel = content.getBoundingClientRect()
    const tip = arrow.getBoundingClientRect()
    const x = Math.max(panel.left + 2, Math.min(panel.right - 2, tip.x + tip.width / 2))
    const y = Math.max(panel.top + 2, Math.min(panel.bottom - 2, tip.y + tip.height / 2))
    const paintedPanel = document.elementFromPoint(x, y)
    expect(content.contains(paintedPanel)).toBe(true)
    expect(paintedPanel).not.toBe(arrow)
    const outsideY = content.dataset.side === 'top' ? panel.bottom + 2 : panel.top - 2
    expect(document.elementFromPoint(tip.x + tip.width / 2, outsideY)).toBe(arrow)
  }
  const enter = content.getAnimations()[0]!
  expect(enter).toBeDefined()
  enter.pause()
  for (const time of [1, 80, 159]) {
    enter.currentTime = time
    assertPanelCoversArrow()
  }
  enter.finish()
  assertPanelCoversArrow()
  content.querySelector<HTMLButtonElement>('[aria-label="Done with note"]')!.click()
  flush()
  await expect.poll(() => content.hasAttribute('data-ending-style')).toBe(true)
  // Exit disables interaction; restore hit testing solely for the paint-order probe.
  content.inert = false
  content.parentElement!.inert = false
  content.style.pointerEvents = 'auto'
  content.parentElement!.style.pointerEvents = 'auto'
  const exit = content.getAnimations()[0]!
  exit.pause()
  for (const time of [1, 70, 139]) {
    exit.currentTime = time
    assertPanelCoversArrow()
  }
})
