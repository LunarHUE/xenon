import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const url = 'http://127.0.0.1:4174'

/**
 * Checks native/generic button host attributes and link semantics in the shared fixture.
 * Requires an already-loaded RoundOne fixture containing the Button host matrix region.
 * Works on JavaScript-disabled server markup or after hydration; the caller owns
 * navigation, hydration readiness, and page/context cleanup. Performs no interaction
 * and does not itself prove DOM preservation across hydration.
 */
async function expectButtonHosts(page: Page) {
  const matrix = page.getByRole('region', { name: 'Button host matrix' })
  for (const [name, type] of [
    ['Default native', 'button'],
    ['Native submit', 'submit'],
    ['Native reset', 'reset'],
  ]) {
    await expect(matrix.getByRole('button', { name, exact: true })).toHaveAttribute('type', type!)
  }
  await expect(
    matrix.getByRole('button', { name: 'Disabled native', exact: true })
  ).toHaveAttribute('disabled', '')
  await expect(
    matrix.getByRole('button', { name: 'Disabled generic', exact: true })
  ).toHaveAttribute('aria-disabled', 'true')
  await expect(matrix.getByRole('button', { name: 'Generic action', exact: true })).toHaveAttribute(
    'tabindex',
    '0'
  )
  await expect(matrix.getByRole('button', { name: 'Input action', exact: true })).toHaveAttribute(
    'type',
    'button'
  )
  await expect(matrix.getByRole('link', { name: 'Native link', exact: true })).toHaveAttribute(
    'href',
    '#server-target'
  )
}

test('button.ssr.2: native and generic disabled semantics exist before hydration', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expectButtonHosts(page)
  } finally {
    await context.close()
  }
})

test('button.ssr.1: native types and adopted generic semantics survive hydration', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  await expectButtonHosts(page)
  expect(errors).toEqual([])
})

test('button.ssr.3: the public Button export renders text on the server', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expect(page.getByRole('button', { name: 'Default native', exact: true })).toBeVisible()
  } finally {
    await context.close()
  }
})

test('checkbox.ssr.4: Checkbox renders checked on the server', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expect(page.getByRole('checkbox', { name: 'Accept terms', exact: true })).toBeChecked()
  } finally {
    await context.close()
  }
})

test('switch.ssr.1: Switch renders its state on the server', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    const control = page.getByRole('switch', { name: 'Alerts', exact: true })
    await expect(control).toBeVisible()
    await expect(control).not.toBeChecked()
  } finally {
    await context.close()
  }
})

test('checkbox.ssr.1: author ID and label association already agree on the server', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const server = await context.newPage()
    await server.goto(url)
    await expect(server.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expect(
      server.getByRole('checkbox', { name: 'Explicit server checkbox' })
    ).toHaveAttribute('id', 'server-checkbox')
    await expect(server.getByText('Explicit server checkbox', { exact: true })).toHaveAttribute(
      'for',
      'server-checkbox'
    )
    await page.goto(url)
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(page.getByText('Explicit server checkbox', { exact: true })).toHaveAttribute(
      'for',
      'server-checkbox'
    )
    await expect(page.getByRole('checkbox', { name: 'Explicit server checkbox' })).toHaveAttribute(
      'id',
      'server-checkbox'
    )
    await page.getByText('Explicit server checkbox', { exact: true }).click()
    await expect(page.getByRole('checkbox', { name: 'Explicit server checkbox' })).not.toBeChecked()
  } finally {
    await context.close()
  }
})

test('toolbar.ssr.1: native items remain reachable in document order without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto(url)
    await page.getByRole('button', { name: 'Before toolbars', exact: true }).focus()
    for (const [role, name] of [
      ['button', 'First action'],
      ['link', 'First link'],
      ['button', 'Second action'],
      ['button', 'Last action'],
      ['button', 'After toolbars'],
    ] as const) {
      await page.keyboard.press('Tab')
      await expect(page.getByRole(role, { name, exact: true })).toBeFocused()
    }
  } finally {
    await context.close()
  }
})

test('composite.ssr.2: hydrated roving toolbars each contribute one tab stop', async ({ page }) => {
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await page.getByRole('button', { name: 'Before toolbars', exact: true }).focus()
  for (const name of ['First action', 'Second action', 'After toolbars']) {
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name, exact: true })).toBeFocused()
  }
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('button', { name: 'Last action', exact: true })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'After toolbars', exact: true })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Last action', exact: true })).toBeFocused()
})
