import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

/** Runtime exceptions must not be hidden by successful individual interactions. */
const errors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', (error) => messages.push(error.message))
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'uncaught browser exceptions').toEqual([])
})

test('avatar fallback recovers, hidden names remain actionable, and artwork names its bookmark', async ({
  page,
}) => {
  const avatar = page.locator('#avatar')
  const person = avatar.getByRole('img', { name: 'Ada Lovelace' })
  await expect(person).toHaveJSProperty('tagName', 'IMG')
  await avatar.getByRole('button', { name: 'Use broken image' }).click()
  await expect(avatar.locator('.utility-avatar')).toHaveAttribute('data-state', 'error')
  await expect(person).toHaveCount(1)
  await expect(person).toHaveText('AL')
  await avatar.getByRole('button', { name: 'Restore image' }).click()
  await expect(person).toHaveJSProperty('tagName', 'IMG')
  await expect(avatar.locator('.utility-avatar')).toHaveAttribute('data-state', 'loaded')

  const hidden = page.locator('#visually-hidden')
  const save = hidden.getByRole('button', { name: 'Save note', exact: true })
  const skip = hidden.getByRole('link', { name: 'Skip to saved note ↓' })
  await save.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(skip).toBeFocused()
  await expect(skip).toHaveCSS('clip-path', 'none')
  await page.keyboard.press('Tab')
  await expect(save).toBeFocused()
  await expect(skip).toHaveCSS('clip-path', 'inset(50%)')
  await page.keyboard.press('Enter')
  await expect(hidden.getByRole('status')).toHaveText('The note is saved.')
  await expect(hidden.getByRole('button', { name: 'Remove saved note' })).toBeFocused()
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#hidden-study-result$/)

  const icon = page.locator('#accessible-icon')
  const bookmark = icon.getByRole('button', { name: 'Bookmark reference' })
  await expect(icon.getByRole('img', { name: 'Bookmark reference' })).toHaveCount(1)
  await bookmark.click()
  await expect(bookmark).toHaveAttribute('aria-pressed', 'true')
  await expect(icon.getByRole('status')).toHaveText('Reference bookmarked')
  await bookmark.focus()
  await page.keyboard.press('Space')
  await expect(bookmark).toHaveAttribute('aria-pressed', 'false')
})

test('measurement changes, pagination renders its selected slice, and breadcrumbs navigate', async ({
  page,
}) => {
  const measurement = page.locator('#meter')
  const meter = measurement.getByRole('meter', { name: 'Archive shelf occupancy' })
  await expect(meter).toHaveAttribute('aria-valuenow', '6')
  await measurement.getByRole('button', { name: 'Add a box' }).click()
  await expect(meter).toHaveAttribute('aria-valuenow', '7')
  await expect(meter).toHaveAttribute('aria-valuetext', '7 of 12 spaces occupied')
  await measurement.getByRole('button', { name: 'Remove a box' }).click()
  await expect(meter).toHaveAttribute('aria-valuenow', '6')

  const pages = page.locator('#pagination')
  const navigation = pages.getByRole('navigation', { name: 'Correspondence pages' })
  await navigation.getByRole('button', { name: 'Page 12', exact: true }).click()
  await expect(pages.getByRole('status')).toHaveText('Page 12 of 12')
  await expect(pages.getByRole('listitem').first()).toContainText('Letter 34')
  await expect(pages.getByRole('listitem').last()).toContainText('Letter 36')
  await expect(navigation.getByRole('button', { name: 'Page 12', exact: true })).toHaveAttribute(
    'aria-current',
    'page'
  )
  await expect(navigation.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled()
  await navigation.getByRole('button', { name: 'Page 1', exact: true }).click()
  await expect(pages.getByRole('listitem').first()).toContainText('Letter 01')
  await expect(
    navigation.getByRole('button', { name: 'Previous page', exact: true })
  ).toBeDisabled()

  const trail = page
    .locator('#breadcrumbs')
    .getByRole('navigation', { name: 'Behavior sheet location' })
  await expect(trail.getByRole('listitem')).toHaveCount(3)
  await expect(trail.locator('[aria-current="page"]')).toHaveText('Breadcrumbs')
  await trail.getByRole('link', { name: 'Utilities', exact: true }).click()
  await expect(page).toHaveURL(/#avatar$/)
})

test('native viewport and custom tracks share scroll position while the divider supports keys and dragging', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  const ledger = page.locator('#scroll-area')
  const viewport = ledger.getByRole('region', { name: 'Materials ledger' })
  await viewport.focus()
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  const vertical = ledger.getByRole('scrollbar', { name: 'Scroll ledger vertically' })
  await vertical.focus()
  await page.keyboard.press('End')
  await expect(vertical).toHaveAttribute('aria-valuenow', '100')
  await expect
    .poll(() =>
      viewport.evaluate((node) => Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop))
    )
    .toBeLessThanOrEqual(1)
  await page.keyboard.press('Home')
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBe(0)
  const horizontal = ledger.getByRole('scrollbar', { name: 'Scroll ledger horizontally' })
  await horizontal.focus()
  await page.keyboard.press('End')
  await expect(horizontal).toHaveAttribute('aria-valuenow', '100')
  await expect.poll(() => viewport.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0)

  const layout = page.locator('#resizable')
  const divider = layout.getByRole('separator', { name: 'Letter index' })
  await divider.focus()
  await expect(divider).toHaveAttribute('aria-valuenow', '35')
  await page.keyboard.press('ArrowRight')
  await expect(divider).toHaveAttribute('aria-valuenow', '36')
  await page.keyboard.press('Shift+ArrowRight')
  await expect(divider).toHaveAttribute('aria-valuenow', '46')
  await divider.scrollIntoViewIfNeeded()
  const box = await divider.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  await page.mouse.move(box!.x + box!.width / 2 + 40, box!.y + box!.height / 2, { steps: 5 })
  await page.mouse.up()
  await expect
    .poll(async () => Number(await divider.getAttribute('aria-valuenow')))
    .toBeGreaterThan(46)
  await layout.getByRole('button', { name: 'Reset split' }).click()
  await expect(divider).toHaveAttribute('aria-valuenow', '35')
})

test('all eight utility studies fit a 390px viewport while ledger overflow stays local', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  for (const id of [
    'avatar',
    'visually-hidden',
    'accessible-icon',
    'meter',
    'pagination',
    'breadcrumbs',
    'scroll-area',
    'resizable',
  ]) {
    const section = page.locator(`#${id}`)
    await section.scrollIntoViewIfNeeded()
    const box = await section.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(-1)
    expect(box!.x + box!.width).toBeLessThanOrEqual(391)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(1)
  }
  const viewport = page.locator('#scroll-area').getByRole('region', { name: 'Materials ledger' })
  expect(await viewport.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true)
  await page.locator('#pagination').getByRole('button', { name: 'Page 12', exact: true }).click()
  await expect(page.locator('#pagination').getByRole('status')).toHaveText('Page 12 of 12')
})
