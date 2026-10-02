import { Menubar } from '@xenon-ui/solid/menubar'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 60))
  flush()
}

function EditorMenubar() {
  return (
    <Menubar aria-label="Editor">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.Group>
              <Menubar.GroupLabel>Document</Menubar.GroupLabel>
              <Menubar.Item>Save</Menubar.Item>
            </Menubar.Group>
            <Menubar.CheckboxItem defaultChecked="mixed">Guides</Menubar.CheckboxItem>
            <Menubar.RadioGroup defaultValue="compact">
              <Menubar.GroupLabel>Density</Menubar.GroupLabel>
              <Menubar.RadioItem value="compact">Compact</Menubar.RadioItem>
              <Menubar.RadioItem value="comfortable">Comfortable</Menubar.RadioItem>
            </Menubar.RadioGroup>
            <Menubar.Separator />
            <Menubar.Sub>
              <Menubar.SubTrigger>Export</Menubar.SubTrigger>
              <Menubar.Positioner>
                <Menubar.Content aria-label="Export formats">
                  <Menubar.Item>PDF</Menubar.Item>
                </Menubar.Content>
              </Menubar.Positioner>
            </Menubar.Sub>
          </Menubar.Content>
        </Menubar.Positioner>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.Item>Copy</Menubar.Item>
          </Menubar.Content>
        </Menubar.Positioner>
      </Menubar.Menu>
    </Menubar>
  )
}

const roleRules = [
  'aria-command-name',
  'aria-toggle-field-name',
  'aria-allowed-attr',
  'aria-allowed-role',
  'aria-required-attr',
  'aria-required-parent',
  'aria-required-children',
  'aria-roles',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'duplicate-id-aria',
  'nested-interactive',
]

test('closed menubar and first open menu pass axe with action, checkbox and radio items menubar.a11y.1', async () => {
  const m = mount(() => <EditorMenubar />)
  expect(m.queryByRole('menu')).toBeNull()
  await expectNoViolations(m.container)
  await userEvent.click(m.getByRole('menuitem', { name: 'File' }))
  await settle()
  expect(m.getByRole('menu', { name: 'File' })).toBeVisible()
  expect(m.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
    'aria-checked',
    'mixed'
  )
  expect(m.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute('aria-checked', 'true')
  expect(m.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  await expectNoViolations(m.container)
})

test('nested menus retain named groups, valid roles and unique resolved ARIA references menubar.roles.21 menubar.a11y.3', async () => {
  const m = mount(() => <EditorMenubar />)
  await userEvent.click(m.getByRole('menuitem', { name: 'File' }))
  await settle()
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  exportTrigger.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
  expect(m.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(m.getByRole('group', { name: 'Document' })).toBeVisible()
  expect(m.getByRole('group', { name: 'Density' })).toBeVisible()
  for (const element of m.container.querySelectorAll(
    '[aria-labelledby], [aria-controls], [aria-describedby]'
  )) {
    for (const attribute of ['aria-labelledby', 'aria-controls', 'aria-describedby']) {
      for (const id of (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean)) {
        expect(
          [...m.container.querySelectorAll('[id]')].filter((node) => node.id === id)
        ).toHaveLength(1)
      }
    }
  }
  await expectNoViolations(m.container, roleRules)
})

test('axe reports unnamed commands and nested interactive descendants in authored menubar items menubar.roles.21', async () => {
  // aria-command-name selects generic commands; nested-interactive selects checkbox/radio item roles.
  const m = mount(() => (
    <Menubar aria-label="Editor">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.Item
              as="div"
              data-testid="unnamed"
              style={{ width: '120px', height: '24px' }}
            />
            <Menubar.CheckboxItem as="div">
              Nested <button>Child action</button>
            </Menubar.CheckboxItem>
          </Menubar.Content>
        </Menubar.Positioner>
      </Menubar.Menu>
    </Menubar>
  ))
  await userEvent.click(m.getByRole('menuitem', { name: 'File' }))
  await settle()
  expect(m.getByTestId('unnamed')).toHaveAccessibleName('')
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['aria-command-name', 'nested-interactive'] },
  })
  expect(results.violations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'aria-command-name', impact: 'serious' }),
      expect.objectContaining({ id: 'nested-interactive', impact: 'serious' }),
    ])
  )
})

test('axe detects missing checkbox state and forbidden ARIA attributes in authored menubar content menubar.a11y.3', async () => {
  const m = mount(() => (
    <Menubar aria-label="Editor">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.CheckboxItem aria-checked={undefined}>Guides</Menubar.CheckboxItem>
            <Menubar.Item aria-valuenow={2}>Save</Menubar.Item>
          </Menubar.Content>
        </Menubar.Positioner>
      </Menubar.Menu>
    </Menubar>
  ))
  await userEvent.click(m.getByRole('menuitem', { name: 'File' }))
  await settle()
  expect(m.getByRole('menuitemcheckbox', { name: 'Guides' })).not.toHaveAttribute('aria-checked')
  expect(m.getByRole('menuitem', { name: 'Save' })).toHaveAttribute('aria-valuenow', '2')
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['aria-required-attr', 'aria-allowed-attr'] },
  })
  expect(results.violations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'aria-required-attr', impact: 'critical' }),
      expect.objectContaining({ id: 'aria-allowed-attr', impact: 'critical' }),
    ])
  )
})
