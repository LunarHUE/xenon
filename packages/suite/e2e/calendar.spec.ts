import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?calendar'

/** Capture hydration diagnostics, including Solid reactive writes that may not throw. */
function diagnostics(page: import('playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test('date-only calendar markup and IDs survive hydration across distant time zones', async ({
  browser,
  page,
}) => {
  const errors = diagnostics(page)
  const context = await browser.newContext({
    javaScriptEnabled: false,
    timezoneId: 'Pacific/Honolulu',
  })
  try {
    const server = await context.newPage()
    expect((await server.goto(url))?.ok()).toBe(true)
    await expect(server.locator('#calendar-heading')).toContainText('February 2024')
    await expect(server.locator('#calendar-grid button[tabindex="0"]')).toHaveCount(1)
    await expect(server.locator('#calendar-selected')).toHaveText('2024-02-15')
    await expect(
      server.locator('#range-hydrated [role="gridcell"][aria-selected="true"]')
    ).toHaveCount(3)
    await expect(server.locator('#calendar-range')).toHaveText('2024-02-12 / 2024-02-14')
    const serverIds = await server
      .locator('#app [id]')
      .evaluateAll((nodes) => nodes.map((node) => node.id))
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
    expect(JSON.parse((await page.locator('#app').getAttribute('data-server-ids'))!)).toEqual(
      serverIds
    )
    expect(
      await page.locator('#app [id]').evaluateAll((nodes) => nodes.map((node) => node.id))
    ).toEqual(serverIds)
    await expect(page.locator('#calendar-hydrated')).toHaveAttribute(
      'aria-labelledby',
      'calendar-heading'
    )
    await expect(page.locator('#calendar-heading')).toContainText('February 2024')
    await expect(page.locator('#calendar-grid button[tabindex="0"]')).toHaveCount(1)
    await expect(
      page.locator('#range-hydrated [role="gridcell"][aria-selected="true"]')
    ).toHaveCount(3)
    expect(errors).toEqual([])
    const other = await browser.newContext({ timezoneId: 'Pacific/Kiritimati' })
    try {
      const ahead = await other.newPage()
      const aheadErrors = diagnostics(ahead)
      await ahead.goto(url)
      await expect(ahead.locator('#app')).toHaveAttribute('data-preserved', 'true')
      await expect(ahead.locator('#calendar-selected')).toHaveText('2024-02-15')
      await expect(ahead.locator('#calendar-heading')).toContainText('February 2024')
      expect(aheadErrors).toEqual([])
    } finally {
      await other.close()
    }
  } finally {
    await context.close()
  }
})

test('hydrated keyboard navigation crosses leap day without committing until activation', async ({
  page,
}) => {
  const errors = diagnostics(page)
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  const calendar = page.locator('#calendar-hydrated')
  await calendar.locator('button[data-date="2024-02-29"]').focus()
  await page.keyboard.press('ArrowRight')
  await expect(calendar.locator('button[data-date="2024-03-01"][tabindex="0"]')).toBeFocused()
  await expect(page.locator('#calendar-selected')).toHaveText('2024-02-15')
  await page.keyboard.press('Enter')
  await expect(page.locator('#calendar-selected')).toHaveText('2024-03-01')
  await page.keyboard.press('PageUp')
  await expect(calendar.locator('button[data-date="2024-02-01"][tabindex="0"]')).toBeFocused()
  expect(errors).toEqual([])
})

test('two-month range commits only after both endpoints and keeps one day tab stop', async ({
  page,
}) => {
  const errors = diagnostics(page)
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  const range = page.locator('#range-hydrated')
  await expect(range.getByRole('grid')).toHaveCount(2)
  await expect(range.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
  await range.locator('button[data-date="2024-02-20"]').first().click()
  await expect(page.locator('#calendar-range')).toHaveText('2024-02-12 / 2024-02-14')
  await range.locator('button[data-date="2024-03-05"]').last().click()
  await expect(page.locator('#calendar-range')).toHaveText('2024-02-20 / 2024-03-05')
  await expect(range.locator('button[data-date][tabindex="0"]')).toHaveCount(1)
  expect(errors).toEqual([])
})
