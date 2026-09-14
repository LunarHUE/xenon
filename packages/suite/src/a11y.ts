import axe from 'axe-core'
import { expect } from 'vitest'

/** Rules excluded from the suite configuration: landmark-region coverage and color contrast. */
const disabled = ['region', 'color-contrast']

/**
 * Runs axe on the supplied element and asserts that no reported violations remain.
 *
 * @param node - Rendered subtree used as axe's scan context; mounting and cleanup belong to the caller.
 * @param only - Optional axe rule IDs passed as runOnly. Omission uses axe's default rule selection.
 * @remarks
 * Configures region and color-contrast as disabled. The assertion lists violation
 * IDs and help text; it does not inspect incomplete/manual-review results or prove
 * overall accessibility. Keyboard behavior, visual contrast, and requirements
 * outside axe's reported violations need separate checks. Axe errors reject the
 * returned promise; callers must await it to include the scan in their test.
 */
export async function expectNoViolations(node: Element, only?: string[]) {
  const results = await axe.run(node, {
    rules: Object.fromEntries(disabled.map((id) => [id, { enabled: false }])),
    ...(only ? { runOnly: { type: 'rule', values: only } } : {}),
  })
  const summary = results.violations.map((v) => `${v.id}: ${v.help}`).join('\n')
  expect(summary, summary).toBe('')
}
