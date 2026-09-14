import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const url = 'http://127.0.0.1:4174'

async function expectInitialDisclosureAndTabs(page: Page) {
  const chosen = page.getByRole('tab', { name: 'Chosen controlled page', exact: true })
  const panel = page.getByRole('tabpanel', { name: 'Chosen controlled page', exact: true })
  await expect(chosen).toHaveAttribute('aria-selected', 'true')
  await expect(panel).toBeVisible()
  await expect(page.getByText('Other controlled content', { exact: true })).toHaveAttribute(
    'hidden',
    ''
  )
  const tabId = await chosen.getAttribute('id')
  const panelId = await panel.getAttribute('id')
  expect(tabId).toMatch(/-tab-\d+$/)
  expect(panelId).toMatch(/-panel-\d+$/)
  expect(tabId?.replace(/-tab-\d+$/, '')).toBe(panelId?.replace(/-panel-\d+$/, ''))
  await expect(chosen).toHaveAttribute('aria-controls', panelId as string)
  await expect(panel).toHaveAttribute('aria-labelledby', tabId as string)
  await expect(page.getByRole('button', { name: 'Initially closed', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false'
  )
  await expect(page.getByText('Initially closed content', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Retained closed', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false'
  )
  const retained = page.getByText('Retained closed content', { exact: true })
  await expect(retained).toHaveCount(1)
  await expect(retained).toHaveAttribute('hidden', '')
  await expect(retained).toHaveAttribute('data-state', 'closed')
  await expect(page.getByRole('button', { name: 'Retained closed', exact: true })).toHaveAttribute(
    'aria-controls',
    (await retained.getAttribute('id')) as string
  )
  await expect(page.getByRole('tab', { name: 'Blocked page', exact: true })).toHaveAttribute(
    'aria-selected',
    'false'
  )
  await expect(page.getByRole('tab', { name: 'Automatic page', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.getByRole('tab', { name: 'Alternative page', exact: true })).toHaveAttribute(
    'aria-selected',
    'false'
  )
  await expect(page.getByRole('tabpanel', { name: 'Automatic page', exact: true })).toBeVisible()
  await expect(page.getByText('Blocked content', { exact: true })).toHaveAttribute('hidden', '')
  await expect(page.getByText('Alternative content', { exact: true })).toHaveAttribute('hidden', '')
}

test('round-one server markup hydrates without replacing DOM or IDs', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  const root = page.locator('#app')
  await expect(root).toHaveAttribute('data-hydrated', 'true')
  await expect(root).toHaveAttribute('data-preserved', 'true')
  await expectInitialDisclosureAndTabs(page)
  expect(
    await root.evaluate((element) => {
      const serverIds = JSON.parse(element.getAttribute('data-server-ids') ?? '[]') as string[]
      const ids = [...element.querySelectorAll('[id]')].map((node) => node.id)
      return {
        same: JSON.stringify(ids) === JSON.stringify(serverIds),
        unique: new Set(ids).size === ids.length,
      }
    })
  ).toEqual({ same: true, unique: true })
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
    'Work address Required'
  )
  await expect(page.getByRole('textbox', { name: 'Notes' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
    'Extra notes'
  )
  await expect(page.getByRole('checkbox', { name: 'Accept terms' })).toBeChecked()
  await expect(page.getByRole('progressbar', { name: 'Loading' })).toHaveAttribute(
    'aria-valuenow',
    '40'
  )
  await expect(
    page.getByRole('textbox', { name: 'Nested', exact: true })
  ).toHaveAccessibleDescription('Nested help')
  expect(errors).toEqual([])
})

test('hydrated controls retain interaction and association', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await page.getByRole('button', { name: 'Count 0' }).click()
  await expect(page.getByRole('button', { name: 'Count 1' })).toBeVisible()
  await page.getByText('Accept terms', { exact: true }).click()
  await expect(page.getByRole('checkbox', { name: 'Accept terms' })).not.toBeChecked()
  await page.getByRole('switch', { name: 'Alerts' }).click()
  await expect(page.getByRole('switch', { name: 'Alerts' })).toBeChecked()
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await page.getByRole('button', { name: 'Right', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await page.getByRole('radio', { name: 'Two', exact: true }).check()
  await expect(page.getByRole('radio', { name: 'Two', exact: true })).toBeChecked()
  await page.getByRole('tab', { name: 'Second' }).click()
  await expect(page.getByRole('tabpanel', { name: 'Second' })).toBeVisible()
  await page.getByRole('button', { name: 'Initially closed', exact: true }).click()
  await expect(page.getByText('Initially closed content', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Retained closed', exact: true }).click()
  await expect(page.getByText('Retained closed content', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Alternative page', exact: true }).click()
  await expect(page.getByRole('tabpanel', { name: 'Alternative page', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Details', exact: true }).click()
  await expect(page.getByText('Details content')).toHaveCount(0)
  await page.getByRole('button', { name: 'Section', exact: true }).click()
  await expect(page.getByText('Section content')).toHaveCount(0)
  await page.getByRole('button', { name: 'Copy', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Paste', exact: true })).toBeFocused()
  expect(errors).toEqual([])
})

test('server response exposes field, tab and checked semantics before JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto(url)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expectInitialDisclosureAndTabs(page)
    await expect(page.getByText('Details content', { exact: true })).not.toHaveAttribute(
      'style',
      /--collapsible-panel-(height|width)/
    )
    await expect(page.getByText('Section content', { exact: true })).not.toHaveAttribute(
      'style',
      /--accordion-panel-(height|width)/
    )
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Work address Required'
    )
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    await expect(page.getByRole('textbox', { name: 'Notes' })).toHaveAccessibleDescription(
      'Extra notes'
    )
    await expect(page.getByRole('checkbox', { name: 'Accept terms' })).toBeChecked()
    await expect(page.getByRole('switch', { name: 'Alerts' })).not.toBeChecked()
    await expect(page.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('tabpanel', { name: 'First' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Section', exact: true })).toHaveAttribute(
      'aria-controls',
      /.+/
    )
    await expect(page.getByRole('progressbar', { name: 'Loading' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    )
    await expect(page.getByRole('separator')).toHaveCount(1)
    await expect(
      page.getByRole('textbox', { name: 'Explicit nested', exact: true })
    ).toHaveAccessibleDescription('Explicit nested help')
    await expect(page.getByRole('button', { name: 'Bold', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    await expect(page.getByRole('button', { name: 'Left', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(page.getByRole('radio', { name: 'One', exact: true })).toBeChecked()
  } finally {
    await context.close()
  }
})

test('a server control nested in a native wrapper references a later description', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    const control = page.getByRole('textbox', { name: 'Nested', exact: true })
    await expect(control).toBeVisible()
    await expect(page.getByText('Nested help', { exact: true })).toBeVisible()
    await expect(control).toHaveAccessibleDescription('Nested help')
  } finally {
    await context.close()
  }
})
