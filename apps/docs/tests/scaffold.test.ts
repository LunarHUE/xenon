import { expect, test } from 'playwright/test'

for (const route of [
  { path: '/', title: 'Docs scaffold', counts: [0] },
  { path: '/docs/test/', title: 'MDX content test', counts: [2, 10] },
]) {
  test(`${route.path} renders without JavaScript`, async ({ browser }) => {
    const page = await browser.newPage({ javaScriptEnabled: false })
    await page.goto(`http://127.0.0.1:4323${route.path}`)
    await expect(page.getByRole('heading', { name: route.title, exact: true })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText(route.counts.map((n) => `Count: ${n}`))
    await page.close()
  })

  test(`${route.path} hydrates independent Solid counters`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(route.path)
    await expect(page.locator('astro-island[ssr]')).toHaveCount(0)

    for (const [index, initial] of route.counts.entries()) {
      const island = page.locator('astro-island').nth(index)
      await island.getByRole('button', { name: 'Increment' }).click()
      await expect(island.getByRole('status')).toHaveText(`Count: ${initial + 1}`)
      for (const [otherIndex, otherInitial] of route.counts.entries()) {
        if (index !== otherIndex) {
          await expect(page.getByRole('status').nth(otherIndex)).toHaveText(
            `Count: ${otherInitial}`
          )
        }
      }
      await island.getByRole('button', { name: 'Reset' }).click()
      await expect(island.getByRole('status')).toHaveText(`Count: ${initial}`)
    }

    await expect(page.getByRole('button', { name: 'Increment' }).first()).toHaveCSS(
      'background-color',
      'oklch(0.216 0.006 56.043)'
    )
    expect(errors).toEqual([])
  })
}
