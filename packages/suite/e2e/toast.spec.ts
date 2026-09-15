import { expect, test } from 'playwright/test'

/** Consumer CSS must retarget a live stack without remounting the notification. */
test('notification stack handles rapid additions, expansion, variable heights, and undo', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/#toast')
  const section = page.locator('#toast')
  await section.getByRole('button', { name: 'Save three notes' }).click()
  const toasts = page.locator('.demo-toast:not([data-limited])')
  await expect(toasts).toHaveCount(3)
  await expect(toasts.first()).toContainText('Note 3 saved')
  await toasts.first().hover()
  await expect(page.locator('.demo-toasts')).toHaveAttribute('data-expanded')
  await expect
    .poll(async () => {
      const boxes = await toasts.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect()
          return { top: rect.top, bottom: rect.bottom }
        })
      )
      return boxes[1]!.bottom <= boxes[0]!.top && boxes[2]!.bottom <= boxes[1]!.top
    })
    .toBe(true)
  // The expanded stack can cover this lower-page control; reach it by keyboard.
  await section.getByRole('button', { name: 'Dismiss all' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.demo-toast')).toHaveCount(0)
  await section.getByRole('button', { name: 'Archive with undo' }).click()
  await page.getByRole('button', { name: 'Undo archive' }).click()
  await expect(section.locator('dd').first()).toHaveText('on your desk')
  await expect(page.locator('.demo-toast')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('promise updates preserve the rendered notification', async ({ page }) => {
  await page.goto('/#toast')
  await page.getByRole('button', { name: 'Export notes' }).click()
  const toast = page.locator('.demo-toast')
  await expect(toast).toContainText('Preparing your export')
  await toast.evaluate((element) => element.setAttribute('data-retained', 'yes'))
  await expect(toast).toContainText('Export ready')
  await expect(toast).toHaveAttribute('data-retained', 'yes')
  await expect(toast).toContainText('Desk notes.txt')
})

test('a swipe exits from the release position without snapping back', async ({ page }) => {
  await page.goto('/#toast')
  await page.getByRole('button', { name: 'Save a note', exact: true }).click()
  const toast = page.locator('.demo-toast')
  await expect(toast).toBeVisible()
  // Wait for the entrance transition before comparing drag and release geometry.
  await expect.poll(async () => toast.evaluate((element) => element.getAnimations().length)).toBe(0)
  const box = (await toast.boundingBox())!
  const x = box.x + 50
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 90, y, { steps: 12 })
  const releasedX = (await toast.boundingBox())!.x
  await page.mouse.up()
  const after = await toast.evaluate((element) => ({
    x: element.getBoundingClientRect().x,
    movement: parseFloat(
      (element as HTMLElement).style.getPropertyValue('--toast-swipe-movement-x')
    ),
  }))
  expect(after.movement).toBeGreaterThanOrEqual(85)
  expect(after.x).toBeGreaterThanOrEqual(releasedX - 2)
  await expect(toast).toHaveCount(0)
})

test('toast provider and viewport preserve server markup then accept client notifications', async ({
  page,
  browser,
}) => {
  const url = 'http://127.0.0.1:4174/?toast'
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const server = await context.newPage()
    expect((await server.goto(url))?.ok()).toBe(true)
    await expect(server.locator('#toast-inline')).toHaveCount(1)
    await expect(server.locator('#toast-add')).toHaveText('Save')
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('group', { name: 'Saved after hydration' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeFocused()
    await page.getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(page.getByRole('group')).toHaveCount(0)
    expect(errors).toEqual([])
  } finally {
    await context.close()
  }
})
