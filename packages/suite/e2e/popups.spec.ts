import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?popups'

test('popover associations and hidden menu hydrate without replacing server nodes', async ({
  browser,
  page,
}) => {
  const server = await browser.newContext({ javaScriptEnabled: false })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    const initial = await server.newPage()
    expect((await initial.goto(url))?.ok()).toBe(true)
    await expect(initial.locator('#profile-popup')).toHaveAttribute(
      'aria-labelledby',
      'profile-title'
    )
    await expect(initial.locator('#profile-popup')).toHaveAttribute(
      'aria-describedby',
      'profile-help'
    )
    await expect(initial.locator('#actions-menu')).toBeHidden()
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    const popup = page.getByRole('dialog', { name: 'Profile' })
    await expect(popup).toHaveAccessibleDescription('Update your display name.')
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused()
    await expect(popup).toHaveAttribute('data-side', 'bottom')
    await page.getByRole('button', { name: 'Save profile' }).click()
    await expect(page.locator('#profile-trigger')).toBeFocused()
    await page.locator('#profile-trigger').click()
    await expect(popup).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(popup).toHaveCount(0)
    expect(errors).toEqual([])
  } finally {
    await server.close()
  }
})

test('hydrated menu supports persistent choices, submenu selection, and native Tab exit', async ({
  browser,
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const server = await browser.newContext({ javaScriptEnabled: false })
  try {
    const initial = await server.newPage()
    await initial.goto(`${url}&menu`)
    await expect(initial.locator('#actions-trigger')).toHaveAttribute('aria-expanded', 'true')
    await expect(initial.locator('#actions-trigger')).toHaveAttribute(
      'aria-controls',
      'actions-menu'
    )
    await expect(initial.locator('#actions-menu')).toHaveAttribute(
      'aria-labelledby',
      'actions-trigger'
    )
  } finally {
    await server.close()
  }
  await page.goto(`${url}&menu`)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  const trigger = page.getByRole('button', { name: 'Actions', exact: true })
  await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Space')
  await expect(page.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'PDF', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Selected action')).toHaveText('PDF')
  await expect(trigger).toBeFocused()
  await expect(page.locator('#actions-menu')).toBeHidden()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'After actions' })).toBeFocused()
  await expect(page.locator('#actions-menu')).toBeHidden()
  expect(errors).toEqual([])
})
