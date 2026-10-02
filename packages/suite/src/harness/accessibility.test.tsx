import { Portal, render } from '@solidjs/web'
import axe from 'axe-core'
import { afterEach, expect, test, vi } from 'vitest'

import { expectNoViolations } from '../a11y'
import { assertDescriptionReferences, assertVirtualFocus } from './accessibility'

const cleanups: (() => void)[] = []

afterEach(() => {
  vi.restoreAllMocks()
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
})

function fixture() {
  const root = document.createElement('main')
  document.body.append(root)
  cleanups.push(() => root.remove())
  return root
}

test('a11y-tooling.2 a11y-tooling.3 helper excludes fragment-only rules in default and targeted scans and reports violations', async () => {
  const root = fixture()
  root.append(document.createElement('button'))
  root.firstElementChild!.textContent = 'Save'
  const run = vi.spyOn(axe, 'run')
  await expectNoViolations(root)
  await expectNoViolations(root, ['button-name'])
  for (const call of run.mock.calls)
    expect(call[1]).toMatchObject({
      rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
    })
  expect(run.mock.calls[1]![1]).toMatchObject({
    runOnly: { type: 'rule', values: ['button-name'] },
  })
  root.firstElementChild!.textContent = ''
  await expect(expectNoViolations(root, ['button-name'])).rejects.toThrow('button-name')
})

test('a11y-tooling.4 finite raw scan explicitly requests the three default-disabled rules', async () => {
  const root = fixture()
  root.append(document.createElement('button'))
  root.firstElementChild!.textContent = 'Save'
  const ids = ['target-size', 'aria-roledescription', 'duplicate-id-active']
  expect(axe.getRules().map((rule) => rule.ruleId)).toEqual(expect.arrayContaining(ids))
  const result = await axe.run(root, {
    runOnly: { type: 'rule', values: ids },
    rules: Object.fromEntries(ids.map((id) => [id, { enabled: true }])),
  })
  const evaluated = [
    ...result.passes,
    ...result.violations,
    ...result.incomplete,
    ...result.inapplicable,
  ].map((rule) => rule.id)
  expect(evaluated).toEqual(expect.arrayContaining(ids))
})

test('a11y-tooling.6 a widened scan catches an unnamed portalled control outside the root', async () => {
  const root = fixture()
  cleanups.push(
    render(
      () => (
        <>
          <button>Save</button>
          <Portal>
            <button />
          </Portal>
        </>
      ),
      root
    )
  )
  await expectNoViolations(root, ['button-name'])
  await expect(expectNoViolations(document.body, ['button-name'])).rejects.toThrow('button-name')
})

function descriptionFixture() {
  const root = fixture()
  const control = document.createElement('button')
  control.textContent = 'Save'
  root.append(control)
  for (const [id, text] of [
    ['a11y-item', 'Item hint'],
    ['a11y-group', 'Group hint'],
    ['a11y-author', 'Author hint'],
  ]) {
    const node = document.createElement('span')
    node.id = id!
    node.textContent = text!
    root.append(node)
  }
  control.setAttribute('aria-describedby', 'a11y-item\t a11y-group\n a11y-author')
  return { root, control }
}

test('a11y-tooling.17 resolves every description token in order and computes the combined description', () => {
  const { control } = descriptionFixture()
  expect(assertDescriptionReferences(control).map((node) => node.id)).toEqual([
    'a11y-item',
    'a11y-group',
    'a11y-author',
  ])
  control.setAttribute('aria-describedby', 'a11y-item a11y-group a11y-author')
  expect(control).toHaveAccessibleDescription('Item hint Group hint Author hint')
})

test('a11y-tooling.17 rejects a description reference removed after registration', () => {
  const { root, control } = descriptionFixture()
  root.querySelector('#a11y-group')!.remove()
  expect(() => assertDescriptionReferences(control)).toThrow('does not resolve: a11y-group')
})

test('a11y-tooling.17 rejects empty referenced text even when the other IDs resolve', () => {
  const { root, control } = descriptionFixture()
  root.querySelector('#a11y-group')!.textContent = ' \n '
  expect(() => assertDescriptionReferences(control)).toThrow('empty text: a11y-group')
})

function virtualFixture() {
  const root = fixture()
  const container = document.createElement('div')
  container.tabIndex = 0
  container.setAttribute('role', 'listbox')
  const target = document.createElement('div')
  target.id = 'a11y-option'
  target.setAttribute('role', 'option')
  target.textContent = 'Apple'
  container.setAttribute('aria-activedescendant', target.id)
  root.append(container, target)
  return { container, target }
}

test('a11y-tooling.18 accepts a mounted virtual target outside the focused container', () => {
  const { container, target } = virtualFixture()
  container.focus()
  expect(() => assertVirtualFocus(container, target)).not.toThrow()
  expect(target).not.toHaveFocus()
})

test('a11y-tooling.18 rejects advertised virtual focus without real container focus or a mounted matching target', () => {
  const { container, target } = virtualFixture()
  expect(() => assertVirtualFocus(container, target)).toThrow('does not have DOM focus')
  container.focus()
  container.setAttribute('aria-activedescendant', 'different-option')
  expect(() => assertVirtualFocus(container, target)).toThrow('does not match')
  container.setAttribute('aria-activedescendant', target.id)
  target.remove()
  expect(() => assertVirtualFocus(container, target)).toThrow('mounted element')
})
