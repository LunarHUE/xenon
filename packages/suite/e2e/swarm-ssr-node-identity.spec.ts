import { expect, test } from 'playwright/test'
import type { Page } from 'playwright/test'

const origin = 'http://127.0.0.1:4174/'

/** Pause only the application entry so assertions inspect this document's server DOM. */
async function pauseHydration(page: Page) {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(/\/fixtures\/entry-client\.tsx(?:\?|$)/, async (route) => {
    await gate
    await route.continue()
  })
  return release
}

function diagnostics(page: Page) {
  const messages: string[] = []
  page.on('pageerror', (error) => messages.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') messages.push(message.text())
  })
  return messages
}

for (const [name, query] of [
  ['string fields, tabs and controls', ''],
  ['stream fields, tabs and controls', '?stream'],
  ['async stream field registration', '?stream&async'],
  ['accordion and mixed-host checkbox group', '?groupSsr'],
  ['retained floating content', '?floating'],
] as const) {
  test(`same-document hydration preserves ID owners and associations: ${name}`, async ({
    page,
  }) => {
    const messages = diagnostics(page)
    const release = await pauseHydration(page)
    try {
      expect((await page.goto(origin + query, { waitUntil: 'commit' }))?.ok()).toBe(true)
      const root = page.locator('#app')
      // The entry script is last in the document, after every server-rendered part.
      await expect(page.locator('script[src="/fixtures/entry-client.tsx"]')).toHaveCount(1)
      await expect(root).not.toHaveAttribute('data-hydrated', 'true')
      const original = await root.evaluateHandle((element) =>
        [...element.querySelectorAll('[id]')].map((node) => ({
          node,
          id: node.id,
          labelledBy: node.getAttribute('aria-labelledby'),
          describedBy: node.getAttribute('aria-describedby'),
        }))
      )
      try {
        expect(await original.evaluate((entries) => entries.length)).toBeGreaterThan(5)
        expect(
          await original.evaluate((entries) => new Set(entries.map(({ id }) => id)).size)
        ).toBe(await original.evaluate((entries) => entries.length))
        release()
        await expect(root).toHaveAttribute('data-hydrated', 'true')
        expect(
          await original.evaluate((entries) =>
            entries.map((entry) => ({
              id: entry.id,
              sameOwner: document.getElementById(entry.id) === entry.node,
              connected: entry.node.isConnected,
              sameLabel: entry.node.getAttribute('aria-labelledby') === entry.labelledBy,
              sameDescription: entry.node.getAttribute('aria-describedby') === entry.describedBy,
            }))
          )
        ).toEqual(
          await original.evaluate((entries) =>
            entries.map(({ id }) => ({
              id,
              sameOwner: true,
              connected: true,
              sameLabel: true,
              sameDescription: true,
            }))
          )
        )
        expect(messages).toEqual([])
      } finally {
        await original.dispose()
      }
    } finally {
      release()
    }
  })
}

test('typing and focus before hydration survive adoption of the server input', async ({ page }) => {
  const messages = diagnostics(page)
  const release = await pauseHydration(page)
  try {
    await page.goto(origin, { waitUntil: 'commit' })
    const email = page.getByRole('textbox', { name: 'Email', exact: true })
    await email.fill('draft@example.test')
    await expect(email).toBeFocused()
    const serverInput = await email.elementHandle()
    expect(serverInput).not.toBeNull()
    release()
    await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
    await expect(email).toHaveValue('draft@example.test')
    await expect(email).toBeFocused()
    expect(await serverInput!.evaluate((node) => node === document.activeElement)).toBe(true)
    await expect(email).toHaveAccessibleDescription('Work address Required')
    await email.press('End')
    await email.press('!')
    await expect(email).toHaveValue('draft@example.test!')
    expect(messages).toEqual([])
    await serverInput!.dispose()
  } finally {
    release()
  }
})
