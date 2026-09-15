import { expect, test } from 'playwright/test'
const url = 'http://127.0.0.1:4174'

test('numeric server markup retains custom associations and canonical form values before hydration', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(url)
  const fixture = page.locator('#numeric-fixture')
  await expect(fixture.getByRole('spinbutton', { name: 'Server amount' })).toHaveValue('2,5')
  await expect(fixture.getByRole('button', { name: 'Increase' })).toHaveAttribute(
    'aria-controls',
    'server-number-input'
  )
  await expect(fixture.locator('label').filter({ hasText: 'Server verification' })).toHaveAttribute(
    'for',
    'server-pin-input'
  )
  await expect(fixture.locator('#server-pin-input')).toHaveAccessibleDescription(
    'Enter the received code'
  )
  await expect(fixture.getByRole('slider', { name: 'Server volume' })).toHaveValue('25')
  await expect(fixture.locator('#server-slider-thumb')).toHaveCSS('--slider-thumb-position', '25%')
  await expect(fixture.locator('#server-slider-range')).toHaveCSS('--slider-range-start', '0%')
  await expect(fixture.locator('#server-slider-range')).toHaveCSS('--slider-range-end', '25%')
  const serverGeometry = await fixture.locator('#server-slider-range').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { left: rect.left, width: rect.width }
  })
  expect(serverGeometry.width).toBe(75)
  await context.close()
})

test('numeric SSR emits PinInput proxy validity that works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(url)

  const fixture = page.locator('#numeric-fixture')
  const proxy = fixture.locator('input[aria-hidden="true"][name="otp"]')
  await expect(proxy).toHaveAttribute('pattern', '.{2}')
  await expect(proxy).toHaveAttribute('required', '')
  await expect(proxy).toHaveAttribute('tabindex', '-1')

  const validity = await proxy.evaluate((element) => {
    const input = element as HTMLInputElement
    const initial = input.checkValidity()
    input.value = '1'
    const incomplete = {
      valid: input.checkValidity(),
      patternMismatch: input.validity.patternMismatch,
      valueMissing: input.validity.valueMissing,
    }
    input.value = ''
    const empty = {
      valid: input.checkValidity(),
      patternMismatch: input.validity.patternMismatch,
      valueMissing: input.validity.valueMissing,
    }
    input.value = '12'
    const complete = input.checkValidity()
    return { initial, incomplete, empty, complete }
  })
  expect(validity).toEqual({
    initial: true,
    incomplete: { valid: false, patternMismatch: true, valueMissing: false },
    empty: { valid: false, patternMismatch: false, valueMissing: true },
    complete: true,
  })
  await context.close()
})

test('numeric and text-entry SSR hydrate without replacing nodes and remain editable', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  const serverGeometry = JSON.parse(
    (await page.locator('#app').getAttribute('data-slider-geometry')) as string
  ) as Array<{ selector: string; left: number; top: number; width: number; height: number }>
  const fixture = page.locator('#numeric-fixture')
  const thumb = fixture.locator('#server-slider-thumb')
  const range = fixture.locator('#server-slider-range')
  await expect(thumb).toHaveCSS('--slider-thumb-position', '25%')
  await expect(range).toHaveCSS('--slider-range-end', '25%')
  const hydratedGeometry = await range.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return { left: rect.left, width: rect.width }
  })
  expect(hydratedGeometry.width).toBe(75)
  const currentGeometry = await fixture.evaluate((root) =>
    ['#server-slider-thumb', '#server-slider-range'].map((selector) => {
      const element = root.querySelector(selector)!
      const rect = element.getBoundingClientRect()
      return { selector, left: rect.left, top: rect.top, width: rect.width, height: rect.height }
    })
  )
  expect(currentGeometry).toEqual(serverGeometry)
  const amount = fixture.getByRole('spinbutton', { name: 'Server amount' })
  await amount.press('ArrowUp')
  await expect(amount).toHaveValue('3')
  await fixture.locator('#server-pin-input').fill('9')
  await expect(fixture.locator('#server-pin-input')).toHaveValue('9')
  const slider = fixture.getByRole('slider', { name: 'Server volume' })
  await slider.press('ArrowRight')
  await expect(slider).toHaveValue('26')
  await expect(thumb).toHaveCSS('--slider-thumb-position', '26%')
  await expect(range).toHaveCSS('--slider-range-end', '26%')
  await fixture.getByRole('textbox', { name: 'Server labels' }).fill('beta')
  await fixture.getByRole('textbox', { name: 'Server labels' }).press('Enter')
  await fixture.getByRole('button', { name: 'Edit server title' }).click()
  await fixture.getByRole('textbox', { name: 'Server title label' }).fill('Updated title')
  await fixture.getByRole('button', { name: 'Save server title' }).click()
  expect(
    await fixture.locator('form').evaluate((form) => [...new FormData(form as HTMLFormElement)])
  ).toEqual([
    ['amount', '3'],
    ['otp', '92'],
    ['volume', '26'],
    ['labels', 'alpha'],
    ['labels', 'beta'],
    ['title', 'Updated title'],
  ])
  expect(errors).toEqual([])
})
