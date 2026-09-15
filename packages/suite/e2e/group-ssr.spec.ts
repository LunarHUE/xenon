import { expect, test } from 'playwright/test'

const url = 'http://127.0.0.1:4174/?groupSsr'

test('accordion.ssr.1 preserves generated trigger and panel associations through hydration', async ({
  browser,
}) => {
  const serverContext = await browser.newContext({ javaScriptEnabled: false })
  let triggerId!: string | null
  let panelId!: string | null
  try {
    const server = await serverContext.newPage()
    await server.goto(url)
    const trigger = server.getByRole('button', { name: 'Server section' })
    const panel = server.getByText('Server panel')
    triggerId = await trigger.getAttribute('id')
    panelId = await panel.getAttribute('id')
    expect(await trigger.getAttribute('aria-controls')).toBe(panelId)
    expect(await panel.getAttribute('aria-labelledby')).toBe(triggerId)
  } finally {
    await serverContext.close()
  }
  expect(triggerId).toBeTruthy()
  expect(panelId).toBeTruthy()

  const page = await browser.newPage()
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  const hydratedTrigger = page.getByRole('button', { name: 'Server section' })
  const hydratedPanel = page.getByText('Server panel')
  expect(await hydratedTrigger.getAttribute('id')).toBe(triggerId)
  expect(await hydratedPanel.getAttribute('id')).toBe(panelId)
  expect(await hydratedTrigger.getAttribute('aria-controls')).toBe(panelId)
  expect(await hydratedPanel.getAttribute('aria-labelledby')).toBe(triggerId)
})

test('checkbox-group.ssr.1 keeps unique item ids and count across hydration', async ({
  browser,
}) => {
  const serverContext = await browser.newContext({ javaScriptEnabled: false })
  const server = await serverContext.newPage()
  await server.goto(url)
  const serverIds = await server
    .locator('#app [id]')
    .evaluateAll((nodes) => nodes.map((node) => node.id))
  expect(serverIds.length).toBeGreaterThanOrEqual(2)
  expect(serverIds.every(Boolean)).toBe(true)
  expect(new Set(serverIds).size).toBe(serverIds.length)
  await serverContext.close()

  const page = await browser.newPage()
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  const hydratedIds = await page
    .locator('#app [id]')
    .evaluateAll((nodes) => nodes.map((node) => node.id))
  expect(hydratedIds).toEqual(serverIds)
  expect(new Set(hydratedIds).size).toBe(hydratedIds.length)
})

test('checkbox-group.ssr.4 preserves each item label target before and after hydration', async ({
  browser,
}) => {
  const serverContext = await browser.newContext({ javaScriptEnabled: false })
  const server = await serverContext.newPage()
  await server.goto(url)
  const serverTargets = await server.locator('#app label').evaluateAll((labels) =>
    labels.map((label) => ({
      text: label.textContent?.trim(),
      target: (label as HTMLLabelElement).htmlFor,
    }))
  )
  expect(serverTargets).toHaveLength(2)
  for (const { target } of serverTargets) {
    expect(target).toBeTruthy()
    const targetNode = server.locator(`#app #${target}`)
    expect(await targetNode.count()).toBe(1)
    expect(await targetNode.evaluate((node) => ['INPUT', 'BUTTON'].includes(node.tagName))).toBe(
      true
    )
  }
  await serverContext.close()

  const page = await browser.newPage()
  await page.goto(url)
  await expect(page.locator('#app')).toHaveAttribute('data-hydrated', 'true')
  await expect(page.locator('#app')).toHaveAttribute('data-preserved', 'true')
  const hydratedTargets = await page.locator('#app label').evaluateAll((labels) =>
    labels.map((label) => ({
      text: label.textContent?.trim(),
      target: (label as HTMLLabelElement).htmlFor,
    }))
  )
  expect(hydratedTargets).toEqual(serverTargets)
  for (const { target } of hydratedTargets) {
    const targetNode = page.locator(`#app #${target}`)
    expect(await targetNode.count()).toBe(1)
    expect(await targetNode.evaluate((node) => ['INPUT', 'BUTTON'].includes(node.tagName))).toBe(
      true
    )
  }
})
