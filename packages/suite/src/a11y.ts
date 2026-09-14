import axe from 'axe-core'
import { expect } from 'vitest'

const disabled = ['region', 'color-contrast']

export async function expectNoViolations(node: Element, only?: string[]) {
  const results = await axe.run(node, {
    rules: Object.fromEntries(disabled.map((id) => [id, { enabled: false }])),
    ...(only ? { runOnly: { type: 'rule', values: only } } : {}),
  })
  const summary = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
  expect(summary, summary).toBe('')
}
