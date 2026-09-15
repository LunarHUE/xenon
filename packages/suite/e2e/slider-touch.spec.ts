import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174'

type TouchPoint = {
  id: number
  x: number
  y: number
  radiusX: number
  radiusY: number
  force: number
}

test('slider.pointer.10 native owner touch continues after a secondary touch ends', async ({
  browser,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Native multiple touches require CDP')
  // A tall viewport keeps the SSR rail visible for CDP's viewport coordinates.
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 1600 },
  })
  const page = await context.newPage()
  try {
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    const fixture = page.locator('#numeric-fixture')
    const control = fixture.locator('#server-slider-control')
    const slider = fixture.getByRole('slider', { name: 'Server volume' })
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    const { x, y, width, height } = box!
    const point = (fraction: number, id = 1): TouchPoint => ({
      id,
      x: x + width * fraction,
      y: y + height * 0.75,
      radiusX: 1,
      radiusY: 1,
      force: 1,
    })
    const client = await page.context().newCDPSession(page)
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 })
    const dispatch = (type: 'touchStart' | 'touchMove' | 'touchEnd', touchPoints: TouchPoint[]) =>
      client.send('Input.dispatchTouchEvent', { type, touchPoints, modifiers: 0 })

    expect(
      await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, point(0.25))
    ).toBe('server-slider-control')
    await dispatch('touchStart', [point(0.25)])
    await expect(slider).toHaveValue('25')
    await expect(slider).toHaveAttribute('data-dragging', '')
    await dispatch('touchStart', [point(0.25), point(0.8, 2)])
    await dispatch('touchMove', [point(0.25), point(0.9, 2)])
    await expect(slider).toHaveValue('25')
    // CDP touchEnd lists the contacts being lifted, not the remaining contacts.
    await dispatch('touchEnd', [point(0.9, 2)])
    await expect(slider).toHaveAttribute('data-dragging', '')
    await dispatch('touchMove', [point(0.4)])
    await expect(slider).toHaveValue('40')
    await dispatch('touchMove', [point(0.6)])
    await expect(slider).toHaveValue('60')
    await dispatch('touchEnd', [])
    await expect(slider).not.toHaveAttribute('data-dragging')
    await expect(slider).toHaveValue('60')
    await client.detach()
  } finally {
    await context.close()
  }
})
