import { Menu, Popover, Select, Toolbar } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}
async function focused(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(element)
}
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
]

function OverlayItems() {
  return (
    <>
      <Menu>
        <Menu.Trigger as={Toolbar.Button}>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content aria-label="Actions">
            <Menu.Item>Copy</Menu.Item>
            <Menu.Item>Paste</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <Select items={items}>
        <Select.Trigger as={Toolbar.Button} aria-label="Fruit">
          <Select.Value placeholder="Fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content aria-label="Fruit options">
            <Select.Item value="a" />
            <Select.Item value="b" />
          </Select.Content>
        </Select.Positioner>
      </Select>
      <Popover>
        <Popover.Trigger as={Toolbar.Button}>Settings</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>Settings panel</Popover.Title>
            <input aria-label="Setting value" />
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    </>
  )
}

for (const [name, haspopup, role] of [
  ['Actions', 'menu', 'menu'],
  ['Fruit', 'listbox', 'listbox'],
  ['Settings', 'dialog', 'dialog'],
] as const) {
  test(`${haspopup} toolbar trigger preserves popup semantics through opening and dismissal toolbar.roles.12`, async () => {
    const m = mount(() => (
      <Toolbar aria-label="Tools">
        <OverlayItems />
      </Toolbar>
    ))
    const trigger = m.getByRole(name === 'Fruit' ? 'combobox' : 'button', { name })
    expect(trigger).toHaveAttribute('aria-haspopup', haspopup)
    await userEvent.click(trigger)
    await expect.poll(() => m.queryByRole(role)).not.toBeNull()
    expect(trigger).toHaveAttribute('aria-haspopup', haspopup)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => m.queryByRole(role)).toBeNull()
    await focused(trigger)
    expect(trigger).toHaveAttribute('aria-haspopup', haspopup)
  })
}

test('menu arrow keys stay inside the popup toolbar.keyboard.16', async () => {
  const m = mount(() => (
    <Toolbar aria-label="Tools">
      <Toolbar.Button>Before</Toolbar.Button>
      <OverlayItems />
      <Toolbar.Button>After</Toolbar.Button>
    </Toolbar>
  ))
  const trigger = m.getByRole('button', { name: 'Actions' })
  await userEvent.click(trigger)
  await focused(m.getByRole('menuitem', { name: 'Copy' }))
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByRole('menuitem', { name: 'Paste' }))
  await userEvent.keyboard('{ArrowRight}')
  expect(m.getByRole('menuitem', { name: 'Paste' })).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.container.querySelector('[role="toolbar"] [tabindex="0"]')).toBe(trigger)
})

test('arrow keys in a popover input do not move the toolbar ring toolbar.keyboard.16', async () => {
  const m = mount(() => (
    <Toolbar aria-label="Tools">
      <Toolbar.Button>Before</Toolbar.Button>
      <OverlayItems />
      <Toolbar.Button>After</Toolbar.Button>
    </Toolbar>
  ))
  const trigger = m.getByRole('button', { name: 'Settings' })
  await userEvent.click(trigger)
  const input = m.getByRole('textbox', { name: 'Setting value' })
  await focused(input)
  for (const key of ['{ArrowRight}', '{ArrowDown}', '{ArrowLeft}', '{ArrowUp}']) {
    await userEvent.keyboard(key)
    expect(input).toHaveFocus()
    expect(m.getByRole('dialog')).toBeVisible()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(m.container.querySelector('[role="toolbar"] [tabindex="0"]')).toBe(trigger)
  }
})

for (const overlay of ['menu', 'select', 'popover'] as const) {
  test(`disabled ${overlay} toolbar trigger guards native keys and clicks toolbar.state.7`, async () => {
    const open = vi.fn()
    const value = vi.fn()
    const press = vi.fn()
    const m = mount(() => (
      <Toolbar aria-label="Tools">
        {overlay === 'menu' ? (
          <Menu onOpenChange={open}>
            <Menu.Trigger as={Toolbar.Button} disabled onClick={press}>
              Blocked
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item>Copy</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu>
        ) : overlay === 'select' ? (
          <Select items={items} disabled onOpenChange={open} onValueChange={value}>
            <Select.Trigger as={Toolbar.Button} aria-label="Blocked" onClick={press}>
              Blocked
            </Select.Trigger>
            <Select.Positioner>
              <Select.Content>
                <Select.Item value="a" />
              </Select.Content>
            </Select.Positioner>
          </Select>
        ) : (
          <Popover onOpenChange={open}>
            <Popover.Trigger as={Toolbar.Button} disabled onClick={press}>
              Blocked
            </Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content aria-label="Blocked panel">
                <button>Inside</button>
              </Popover.Content>
            </Popover.Positioner>
          </Popover>
        )}
      </Toolbar>
    ))
    const trigger = m.getByRole(overlay === 'select' ? 'combobox' : 'button', { name: 'Blocked' })
    trigger.focus()
    await focused(trigger)
    for (const key of ['{Enter}', ' ', '{ArrowUp}', '{ArrowDown}']) {
      await userEvent.keyboard(key)
      flush()
      expect(trigger).toHaveFocus()
      expect(m.queryByRole('menu')).toBeNull()
      expect(m.queryByRole('listbox')).toBeNull()
      expect(m.queryByRole('dialog')).toBeNull()
    }
    await userEvent.click(trigger, { force: true })
    flush()
    expect(open).not.toHaveBeenCalled()
    expect(value).not.toHaveBeenCalled()
    expect(press).not.toHaveBeenCalled()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
}

test('toolbar menu popup preserves menu ownership and named radio state under axe toolbar.a11y.4', async () => {
  const m = mount(() => (
    <Toolbar aria-label="Tools">
      <Menu>
        <Menu.Trigger as={Toolbar.Button}>Density</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content aria-label="Density choices">
            <Menu.RadioGroup defaultValue="compact">
              <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
              <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    </Toolbar>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Density' }))
  await focused(m.getByRole('menuitemradio', { name: 'Compact' }))
  const menu = m.getByRole('menu')
  for (const [name, checked] of [
    ['Compact', 'true'],
    ['Comfortable', 'false'],
  ] as const) {
    const radio = m.getByRole('menuitemradio', { name })
    expect(menu).toContainElement(radio)
    expect(radio).toHaveAccessibleName(name)
    expect(radio).toHaveAttribute('aria-checked', checked)
  }
  await expectNoViolations(m.container, [
    'aria-required-children',
    'aria-required-parent',
    'aria-toggle-field-name',
    'aria-required-attr',
  ])
})

test('sequential toolbar popup opening and dismissal preserves each overlay toolbar.roles.12', async () => {
  const m = mount(() => (
    <Toolbar aria-label="Tools">
      <OverlayItems />
    </Toolbar>
  ))
  for (const [name, haspopup, role] of [
    ['Actions', 'menu', 'menu'],
    ['Fruit', 'listbox', 'listbox'],
    ['Settings', 'dialog', 'dialog'],
  ] as const) {
    const trigger = m.getByRole(name === 'Fruit' ? 'combobox' : 'button', { name })
    expect(trigger, `${name}: popup semantics before opening`).toHaveAttribute(
      'aria-haspopup',
      haspopup
    )
    await userEvent.click(trigger)
    await expect
      .poll(() => m.queryByRole(role), { message: `${name}: ${role} appears after native click` })
      .not.toBeNull()
    expect(trigger, `${name}: expanded after native click`).toHaveAttribute('aria-expanded', 'true')
    expect(trigger, `${name}: popup semantics while open`).toHaveAttribute(
      'aria-haspopup',
      haspopup
    )
    await userEvent.keyboard('{Escape}')
    await expect
      .poll(() => m.queryByRole(role), { message: `${name}: ${role} disappears after Escape` })
      .toBeNull()
    await expect
      .poll(
        () => {
          flush()
          return document.activeElement
        },
        { message: `${name}: trigger receives focus after Escape` }
      )
      .toBe(trigger)
    expect(trigger, `${name}: popup semantics after dismissal`).toHaveAttribute(
      'aria-haspopup',
      haspopup
    )
  }
})
