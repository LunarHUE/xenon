import { expect, test } from 'playwright/test'

for (const fixture of [
  {
    name: 'context menu',
    trigger: '#floating-context-trigger',
    content: '#floating-context',
    role: 'menuitem',
    item: 'Copy item',
    open: 'Shift+F10',
  },
  {
    name: 'menubar file menu',
    trigger: '#floating-file-trigger',
    content: '#floating-file',
    role: 'menuitem',
    item: 'New file',
    open: 'ArrowDown',
  },
  {
    name: 'menubar edit menu',
    trigger: '#floating-edit-trigger',
    content: '#floating-edit',
    role: 'menuitem',
    item: 'Undo edit',
    open: 'ArrowDown',
  },
  {
    name: 'tooltip',
    trigger: '#floating-tooltip-trigger',
    content: '#floating-tooltip',
    role: 'tooltip',
    item: 'Saves your changes',
    open: '',
  },
]) {
  test(`${fixture.name} retains its DOM node while native accessibility exposure follows open close reopen`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Native accessibility tree requires Chromium CDP')
    await page.goto('http://127.0.0.1:4174/?floating')
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    const content = page.locator(fixture.content)
    const trigger = page.locator(fixture.trigger)
    const retained = await content.elementHandle()
    expect(retained).not.toBeNull()
    await expect(content).toBeHidden()
    const session = await page.context().newCDPSession(page)
    const exposed = async () => {
      const { nodes } = await session.send('Accessibility.getFullAXTree')
      return nodes.filter(
        (node) =>
          !node.ignored && node.role?.value === fixture.role && node.name?.value === fixture.item
      ).length
    }
    try {
      expect(await exposed()).toBe(0)
      for (let cycle = 0; cycle < 2; cycle++) {
        await trigger.focus()
        if (fixture.open) await page.keyboard.press(fixture.open)
        await expect(content).toBeVisible()
        expect(await exposed()).toBe(1)
        expect(await content.evaluate((node, previous) => node === previous, retained)).toBe(true)
        await page.keyboard.press('Escape')
        await expect(content).toBeHidden()
        await expect(content).toHaveCount(1)
        expect(await exposed()).toBe(0)
        expect(await content.evaluate((node, previous) => node === previous, retained)).toBe(true)
        await expect(trigger).toBeFocused()
        // Native Tab must leave the trigger without entering its retained hidden content.
        await page.keyboard.press('Tab')
        expect(await content.evaluate((node) => node.contains(document.activeElement))).toBe(false)
      }
    } finally {
      await session.detach()
      await retained?.dispose()
    }
  })
}
