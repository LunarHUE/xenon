import { expect, test } from 'playwright/test'

test('field.ssr.2 removes the server label association after hydration', async ({ browser }) => {
  const url = 'http://127.0.0.1:4174/?fieldLabelToggle'
  const server = await browser.newContext({ javaScriptEnabled: false })
  const errors: string[] = []
  const page = await browser.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  try {
    const initial = await server.newPage()
    expect((await initial.goto(url))?.ok()).toBe(true)
    const control = initial.locator('#field-label-toggle-control')
    const id = await control.getAttribute('id')
    await expect(control).toHaveAttribute('aria-labelledby', /.+/)
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-ids-preserved', 'true')
    const hydrated = page.locator('#field-label-toggle-control')
    await expect(hydrated).toHaveAttribute('id', id!)
    const labelId = await hydrated.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    await expect(page.locator(`[id="${labelId}"]`)).toHaveText('Removable label')
    await page.getByRole('button', { name: 'Remove label' }).click()
    await expect(hydrated).not.toHaveAttribute('aria-labelledby')
    await expect(page.getByText('Removable label', { exact: true })).toHaveCount(0)
    expect(errors).toEqual([])
  } finally {
    await server.close()
    await page.close()
  }
})
