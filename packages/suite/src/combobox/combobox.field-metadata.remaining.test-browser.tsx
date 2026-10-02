import { Field } from '@xenon-ui/solid'
import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush, Show } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
]

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  let mounted = true
  const unmount = () => {
    if (!mounted) return
    mounted = false
    dispose()
    container.remove()
    flush()
  }
  onTestFinished(unmount)
  flush()
  return { container, unmount, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function Parts(props: { popup?: boolean; description?: string; labelledBy?: string }) {
  return (
    <>
      <Show when={!props.popup}>
        <Combobox.Input aria-describedby={props.description} aria-labelledby={props.labelledBy} />
      </Show>
      <Combobox.Trigger
        aria-label={props.popup ? undefined : 'Show fruit'}
        aria-describedby={props.popup ? props.description : undefined}
      >
        <Combobox.Value placeholder="Choose fruit" />
      </Combobox.Trigger>
      <Combobox.Positioner>
        <Combobox.Content style={{ background: 'white', padding: '12px' }}>
          <Show when={props.popup} fallback={<Combobox.Viewport aria-label="Fruit suggestions" />}>
            <Combobox.Input aria-label="Search fruit" />
            <Combobox.Viewport aria-label="Fruit suggestions" />
          </Show>
        </Combobox.Content>
      </Combobox.Positioner>
    </>
  )
}

test('combobox.roles.24: an explicit Field label reference names only the input without aggregating selected value text', () => {
  const m = mount(() => (
    <Field>
      <Field.Label id="fruit-metadata-label">Fruit</Field.Label>
      <Combobox items={items} defaultValue="apple">
        <Parts labelledBy="fruit-metadata-label" />
      </Combobox>
    </Field>
  ))
  const input = m.getByRole('combobox', { name: 'Fruit' })
  expect(input).toHaveAttribute('aria-labelledby', 'fruit-metadata-label')
  expect(input).toHaveValue('Apple')
  expect(m.getByText('Fruit')).toHaveAttribute('for', input.id)
})

for (const popup of [false, true]) {
  test(`combobox.focus.28: native Field label click focuses the ${popup ? 'outer popup trigger' : 'inline input'} without opening`, async () => {
    const opened = vi.fn()
    const change = vi.fn()
    const m = mount(() => (
      <Field>
        <Field.Label>Fruit</Field.Label>
        <Combobox
          items={items}
          inputPlacement={popup ? 'popup' : undefined}
          onOpenChange={opened}
          onValueChange={change}
        >
          <Parts popup={popup} />
        </Combobox>
      </Field>
    ))
    const control = m.getByRole('combobox', { name: 'Fruit' })
    const label = m.getByText('Fruit')
    expect(label).toHaveAttribute('for', control.id)
    await userEvent.click(label)
    await settle()
    expect(control).toHaveFocus()
    expect(control).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox')).toBeNull()
    expect(m.queryByRole('dialog')).toBeNull()
    expect(opened).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
  })

  test(`combobox.roles.29: author and Field description references track helper and error cleanup on the ${popup ? 'popup trigger' : 'input'}`, async () => {
    const [invalid, setInvalid] = createSignal(true)
    const [help, setHelp] = createSignal(true)
    const [error, setError] = createSignal(true)
    const m = mount(() => (
      <>
        <p id="combo-authored-description">Authored guidance</p>
        <Field invalid={invalid()}>
          <Field.Label>Fruit</Field.Label>
          <Combobox items={items} inputPlacement={popup ? 'popup' : undefined}>
            <Parts popup={popup} description="combo-authored-description" />
          </Combobox>
          <Show when={help()}>
            <Field.Description id="combo-helper">Field guidance</Field.Description>
          </Show>
          <Show when={error()}>
            <Field.Error id="combo-error">Pick a fruit</Field.Error>
          </Show>
        </Field>
      </>
    ))
    const control = m.getByRole('combobox', { name: 'Fruit' })
    expect(control).toHaveAttribute(
      'aria-describedby',
      'combo-authored-description combo-helper combo-error'
    )
    for (const id of control.getAttribute('aria-describedby')!.split(' '))
      expect(document.getElementById(id)).not.toBeNull()
    setInvalid(false)
    await settle()
    expect(control).toHaveAttribute('aria-describedby', 'combo-authored-description combo-helper')
    setInvalid(true)
    setError(false)
    await settle()
    expect(control).toHaveAttribute('aria-describedby', 'combo-authored-description combo-helper')
    expect(document.getElementById('combo-error')).toBeNull()
    setHelp(false)
    await settle()
    expect(control).toHaveAttribute('aria-describedby', 'combo-authored-description')
    expect(document.getElementById('combo-helper')).toBeNull()
  })
}

test('combobox.roles.31: the named graphical toggle is excluded from native Tab order and shares open associations', async () => {
  const m = mount(() => (
    <>
      <button>Before</button>
      <Combobox items={items}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Trigger aria-label="Show fruit" />
        <Combobox.Positioner>
          <Combobox.Content aria-label="Fruit suggestions" />
        </Combobox.Positioner>
      </Combobox>
      <button>After</button>
    </>
  ))
  const input = m.getByRole('combobox')
  const trigger = m.getByRole('button', { name: 'Show fruit' })
  expect(trigger).toHaveAttribute('tabindex', '-1')
  m.getByRole('button', { name: 'Before' }).focus()
  await userEvent.keyboard('{Tab}')
  expect(input).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  expect(m.getByRole('button', { name: 'After' })).toHaveFocus()
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  expect(input).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-controls', popup.id)
  expect(input).toHaveAttribute('aria-controls', popup.id)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).not.toHaveAttribute('aria-controls')
})

test('combobox.roles.36: both shipped listbox arrangements omit an explicit orientation', async () => {
  for (const popup of [false, true]) {
    const m = mount(() => (
      <Combobox items={items} inputPlacement={popup ? 'popup' : undefined}>
        <Show when={!popup}>
          <Combobox.Input aria-label="Fruit" />
        </Show>
        <Combobox.Trigger aria-label="Choose fruit" />
        <Combobox.Positioner>
          <Combobox.Content
            aria-label="Fruit suggestions"
            style={{ background: 'white', padding: '12px' }}
          >
            <Show when={popup} fallback={<Combobox.Item value="apple">Apple</Combobox.Item>}>
              <Combobox.Input aria-label="Search fruit" />
              <Combobox.Viewport aria-label="Fruit suggestions" />
            </Show>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    ))
    await userEvent.click(m.getByRole(popup ? 'combobox' : 'button', { name: 'Choose fruit' }))
    await settle()
    expect(m.getByRole('listbox')).not.toHaveAttribute('aria-orientation')
    m.unmount()
  }
})

test('combobox.roles.10: force-mounted controls resolve while closed and open without introducing aria-owns', async () => {
  const m = mount(() => (
    <Combobox items={items} forceMount>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Trigger aria-label="Show fruit" />
      <Combobox.Positioner>
        <Combobox.Content data-testid="popup" aria-label="Fruit suggestions" />
      </Combobox.Positioner>
    </Combobox>
  ))
  const input = m.getByRole('combobox')
  const trigger = m.getByRole('button', { name: 'Show fruit' })
  const popup = m.getByTestId('popup')
  expect(popup.id).not.toBe('')
  expect(popup).not.toBeVisible()
  expect(input).toHaveAttribute('aria-controls', popup.id)
  expect(trigger).toHaveAttribute('aria-controls', popup.id)
  expect(document.getElementById(popup.id)).toBe(popup)
  expect(input).not.toHaveAttribute('aria-owns')
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('listbox')).toBe(popup)
  expect(input).toHaveAttribute('aria-controls', popup.id)
  expect(input).not.toHaveAttribute('aria-owns')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getByTestId('popup')).toBe(popup)
  expect(popup).not.toBeVisible()
  expect(input).toHaveAttribute('aria-controls', popup.id)
  expect(input).not.toHaveAttribute('aria-owns')
})
