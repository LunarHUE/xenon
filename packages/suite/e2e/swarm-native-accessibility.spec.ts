import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const origin = 'http://127.0.0.1:4174/'

async function descriptionReferences(page: Page, name: string, expected: string[]) {
  const control = page.getByRole('textbox', { name, exact: true })
  const references = await control.evaluate((node) =>
    (node.getAttribute('aria-describedby') ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => {
        const target = document.getElementById(id)
        return {
          id,
          connected: target?.isConnected ?? false,
          text: target?.textContent?.trim() ?? '',
        }
      })
  )
  expect(references.map(({ text }) => text)).toEqual(expected)
  expect(references.every(({ connected }) => connected)).toBe(true)
  expect(new Set(references.map(({ id }) => id)).size).toBe(references.length)
  await expect(control).toHaveAccessibleDescription(expected.join(' '))
}

for (const [name, query] of [
  ['string', ''],
  ['stream', '?stream'],
  ['async stream', '?stream&async'],
] as const) {
  test(`every description token resolves in order before and after ${name} hydration`, async ({
    browser,
    page,
  }) => {
    const server = await browser.newContext({ javaScriptEnabled: false })
    try {
      const initial = await server.newPage()
      expect((await initial.goto(origin + query))?.ok()).toBe(true)
      await page.goto(origin + query)
      await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
      for (const document of [initial, page]) {
        await descriptionReferences(document, 'Wrapped control', [
          'Author help',
          'First help',
          'Second help',
          'Required value',
        ])
        await descriptionReferences(document, 'Inner control', ['Inner help'])
        await descriptionReferences(document, 'Custom merged description', [
          'Author help',
          'Field help',
          'Custom host help',
        ])
        await descriptionReferences(document, 'Email', ['Work address', 'Required'])
        await descriptionReferences(document, 'Notes', ['Extra notes'])
        if (query.includes('async'))
          await descriptionReferences(document, 'Streaming control', ['Streaming help'])
      }
    } finally {
      await server.close()
    }
  })
}

test('Chromium accessibility tree exposes adopted field names, descriptions and checked states', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'CDP accessibility tree requires Chromium')
  await page.goto(origin)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  const session = await page.context().newCDPSession(page)
  try {
    const tree = (await session.send('Accessibility.getFullAXTree')).nodes
    const named = (role: string, name: string) =>
      tree.filter((node) => !node.ignored && node.role?.value === role && node.name?.value === name)
    expect(named('textbox', 'Email')).toHaveLength(1)
    expect(named('textbox', 'Email')[0]?.description?.value).toBe('Work address Required')
    expect(named('checkbox', 'Accept terms')).toHaveLength(1)
    expect(named('checkbox', 'Accept terms')[0]?.properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'checked',
          value: expect.objectContaining({ value: 'true' }),
        }),
      ])
    )
    expect(named('tab', 'Chosen controlled page')).toHaveLength(1)
    expect(named('tab', 'Chosen controlled page')[0]?.properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'selected',
          value: expect.objectContaining({ value: true }),
        }),
      ])
    )
    expect(named('tabpanel', 'Chosen controlled page')).toHaveLength(1)
    expect(named('tabpanel', 'Other controlled page')).toHaveLength(0)
  } finally {
    await session.detach()
  }
})

test('retained floating descendants leave the native accessibility tree when closed', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'CDP accessibility tree requires Chromium')
  await page.goto(origin + '?floating')
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  const session = await page.context().newCDPSession(page)
  async function exposedLinks() {
    const { nodes } = await session.send('Accessibility.getFullAXTree')
    return nodes
      .filter((node) => !node.ignored && node.role?.value === 'link')
      .map((node) => node.name?.value)
  }
  try {
    const trigger = page.getByRole('link', { name: 'Profile preview', exact: true })
    await expect(page.locator('#floating-card')).toHaveCount(1)
    await expect(page.locator('#floating-card')).toBeHidden()
    expect(await exposedLinks()).not.toContain('View full profile')
    await trigger.focus()
    await expect(page.getByRole('link', { name: 'View full profile' })).toBeVisible()
    expect(await exposedLinks()).toContain('View full profile')
    await page.keyboard.press('Escape')
    await expect(page.locator('#floating-card')).toBeHidden()
    await expect(page.locator('#floating-card')).toHaveCount(1)
    expect(await exposedLinks()).not.toContain('View full profile')
    await expect(trigger).toBeFocused()
  } finally {
    await session.detach()
  }
})
