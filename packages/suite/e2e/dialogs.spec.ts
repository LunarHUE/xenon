import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?dialogs'

test('modal locks background wheel scrolling while its content remains scrollable', async ({
  page,
}) => {
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await page.mouse.move(5, 5)
  await page.mouse.wheel(0, 400)
  const history = page.locator('[aria-label="Profile history"]')
  await history.hover()
  await page.mouse.wheel(0, 200)
  await expect.poll(() => history.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.getByRole('button', { name: 'Done editing' }).click()
  await page.mouse.move(5, 5)
  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
})

test('server dialog associations survive hydration into the native top layer', async ({
  browser,
  page,
}) => {
  const server = await browser.newContext({ javaScriptEnabled: false })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    const initial = await server.newPage()
    await initial.goto(url)
    await expect(initial.getByRole('dialog', { name: 'Edit profile' })).toHaveAccessibleDescription(
      'Change your public name.'
    )
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    const dialog = page.getByRole('dialog', { name: 'Edit profile' })
    await expect(dialog).toHaveAccessibleDescription('Change your public name.')
    await expect(dialog).toHaveAttribute('aria-labelledby', 'editor-title')
    expect(await dialog.evaluate((el) => el.matches(':modal'))).toBe(true)
    await page.getByRole('button', { name: 'Done editing' }).click()
    await expect(dialog).toHaveCount(0)
    await page.getByRole('button', { name: 'Open editor' }).click()
    await page.getByRole('button', { name: 'Native save' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open editor' })).toBeFocused()
    expect(errors).toEqual([])
  } finally {
    await server.close()
  }
})

test('alert dialog focuses Cancel and ignores backdrop clicks', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Done editing' }).click()
  await page.getByRole('button', { name: 'Delete profile' }).click()
  const alert = page.getByRole('alertdialog', { name: 'Delete permanently?' })
  await expect(page.getByRole('button', { name: 'Keep profile' })).toBeFocused()
  await page.mouse.click(5, 5)
  await expect(alert).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(alert).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Delete profile' })).toBeFocused()
})

test('drawer handle dismisses with a real downward drag and restores focus', async ({ page }) => {
  await page.goto(url)
  await page.getByRole('button', { name: 'Done editing' }).click()
  const trigger = page.getByRole('button', { name: 'Open settings' })
  await trigger.click()
  const drawer = page.getByRole('dialog', { name: 'Settings' })
  await expect(drawer).toHaveAttribute('data-side', 'bottom')
  const handle = page.getByRole('button', { name: 'Close drawer' })
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 100, { steps: 8 })
  await page.mouse.up()
  await expect(drawer).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(page.locator('body')).not.toHaveCSS('overflow-y', 'hidden')
})
