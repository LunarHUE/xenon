/**
 * Browser-native modifier chords, consumer-canceled opening/selection, and focus
 * movement through an externally portaled popup for the single-value Select.
 * Complements the keyboard/forms suites, which cover plain keys, typeahead, reset,
 * pointer commitment, and the non-portal native form path.
 */
import { Select } from '@xenon/solid'
import type { JSX } from '@solidjs/web'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Option metadata in document order; Apple stays first so "opens at the first" is observable. */
const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
]
/** Popup styling so pointer targets have real geometry in the top layer. */
const surface = { background: 'white', padding: '12px', 'min-width': '160px' }
/** Fixture disposers, unwound in reverse order after every test. */
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
/** Render into the body, register disposal, and expose scoped queries. */
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
/** Flush Solid and carry the popup presence through its enter and exit frames. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
/** Deliver native keys to the focused element and settle the resulting render. */
async function press(keys: string) {
  await userEvent.keyboard(keys)
  await settle()
}
/** Reads which interaction the consumer cancels: 'open' or an option value. */
type CancelTarget = () => 'open' | string | undefined
/** Inputs for the cancelable fixture. */
interface CancelProps {
  /** Current cancellation target, read when each interaction fires. */
  cancel: CancelTarget
  /** Receives committed value requests. */
  onValueChange?: (value: string | undefined) => void
  /** Receives visibility requests. */
  onOpenChange?: (open: boolean) => void
}
/** One named Select whose consumer handlers can veto opening and option selection. */
function CancelableSelect(props: CancelProps) {
  const veto = (target: string) => (event: MouseEvent) => {
    if (props.cancel() === target) event.preventDefault()
  }
  return (
    <form>
      <Select
        items={items}
        name="fruit"
        onValueChange={props.onValueChange}
        onOpenChange={props.onOpenChange}
      >
        <Select.Trigger aria-label="Fruit" onClick={veto('open')}>
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={surface}>
            <Select.Item value="apple" onClick={veto('apple')} />
            <Select.Item value="pear" onClick={veto('pear')} />
            <Select.Item value="plum" />
          </Select.Content>
        </Select.Positioner>
      </Select>
      <button type="submit">Save</button>
    </form>
  )
}
/** Select whose popup is portaled into a consumer-owned container outside its form. */
function PortaledSelect(props: {
  host: HTMLElement
  onValueChange?: (value: string | undefined) => void
}) {
  return (
    <div>
      <button type="button">Before</button>
      <form>
        <Select items={items} name="fruit" onValueChange={props.onValueChange}>
          <Select.Trigger aria-label="Fruit">
            <Select.Value placeholder="Choose fruit" />
          </Select.Trigger>
          <Select.Portal container={props.host}>
            <Select.Positioner>
              <Select.Content style={surface}>
                <Select.Item value="apple" />
                <Select.Item value="pear" />
                <Select.Item value="plum" />
              </Select.Content>
            </Select.Positioner>
          </Select.Portal>
        </Select>
      </form>
      <button type="button">After</button>
    </div>
  )
}

describe('select browser-native chords, cancellation, and portal hosting', () => {
  test('select.keyboard.4: native Alt+ArrowDown opens a closed select at the first option and Alt+ArrowUp commits the highlight', async () => {
    const change = vi.fn()
    const m = mount(() => <CancelableSelect cancel={() => undefined} onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    const option = (name: string) => within(popup).getByRole('option', { name }).id
    expect(trigger.getAttribute('aria-activedescendant')).toBe(option('Apple'))
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(change).not.toHaveBeenCalled()
    await press('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(option('Pear'))
    expect(change).not.toHaveBeenCalled()
    await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}')
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Pear')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
  })

  test('native Control, Meta and Alt chords keep a closed select inert while the unmodified key still acts', async () => {
    const change = vi.fn()
    const open = vi.fn()
    const m = mount(() => (
      <CancelableSelect cancel={() => undefined} onValueChange={change} onOpenChange={open} />
    ))
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    for (const chord of [
      '{Control>}{ArrowDown}{/Control}',
      '{Meta>}{ArrowDown}{/Meta}',
      '{Alt>}a{/Alt}',
      '{Control>}a{/Control}',
    ]) {
      await userEvent.keyboard(chord)
      await settle()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger.textContent).toBe('Choose fruit')
      expect(trigger).not.toHaveAttribute('aria-activedescendant')
      expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    }
    expect(change).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
    expect(new FormData(form).get('fruit')).toBe('')
    await press('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(open).toHaveBeenLastCalledWith(true)
  })

  test('a consumer-canceled native trigger click opens nothing until the next click', async () => {
    const change = vi.fn()
    const open = vi.fn()
    let target: 'open' | undefined = 'open'
    const m = mount(() => (
      <CancelableSelect cancel={() => target} onValueChange={change} onOpenChange={open} />
    ))
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    await userEvent.click(trigger)
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    expect(open).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    target = undefined
    await userEvent.click(trigger)
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(m.getByRole('listbox', { name: 'Fruit' })).toBeVisible()
    expect(open).toHaveBeenLastCalledWith(true)
  })

  test('a consumer-canceled native option click leaves the popup open, focus on the trigger, and no value', async () => {
    const change = vi.fn()
    const m = mount(() => <CancelableSelect cancel={() => 'apple'} onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Apple' }).id
    )
    await userEvent.click(within(popup).getByRole('option', { name: 'Apple' }))
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(m.getByRole('listbox', { name: 'Fruit' })).toBeVisible()
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(change).not.toHaveBeenCalled()
    await userEvent.click(
      within(m.getByRole('listbox', { name: 'Fruit' })).getByRole('option', { name: 'Pear' })
    )
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Pear')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
  })

  test('an externally portaled popup mounts in its host, resolves ids, and commits with focus on the trigger', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    cleanups.push(() => host.remove())
    const change = vi.fn()
    const m = mount(() => <PortaledSelect host={host} onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    expect(host.querySelector('[role="listbox"]')).toBeNull()
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    trigger.focus()
    await press('{ArrowDown}')
    const popup = within(host).getByRole('listbox', { name: 'Fruit' })
    expect(popup).toBeVisible()
    expect(trigger).toHaveFocus()
    // The trigger's aria references are document-global and still resolve into the portal.
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBe(popup)
    expect(document.getElementById(trigger.getAttribute('aria-activedescendant')!)).toBe(
      within(popup).getByRole('option', { name: 'Apple' })
    )
    await userEvent.click(within(popup).getByRole('option', { name: 'Apple' }))
    await settle()
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.textContent).toBe('Apple')
    expect(host.querySelector('[role="listbox"]')).toBeNull()
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(change).toHaveBeenCalledExactlyOnceWith('apple')
  })

  test('native Tab from an open portaled select reaches trigger-ordered siblings instead of the portal', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    cleanups.push(() => host.remove())
    const m = mount(() => <PortaledSelect host={host} />)
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    const before = m.getByRole('button', { name: 'Before' })
    const after = m.getByRole('button', { name: 'After' })
    trigger.focus()
    await press('{ArrowDown}')
    expect(within(host).getByRole('listbox', { name: 'Fruit' })).toBeVisible()
    await press('{Tab}')
    expect(after).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(host.querySelector('[role="listbox"]')).toBeNull()
    // Shift+Tab walks back to the trigger's preceding sibling, still skipping the portal.
    trigger.focus()
    await press('{ArrowDown}')
    expect(within(host).getByRole('listbox', { name: 'Fruit' })).toBeVisible()
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await settle()
    expect(before).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(host.querySelector('[role="listbox"]')).toBeNull()
  })
})
