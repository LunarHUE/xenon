import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

/**
 * Checks nested Field associations, escaped IDs, custom-host merging, and removal of SSR markers.
 * Requires an already-loaded RoundOne fixture containing the Nested field associations region.
 * Works on JavaScript-disabled server markup or after hydration; the caller owns
 * navigation, hydration readiness, and page/context cleanup. Performs no interaction
 * and does not itself prove DOM preservation across hydration.
 */
async function expectAssociations(page: Page) {
  const region = page.getByRole('region', { name: 'Nested field associations' })
  const outer = region.getByRole('textbox', { name: 'Wrapped control', exact: true })
  await expect(outer).toHaveAttribute(
    'aria-describedby',
    'author-help help"&<one> second-help error"&<two>'
  )
  await expect(outer).toHaveAccessibleDescription(
    'Author help First help Second help Required value'
  )
  await expect(region.getByText('Wrapped control', { exact: true })).toHaveAttribute(
    'for',
    'wrapped-control'
  )
  const inner = region.getByRole('textbox', { name: 'Inner control', exact: true })
  await expect(inner).toHaveAttribute('aria-describedby', 'inner-help')
  await expect(inner).toHaveAccessibleDescription('Inner help')
  await expect(region.getByRole('textbox', { name: 'No description' })).not.toHaveAttribute(
    'aria-describedby'
  )
  await expect(region.getByText('Inactive error', { exact: true })).toHaveCount(0)
  await expect(
    region.getByRole('textbox', { name: 'Generic wrapped control' })
  ).toHaveAccessibleDescription('Generic help')
  await expect(
    region.getByRole('checkbox', { name: 'Wrapped checkbox' })
  ).toHaveAccessibleDescription('Checkbox help')
  await expect(region.getByRole('switch', { name: 'Wrapped switch' })).toHaveAccessibleDescription(
    'Switch help'
  )
  await expect(region.getByRole('textbox', { name: 'Custom absent description' })).toHaveAttribute(
    'data-has-description',
    'no'
  )
  await expect(
    region.getByRole('textbox', { name: 'Custom absent description' })
  ).toHaveAccessibleDescription('Custom host help')
  await expect(
    region.getByRole('textbox', { name: 'Custom merged description' })
  ).toHaveAccessibleDescription('Author help Field help Custom host help')
  await expect(region.getByTestId('control-constructions')).toHaveText('1')
  await expect(region.locator('pre')).toHaveText(
    'aria-describedby="tenon-field-authored" & <unchanged>'
  )
  expect(
    await region.evaluate((el) =>
      [...el.querySelectorAll('*')]
        .flatMap((node) => [...node.attributes].map((attr) => attr.value))
        .some((value) => /tenon-field-[a-f0-9]{8}-/.test(value))
    )
  ).toBe(false)
}

for (const mode of ['string', 'stream']) {
  test(`nested Field associations survive ${mode} rendering and hydration`, async ({
    browser,
    page,
  }) => {
    const url = `http://127.0.0.1:4174/${mode === 'stream' ? '?stream' : ''}`
    const server = await browser.newContext({ javaScriptEnabled: false })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    try {
      const initial = await server.newPage()
      const response = await initial.goto(url)
      expect(response?.ok()).toBe(true)
      await expect(initial.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
      await expectAssociations(initial)
      await page.goto(url)
      await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
      await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
      await expectAssociations(page)
      await page.getByText('Wrapped checkbox', { exact: true }).click()
      await expect(page.getByRole('checkbox', { name: 'Wrapped checkbox' })).toBeChecked()
      await page.getByText('Wrapped switch', { exact: true }).click()
      await expect(page.getByRole('switch', { name: 'Wrapped switch' })).toBeChecked()
      expect(errors).toEqual([])
    } finally {
      await server.close()
    }
  })
}

test('field finalization preserves asynchronous stream content', async ({ browser, page }) => {
  const url = 'http://127.0.0.1:4174/?stream&async'
  const server = await browser.newContext({ javaScriptEnabled: false })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  try {
    const initial = await server.newPage()
    const response = await initial.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(
      initial.getByRole('textbox', { name: 'Streaming control' })
    ).toHaveAccessibleDescription('Streaming help')
    await expect(initial.getByText('Asynchronous field content', { exact: true })).toBeVisible()
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(
      page.getByRole('textbox', { name: 'Streaming control' })
    ).toHaveAccessibleDescription('Streaming help')
    await expect(page.getByText('Asynchronous field content', { exact: true })).toBeVisible()
    expect(errors).toEqual([])
  } finally {
    await server.close()
  }
})
