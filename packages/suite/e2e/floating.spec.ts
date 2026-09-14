import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?floating'

test('floating family preserves closed server markup and IDs through hydration', async ({
  browser,
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  const server = await browser.newContext({ javaScriptEnabled: false })
  try {
    const initial = await server.newPage()
    expect((await initial.goto(url))?.ok()).toBe(true)
    await expect(initial.locator('#floating-tooltip-trigger')).not.toHaveAttribute('aria-expanded')
    await expect(initial.locator('#floating-card-trigger')).toHaveAttribute('href', '#profile')
    await expect(initial.locator('#floating-card-trigger')).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    for (const id of [
      'floating-tooltip',
      'floating-card',
      'floating-context',
      'floating-file',
      'floating-edit',
    ]) {
      await expect(initial.locator(`#${id}`)).toHaveCount(1)
      await expect(initial.locator(`#${id}`)).toBeHidden()
    }
    await expect(initial.getByRole('navigation', { name: 'Site sections' })).toHaveCount(1)
    await expect(initial.getByRole('menubar', { name: 'Document commands' })).toHaveCount(1)
    const ids = await initial
      .locator('#app [id]')
      .evaluateAll((elements) => elements.map((element) => element.id))
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    expect(JSON.parse((await page.locator('#app').getAttribute('data-server-ids'))!)).toEqual(ids)
    await expect(page.locator('#floating-card-trigger')).toHaveAttribute('href', '#profile')
    expect(errors).toEqual([])
  } finally {
    await server.close()
  }
})

test('hydrated tooltips and hover cards retain their semantic and focus behavior', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  const tooltipTrigger = page.locator('#floating-tooltip-trigger')
  await tooltipTrigger.focus()
  await expect(page.getByRole('tooltip')).toBeVisible()
  await expect(tooltipTrigger).toHaveAttribute('aria-describedby', 'floating-tooltip')
  await expect(tooltipTrigger).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.locator('#floating-tooltip')).toBeHidden()
  const cardTrigger = page.locator('#floating-card-trigger')
  await cardTrigger.focus()
  await expect(page.getByRole('dialog', { name: 'Profile preview details' })).toBeVisible()
  await expect(cardTrigger).toHaveAttribute('aria-controls', 'floating-card')
  await page.getByRole('link', { name: 'View full profile' }).focus()
  await page.keyboard.press('Escape')
  await expect(page.locator('#floating-card')).toBeHidden()
  await expect(cardTrigger).toBeFocused()
  expect(errors).toEqual([])
})

test('hydrated context menus, menubars, and navigation panels accept native keyboard input', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await page.locator('#floating-context-trigger').focus()
  await page.keyboard.press('Shift+F10')
  await expect(page.locator('#floating-context')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Copy item' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Floating action')).toHaveText('Context copy')
  await page.locator('#floating-file-trigger').focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'New file' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'Undo edit' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Floating action')).toHaveText('Undo edit')
  await page.locator('#floating-nav-trigger').focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('link', { name: 'Product overview' })).toBeFocused()
  await expect(page.locator('#floating-nav-trigger')).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('#floating-nav-trigger')).toBeFocused()
  expect(errors).toEqual([])
})
