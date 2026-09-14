import { expect, test } from 'playwright/test'

test('positioning stays hidden on the server, hydrates in place, and follows live geometry', async ({
  browser,
  page,
}) => {
  const url = 'http://127.0.0.1:4174/?positioning'
  const server = await browser.newContext({ javaScriptEnabled: false })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    const initial = await server.newPage()
    expect((await initial.goto(url))?.ok()).toBe(true)
    await expect(initial.locator('#positioning-floating')).toHaveCount(1)
    await expect(initial.locator('#positioning-floating')).toHaveCSS('visibility', 'hidden')
    await expect(initial.locator('#positioning-floating')).toHaveCSS('pointer-events', 'none')
    await expect(initial.locator('#positioning-arrow')).toHaveAttribute('aria-hidden', 'true')
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    const popup = page.locator('#positioning-floating')
    await expect(popup).toHaveAttribute('data-positioned', '')
    await expect(popup).toBeVisible()
    await expect(popup).toHaveAttribute('data-side', 'bottom')
    await expect(popup).toHaveCSS('left', '160px')
    await expect(popup).toHaveCSS('top', '182px')
    await expect(popup.locator('article')).toHaveCSS('transform', 'matrix(0.95, 0, 0, 0.95, 0, 0)')
    await page.getByRole('button', { name: 'Increase gap' }).click()
    await expect(popup).toHaveCSS('top', '194px')
    await page.getByRole('button', { name: 'Move anchor' }).click()
    await expect(popup).toHaveCSS('left', '235px')
    expect(errors).toEqual([])
  } finally {
    await server.close()
  }
})
