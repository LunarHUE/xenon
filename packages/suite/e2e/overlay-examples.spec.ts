import { expect, test } from 'playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('example dialog edits a name and restores focus through a nested dialog', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Edit display name', exact: true })
  await trigger.click()
  const name = page.getByRole('textbox', { name: 'Display name', exact: true })
  await expect(name).toBeFocused()
  await name.fill('Robin Lee')
  const guidelines = page.getByRole('button', { name: 'Naming guidelines' })
  await guidelines.click()
  await expect(page.getByRole('dialog', { name: 'A name people recognize.' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(guidelines).toBeFocused()
  await page.getByRole('button', { name: 'Done editing', exact: true }).click()
  await expect(trigger).toBeFocused()
  await expect(page.locator('#dialog .readout')).toContainText('Robin Lee')
})

test('example alert defaults to Cancel and the archive action can be reset', async ({ page }) => {
  await page.getByRole('button', { name: 'Archive project', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Keep project' })).toBeFocused()
  await page.getByRole('button', { name: 'Confirm archive' }).click()
  const restore = page.getByRole('button', { name: 'Restore project' })
  await expect(restore).toBeFocused()
  await expect(page.locator('#alert-dialog .readout')).toContainText('archived')
  await restore.click()
  await expect(page.getByRole('button', { name: 'Archive project', exact: true })).toBeEnabled()
})

test('example drawer keeps its preference and closes through its handle', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Notification settings', exact: true })
  await trigger.click()
  await page.getByRole('checkbox', { name: 'Send a weekly digest' }).uncheck()
  const handle = page.getByRole('button', { name: 'Close notification settings' })
  const bounds = (await handle.boundingBox())!
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 130, {
    steps: 8,
  })
  await page.mouse.up()
  await expect(trigger).toBeFocused()
  await expect(page.locator('#drawer .readout')).toContainText('off')
})

test('example popover edits its note and remains within a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Edit note', exact: true }).click()
  const content = page.getByRole('dialog', { name: 'A note for later.' })
  await expect(content).toBeVisible()
  await page.getByRole('textbox', { name: 'Note', exact: true }).fill('Bring a pencil.')
  const bounds = (await content.boundingBox())!
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390)
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('popover-mobile.png'),
  })
  await page.getByRole('button', { name: 'Done with note' }).click()
  await expect(page.locator('#popover .readout')).toContainText('Bring a pencil.')
})

test('example menu retains choices and exports through the keyboard submenu', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Project actions', exact: true })
  await trigger.click()
  await page.getByRole('menuitemcheckbox', { name: 'Show details' }).click()
  await expect(page.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  await page.getByRole('menuitemradio', { name: 'Compact', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Export', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'PDF document' })).toBeFocused()
  await page.screenshot({
    animations: 'disabled',
    path: test.info().outputPath('menu-desktop.png'),
  })
  await page.keyboard.press('Enter')
  await expect(trigger).toBeFocused()
  await expect(page.locator('#menu .readout')).toContainText('PDF export selected')
  await expect(page.locator('#menu .readout')).toContainText('compact')
})
