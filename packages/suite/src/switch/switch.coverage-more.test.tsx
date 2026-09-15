import axe from 'axe-core'
import { expect, onTestFinished, test } from 'vitest'

import { mount } from '../harness/solid'

function host(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

test('switch.roles.10 reports missing required aria-checked on a generic switch', async () => {
  const m = mount('switch', { as: 'div', 'aria-label': 'Lights' })
  const el = host(m.container)
  el.removeAttribute('aria-checked')
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['aria-required-attr'] },
  })
  expect(results.violations.map((violation) => violation.id)).toEqual(['aria-required-attr'])
  expect(results.violations[0]?.impact).toBe('critical')
  m.unmount()
})

test('switch.roles.10 reports nested interactive content under a switch', async () => {
  const m = mount('switch', {
    as: 'button',
    children: () => <button type="button">Nested</button>,
  })
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['nested-interactive'] },
  })
  expect(results.violations.map((violation) => violation.id)).toEqual(['nested-interactive'])
  expect(results.violations[0]?.impact).toBe('serious')
  m.unmount()
})

test('switch.roles.13 checks duplicate referenced IDs through axe', async () => {
  const label = document.createElement('span')
  label.id = 'switch-more-label'
  label.textContent = 'Lights'
  const duplicate = label.cloneNode(true) as HTMLSpanElement
  document.body.append(label, duplicate)
  const first = mount('switch', { as: 'div', 'aria-labelledby': label.id })
  const second = mount('switch', { as: 'div', 'aria-labelledby': label.id })
  onTestFinished(() => {
    label.remove()
    duplicate.remove()
    first.unmount()
    second.unmount()
  })
  const results = await axe.run(document.body, {
    runOnly: { type: 'rule', values: ['duplicate-id-aria'] },
  })
  expect({ violations: results.violations, incomplete: results.incomplete }).toMatchObject({
    incomplete: expect.arrayContaining([expect.objectContaining({ id: 'duplicate-id-aria' })]),
  })
  expect(results.incomplete.find((item) => item.id === 'duplicate-id-aria')?.impact).toBe(
    'critical'
  )
})
