import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?utilityCoverage'
const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
)

function captureErrors(page: import('playwright/test').Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text())
  })
  return errors
}

test('utility SSR markup preserves Avatar fallback, Meter semantics and textarea associations before hydration', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    const response = await page.goto(url)
    expect(response?.ok()).toBe(true)
    await expect(page.locator('#app')).not.toHaveAttribute('data-hydrated', 'true')
    await expect(page.getByText('No image avatar', { exact: true })).toBeVisible()
    await expect(page.getByText('Avatar fallback', { exact: true })).toBeVisible()
    await expect(page.getByRole('img')).toHaveCount(0)
    await expect(page.getByRole('meter', { name: 'Utility meter' })).toHaveAttribute(
      'aria-valuenow',
      '40'
    )
    await expect(page.getByRole('textbox', { name: 'Utility notes' })).toHaveAccessibleDescription(
      'Hydrated textarea help'
    )
  } finally {
    await context.close()
  }
})

test('utility hydration preserves DOM and loads Avatar only when referrer policy permits', async ({
  page,
}) => {
  const errors = captureErrors(page)
  const referers: (string | undefined)[] = []
  let releaseImage!: () => void
  const imageGate = new Promise<void>((resolve) => {
    releaseImage = resolve
  })
  await page.route('**/utility-avatar.png', async (route) => {
    referers.push(route.request().headers().referer)
    await imageGate
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: pixel,
    })
  })
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  const root = page.locator('#app')
  await expect(root).toHaveAttribute('data-hydrated', 'true')
  await expect(root).toHaveAttribute('data-preserved', 'true')
  await expect(page.getByText('No image avatar', { exact: true })).toBeVisible()
  await expect(page.getByText('Avatar fallback', { exact: true })).toBeVisible()
  await expect(page.getByRole('img')).toHaveCount(0)
  releaseImage()
  await expect(page.getByRole('img', { name: 'Hydrated avatar' })).toBeVisible()
  await expect(page.getByText('Avatar fallback', { exact: true })).toHaveCount(0)
  await expect(page.getByText('No image avatar', { exact: true })).toBeVisible()
  await expect(page.getByRole('meter', { name: 'Utility meter' })).toHaveAttribute(
    'aria-valuenow',
    '40'
  )
  await expect(page.getByRole('textbox', { name: 'Utility notes' })).toHaveAccessibleDescription(
    'Hydrated textarea help'
  )
  expect(referers.length).toBeGreaterThanOrEqual(1)
  expect(referers.every((referer) => referer === undefined)).toBe(true)
  await expect(page.getByRole('img', { name: 'Hydrated avatar' })).toHaveAttribute(
    'referrerpolicy',
    'no-referrer'
  )
  expect(
    await root.evaluate((element) => {
      const serverIds = JSON.parse(element.getAttribute('data-server-ids') ?? '[]') as string[]
      const ids = [...element.querySelectorAll('[id]')].map((node) => node.id)
      return JSON.stringify(ids) === JSON.stringify(serverIds)
    })
  ).toBe(true)
  expect(errors).toEqual([])
})

test('utility hydration keeps Avatar fallback when a referrer-dependent request is rejected', async ({
  page,
}) => {
  const referers: (string | undefined)[] = []
  await page.route('**/utility-avatar.png', async (route) => {
    const referer = route.request().headers().referer
    referers.push(referer)
    await route.fulfill({
      status: referer ? 403 : 200,
      contentType: 'image/png',
      body: referer ? '' : pixel,
    })
  })
  await page.goto(`${url}&avatarPolicy=origin`)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(
    page.getByRole('region', { name: 'Avatar hydration' }).locator('[data-state="error"]').first()
  ).toBeVisible()
  await expect(page.getByText('Avatar fallback', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Hydrated avatar' })).toHaveCount(0)
  expect(referers.length).toBeGreaterThanOrEqual(1)
  expect(referers.every((referer) => referer?.startsWith('http://127.0.0.1:4174/'))).toBe(true)
})
