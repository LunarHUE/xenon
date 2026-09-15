import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test } from 'vitest'
import { getListboxItemId } from '@xenon/core/listbox'

let server: ViteDevServer
let fixture: {
  renderListbox(): string
  renderCheckboxGroup(): string
  renderSelect(): string
  renderCombobox(): string
}
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  fixture = (await server.ssrLoadModule('/src/listbox/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('SSR preserves custom Listbox base IDs, distinct values, and initial selection', () => {
  const document = new DOMParser().parseFromString(fixture.renderListbox(), 'text/html')
  const root = document.querySelector('[role=listbox]')!
  const options = Array.from(document.querySelectorAll('[role=option]'))
  expect(root.id).toBe('custom-list')
  expect(options.map((option) => option.id)).toEqual([
    getListboxItemId('custom-list', 'a b'),
    getListboxItemId('custom-list', 'a-b'),
  ])
  expect(options[0]!.getAttribute('aria-selected')).toBe('true')
  expect(options[1]!.getAttribute('aria-selected')).toBe('false')
})
test('SSR resolves CheckboxGroup custom label and description associations before hydration', () => {
  const document = new DOMParser().parseFromString(fixture.renderCheckboxGroup(), 'text/html')
  const root = document.querySelector('[aria-labelledby="custom-label"]')!
  expect(root.getAttribute('role')).toBe('group')
  expect(root.getAttribute('aria-describedby')).toBe('custom-description custom-error')
  const apple = document.querySelector('input[value=a]')!
  expect(apple.hasAttribute('checked')).toBe(true)
  expect(apple.getAttribute('aria-describedby')).toBe('custom-description custom-error')
  const label = Array.from(document.querySelectorAll('label')).find(
    (label) => label.textContent === 'Apple'
  )!
  expect(label.htmlFor).toBe(apple.id)
  expect(apple.id).not.toBe('')
  for (const token of root.getAttribute('aria-describedby')!.split(' '))
    expect(document.getElementById(token)).not.toBeNull()
})

test('SSR Select preserves initial label, native selection, and custom popup and option associations', () => {
  const document = new DOMParser().parseFromString(fixture.renderSelect(), 'text/html')
  const trigger = document.querySelector('[role=combobox]')!
  expect(trigger.textContent).toBe('Pear')
  expect(trigger.id).toBe('select-trigger')
  expect(trigger.getAttribute('aria-controls')).toBe('select-options')
  expect(trigger.getAttribute('aria-activedescendant')).toBe('selected-pear')
  expect(document.getElementById('select-options')).not.toBeNull()
  expect(document.getElementById('selected-pear')?.getAttribute('aria-selected')).toBe('true')
  expect(document.querySelector('select option[selected]')?.getAttribute('value')).toBe('pear')
})
test('SSR Combobox preserves selected input text, native selection, and custom popup IDs', () => {
  const document = new DOMParser().parseFromString(fixture.renderCombobox(), 'text/html')
  const input = document.querySelector('[role=combobox]')!
  expect(input.getAttribute('value')).toBe('Pear')
  expect(input.id).toBe('combo-input')
  expect(input.getAttribute('aria-controls')).toBe('combo-options')
  expect(document.getElementById('combo-options')).not.toBeNull()
  expect(document.getElementById('combo-pear')?.getAttribute('aria-selected')).toBe('true')
  expect(document.querySelector('select option[selected]')?.getAttribute('value')).toBe('pear')
})
