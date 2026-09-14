import { expect, test } from 'playwright/test'

for (const [section, triggerName, title] of [
  ['dialog', 'Edit display name', 'Make yourself known.'],
  ['alert-dialog', 'Archive project', 'Archive this project?'],
  ['drawer', 'Notification settings', 'Less noise. Your choice.'],
] as const) {
  test(`${section} preserves the example's sticky masthead and section layout`, async ({
    page,
  }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: triggerName, exact: true })
    await trigger.hover()
    await trigger.focus()
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    const geometry = () =>
      page.evaluate((id) => {
        const rect = (selector: string) => {
          const box = document.querySelector(selector)!.getBoundingClientRect()
          return { top: box.top, left: box.left, width: box.width }
        }
        const decoration = getComputedStyle(document.body, '::before')
        return {
          header: rect('.masthead'),
          rail: rect(`#${id} .section__rail`),
          scroll: window.scrollY,
          decoration: [decoration.position, decoration.backgroundImage, decoration.zIndex],
        }
      }, section)
    const before = await geometry()
    expect(before.header.top).toBe(0)
    const target = (await trigger.boundingBox())!
    // Keep the pointer at this viewport position; locator.click may scroll again.
    await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2)
    await expect(
      page.getByRole(section === 'alert-dialog' ? 'alertdialog' : 'dialog', { name: title })
    ).toBeVisible()
    expect(await geometry()).toEqual(before)
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    expect(await geometry()).toEqual(before)
  })
}
