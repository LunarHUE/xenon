import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const errors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const messages: string[] = []
  errors.set(page, messages)
  page.on('pageerror', (error) => messages.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text())
  })
  await page.goto('/')
})

test.afterEach(async ({ page }) => {
  expect(errors.get(page), 'browser errors').toEqual([])
})

test('field labels, error descriptions and disabled propagation', async ({ page }) => {
  const field = page.locator('#field')
  const address = field.getByRole('textbox', { name: 'Work address' })
  await field.getByText('Work address', { exact: true }).click()
  await expect(address).toBeFocused()
  await expect(address).toHaveAttribute('required', '')
  await expect(address).toHaveAccessibleDescription('We only use it for receipts.')
  await address.fill('wrong')
  await expect(address).toHaveAttribute('aria-invalid', 'true')
  await expect(address).toHaveAccessibleDescription(
    'We only use it for receipts. That address is missing its @.'
  )
  await address.fill('person@example.com')
  await expect(address).not.toHaveAttribute('aria-invalid')
  await expect(field.getByText('That address is missing its @.')).toHaveCount(0)
  const terms = field.getByRole('checkbox', { name: 'Accept the terms' })
  await field.getByRole('button', { name: 'lock the field', exact: true }).click()
  await expect(terms).toBeDisabled()
  await field.getByRole('button', { name: 'unlock the field', exact: true }).click()
  await terms.check()
  await expect(terms).toBeChecked()
})

test('native validation blocks submit and reset restores form defaults', async ({ page }) => {
  const form = page.locator('#forms')
  const terms = form.getByRole('checkbox', { name: 'Accept the terms' })
  await form.getByRole('button', { name: 'submit', exact: true }).click()
  await expect(terms).toBeFocused()
  await expect(form.getByText('accepted', { exact: true })).toHaveCount(0)
  await terms.check()
  await form.getByRole('switch').check()
  await form.getByRole('button', { name: 'submit', exact: true }).click()
  await expect(form.getByText('accepted', { exact: true })).toBeVisible()
  await expect(form.getByText('weekly', { exact: true })).toBeVisible()
  await form.getByRole('button', { name: 'reset', exact: true }).click()
  await expect(terms).not.toBeChecked()
  await expect(form.getByRole('checkbox', { name: 'Weekly digest' })).toBeChecked()
  await expect(form.getByRole('switch')).not.toBeChecked()
  await expect(form.getByText('empty', { exact: true })).toBeVisible()
})

test('toggles activate from keyboard and group arrows only move focus', async ({ page }) => {
  const mute = page.getByRole('button', { name: 'Mute', exact: true })
  await mute.focus()
  await page.keyboard.press('Space')
  await expect(mute).toHaveAttribute('aria-pressed', 'true')
  const group = page.getByRole('group', { name: 'Alignment' })
  const left = group.getByRole('button', { name: 'left', exact: true })
  const center = group.getByRole('button', { name: 'center', exact: true })
  await left.focus()
  await page.keyboard.press('ArrowRight')
  await expect(center).toBeFocused()
  await expect(left).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Space')
  await expect(center).toHaveAttribute('aria-pressed', 'true')
  await expect(left).toHaveAttribute('aria-pressed', 'false')
  await page.keyboard.press('Space')
  await expect(center).toHaveAttribute('aria-pressed', 'false')
})

test('native radio navigation selects and skips disabled options', async ({ page }) => {
  const shipping = page.getByRole('radiogroup', { name: 'Shipping' })
  const standard = shipping.getByRole('radio', { name: 'Standard, four days' })
  const express = shipping.getByRole('radio', { name: 'Express, one day' })
  const pickup = shipping.getByRole('radio', { name: 'Pick up in store' })
  await standard.focus()
  await page.keyboard.press('ArrowRight')
  await expect(express).toBeFocused()
  await expect(express).toBeChecked()
  await page.keyboard.press('ArrowRight')
  await expect(pickup).toBeFocused()
  await expect(pickup).toBeChecked()
  await expect(express).not.toBeChecked()
})

test('manual tabs keep selection until activation and tab into panel content', async ({ page }) => {
  const stage = page.getByRole('tablist', { name: 'Stage' })
  const draft = stage.getByRole('tab', { name: 'draft', exact: true })
  const review = stage.getByRole('tab', { name: 'review', exact: true })
  const archived = stage.getByRole('tab', { name: 'archived', exact: true })
  await draft.focus()
  await page.keyboard.press('ArrowRight')
  await expect(review).toBeFocused()
  await expect(draft).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(archived).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(archived).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'archived', exact: true })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'A focusable child' })).toBeFocused()
})

test('collapsible opens and completes its CSS exit before unmounting', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Release notes', exact: true })
  const panel = page.locator('#collapsible .disclosure__panel').first()
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await expect(panel).toBeVisible()
  // Wait for entry to finish so closing starts from the expanded layout.
  await expect(panel).not.toHaveAttribute('data-starting-style')
  await panel.evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((animation) => animation.finished))
  })
  const panelId = await trigger.getAttribute('aria-controls')
  // Observe the real CSS transition, including its state at DOM removal.
  const exit = panel.evaluate(
    (el) =>
      new Promise<{ animated: boolean; finished: boolean }>((resolve) => {
        let animated = false
        let finished = false
        const observer = new MutationObserver(() => {
          if (!el.isConnected) {
            observer.disconnect()
            resolve({ animated, finished })
            return
          }
          if (!animated && el.hasAttribute('data-ending-style')) {
            const running = el
              .getAnimations()
              .filter((animation) => animation.playState !== 'finished')
            animated = running.length > 0
            if (animated)
              void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
                finished = true
              })
          }
        })
        observer.observe(el.parentElement!, { subtree: true, attributes: true, childList: true })
      })
  )
  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(await exit).toEqual({ animated: true, finished: true })
  await expect(page.locator(`[id="${panelId}"]`)).toHaveCount(0)
})

test('accordion arrows move between independently tabbable triggers', async ({ page }) => {
  const accordion = page.locator('#accordion')
  const returns = accordion.getByRole('button', { name: 'Returns', exact: true })
  const tracking = accordion.getByRole('button', { name: 'Tracking', exact: true })
  await returns.focus()
  await page.keyboard.press('ArrowDown')
  await expect(tracking).toBeFocused()
  await expect(returns).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Space')
  await expect(tracking).toHaveAttribute('aria-expanded', 'true')
  await expect(returns).toHaveAttribute('aria-expanded', 'false')
  await expect(accordion.getByRole('region', { name: 'Tracking' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(accordion.getByRole('button', { name: 'Damage', exact: true })).toBeFocused()
})

test('progress updates spoken values and separator semantics survive the build', async ({
  page,
}) => {
  const upload = page.getByRole('progressbar', { name: 'Upload' })
  await expect(upload).toHaveAttribute('aria-valuenow', '18')
  await page.locator('#progress').getByRole('button', { name: 'advance' }).click()
  await expect(upload).toHaveAttribute('aria-valuenow', '24')
  await expect(upload).toHaveAttribute('aria-valuetext', '24 of 48 files')
  await expect(upload).toHaveCSS('--progress-percentage', '50')
  await expect(page.getByRole('progressbar', { name: 'Reticulating' })).not.toHaveAttribute(
    'aria-valuenow'
  )
  const separators = page.locator('#separator').getByRole('separator')
  await expect(separators).toHaveCount(3)
  await expect(separators.nth(1)).toHaveAttribute('aria-orientation', 'vertical')
})

test('button.pointer.8: native middle clicks respect disabled links and CSS hit testing', async ({
  page,
  context,
}) => {
  const opened: Page[] = []
  context.on('page', (popup) => opened.push(popup))
  const before = page.url()
  const section = page.locator('#button')
  const link = section.getByRole('link', { name: 'a + href', exact: true })
  // Engines may open a tab or navigate this page. Both are native navigation.
  const navigation = Promise.any([
    context.waitForEvent('page').then(async (popup) => {
      await popup.waitForURL('**/#button')
      return 'popup'
    }),
    page.waitForURL('**/#button').then(() => 'same-page'),
  ])
  await link.click({ button: 'middle' })
  const destination = await navigation
  expect(opened).toHaveLength(destination === 'popup' ? 1 : 0)
  for (const popup of opened) await popup.close()
  opened.length = 0
  await page.goto(before)

  const disabled = section.getByText('disabled link', { exact: true })
  await expect(disabled).not.toHaveAttribute('href')
  await disabled.click({ button: 'middle', force: true })
  await expect(page).toHaveURL(before)

  await link.scrollIntoViewIfNeeded()
  await link.evaluate((element) => {
    ;(element as HTMLElement).style.pointerEvents = 'none'
  })
  const box = await link.boundingBox()
  if (!box) throw new Error('link has no rendered box')
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'middle' })
  await expect(page).toHaveURL(before)
  expect(opened).toHaveLength(0)
  await link.evaluate((element) => {
    ;(element as HTMLElement).style.removeProperty('pointer-events')
  })
})
