import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { For, createSignal, flush, onCleanup, untrack } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Menu } from './index'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
async function open(trigger: HTMLElement) {
  trigger.click()
  flush()
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'))
  await waitFor(() => {
    flush()
    expect(trigger.ownerDocument.querySelector('[role="menu"]')).toBeVisible()
  })
}
function close(trigger: HTMLElement) {
  trigger.click()
  flush()
}

test('uncontrolled checkbox state survives lazy menu teardown without retaining popup DOM', async () => {
  const change = vi.fn()
  const view = render(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem onCheckedChange={change}>Guides</Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = view.getByRole('button', { name: 'Actions' })
  expect(view.queryByRole('menu')).toBeNull()
  await open(trigger)
  view.getByRole('menuitemcheckbox').click()
  flush()
  expect(view.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true')
  close(trigger)
  await waitFor(() => {
    flush()
    expect(view.container.querySelector('[role="menu"]')).toBeNull()
  })
  await open(trigger)
  expect(view.getByRole('menuitemcheckbox')).toHaveAttribute('aria-checked', 'true')
  expect(change).toHaveBeenCalledExactlyOnceWith(true)
})

test('uncontrolled radio selection survives lazy menu teardown without mount callbacks', async () => {
  const change = vi.fn()
  const view = render(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.RadioGroup defaultValue="compact" onValueChange={change}>
            <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
            <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = view.getByRole('button', { name: 'Actions' })
  await open(trigger)
  view.getByRole('menuitemradio', { name: 'Comfortable' }).click()
  flush()
  close(trigger)
  await waitFor(() => {
    flush()
    expect(view.container.querySelector('[role="menu"]')).toBeNull()
  })
  await open(trigger)
  expect(view.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(view.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  expect(change).toHaveBeenCalledExactlyOnceWith('comfortable')
})

test('lazy owners follow author list identity, deletion and final disposal while closed', async () => {
  const first = { label: 'Guides' }
  const second = { label: 'Grid' }
  const [choices, setChoices] = createSignal([first, second])
  const mounted = vi.fn()
  const removed = vi.fn()
  const changed = vi.fn()
  function Choice(props: { item: typeof first }) {
    const item = untrack(() => props.item)
    mounted(item)
    onCleanup(() => removed(item))
    return <Menu.CheckboxItem onCheckedChange={changed}>{props.item.label}</Menu.CheckboxItem>
  }
  const view = render(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <For each={choices()}>{(item) => <Choice item={item} />}</For>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = view.getByRole('button', { name: 'Actions' })
  expect(mounted).not.toHaveBeenCalled()
  await open(trigger)
  expect(mounted).toHaveBeenCalledTimes(2)
  view.getByRole('menuitemcheckbox', { name: 'Guides' }).click()
  view.getByRole('menuitemcheckbox', { name: 'Grid' }).click()
  flush()
  close(trigger)
  await waitFor(() => {
    flush()
    expect(view.container.querySelector('[role="menu"]')).toBeNull()
  })
  expect(removed).not.toHaveBeenCalled()
  setChoices([second, first])
  flush()
  await open(trigger)
  expect(view.getAllByRole('menuitemcheckbox').map((node) => node.textContent)).toEqual([
    'Grid',
    'Guides',
  ])
  expect(view.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(view.getByRole('menuitemcheckbox', { name: 'Grid' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(mounted).toHaveBeenCalledTimes(2)
  close(trigger)
  await waitFor(() => {
    flush()
    expect(view.container.querySelector('[role="menu"]')).toBeNull()
  })
  setChoices([first])
  flush()
  expect(removed).toHaveBeenCalledExactlyOnceWith(second)
  setChoices([first, second])
  flush()
  await open(trigger)
  expect(view.getAllByRole('menuitemcheckbox')).toHaveLength(2)
  expect(view.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(view.getByRole('menuitemcheckbox', { name: 'Grid' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
  )
  flush()
  expect(view.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveFocus()
  view
    .getByRole('menuitemcheckbox', { name: 'Guides' })
    .dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    )
  flush()
  expect(view.getByRole('menuitemcheckbox', { name: 'Grid' })).toHaveFocus()
  expect(changed.mock.calls).toEqual([[true], [true]])
  view.unmount()
  expect(removed).toHaveBeenCalledTimes(3)
})

test('closing clears a pending submenu hover instead of reopening it with the retained owner', async () => {
  const view = render(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Sub>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Item>PDF</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = view.getByRole('button', { name: 'Actions' })
  await open(trigger)
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  view
    .getByRole('menuitem', { name: 'Export' })
    .dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse' }))
  flush()
  close(trigger)
  vi.advanceTimersByTime(200)
  flush()
  vi.useRealTimers()
  await open(trigger)
  expect(view.getByRole('menuitem', { name: 'Export' })).toHaveAttribute('aria-expanded', 'false')
  expect(view.queryByRole('menu', { name: 'Export formats' })).toBeNull()
})
