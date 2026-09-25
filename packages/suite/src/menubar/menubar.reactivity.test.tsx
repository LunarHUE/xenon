/**
 * Reactive menubar registration, controlled requests, repair, and isolation.
 *
 * These cases run under both the jsdom and the browser project, so every
 * activation is a synthetic click or keydown and focus is programmatic. Native
 * key, pointer, and IME input, real focus order, and RTL traversal live in
 * `menubar.native.test-browser.tsx`, and the shared native suite keeps
 * `menubar.test-browser.tsx`. Fixtures stay inside the mounted container, so
 * popup queries are container-scoped and portal behavior stays out of scope.
 *
 * @packageDocumentation
 */
import { Menubar } from '@xenon-ui/solid/menubar'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, Show, createSignal, flush } from 'solid-js'
import { describe, expect, onTestFinished, test } from 'vitest'

/** Renders a disposable fixture into body and returns container-scoped queries. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  // Physical hover must not switch menus during synthetic keyboard checks.
  container.style.margin = '100px'
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

/** Flushes Solid and two animation frames so popup presence and geometry settle. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/** Dispatches a synthetic keydown, without IME composition or a native default action. */
function press(element: HTMLElement, key: string) {
  flush()
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flush()
}

/**
 * One top-level menu whose identity is its lowercased label, with an optional
 * action text, reactive disabled flag, and per-menu open-change reporter.
 */
function TopMenu(props: {
  label: string
  action?: string
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Menubar.Menu value={props.label.toLowerCase()} onOpenChange={props.onOpenChange}>
      <Menubar.Trigger disabled={props.disabled}>{props.label}</Menubar.Trigger>
      <Menubar.Positioner>
        <Menubar.Content>
          <Menubar.Item>{props.action ?? `${props.label} action`}</Menubar.Item>
        </Menubar.Content>
      </Menubar.Positioner>
    </Menubar.Menu>
  )
}

describe('menubar reactive state', () => {
  test('menus registered after mount join the roving order and open by their own identity', async () => {
    const [labels, setLabels] = createSignal(['File', 'Edit'])
    const view = mount(() => (
      <Menubar aria-label="Editor">
        <For each={labels()}>{(label) => <TopMenu label={label} />}</For>
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    expect(view.getAllByRole('menuitem').map((element) => element.textContent)).toEqual([
      'File',
      'Edit',
    ])
    expect(file).toHaveAttribute('tabindex', '0')

    // The initial pair wraps among itself without opening anything.
    file.focus()
    press(file, 'ArrowRight')
    expect(edit).toHaveFocus()
    press(edit, 'ArrowRight')
    expect(file).toHaveFocus()
    expect(view.queryAllByRole('menu')).toHaveLength(0)

    setLabels(['File', 'Edit', 'View'])
    await settle()
    const viewTrigger = view.getByRole('menuitem', { name: 'View' })
    expect(view.getAllByRole('menuitem').map((element) => element.textContent)).toEqual([
      'File',
      'Edit',
      'View',
    ])
    expect(viewTrigger).toHaveAttribute('tabindex', '-1')

    // The appended menu is the last roving destination rather than an earlier one.
    press(file, 'ArrowRight')
    expect(edit).toHaveFocus()
    press(edit, 'ArrowRight')
    expect(viewTrigger).toHaveFocus()
    expect(viewTrigger).toHaveAttribute('tabindex', '0')
    press(viewTrigger, 'ArrowRight')
    expect(file).toHaveFocus()

    // Its own identity opens its popup and takes part in switching.
    viewTrigger.click()
    await settle()
    expect(viewTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(view.getByRole('menuitem', { name: 'View action' })).toBeTruthy()
    file.click()
    await settle()
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(viewTrigger).toHaveAttribute('aria-expanded', 'false')
    expect(view.getByRole('menuitem', { name: 'File action' })).toBeTruthy()
    expect(view.queryByRole('menuitem', { name: 'View action' })).toBeNull()
  })

  test('removing the trigger that holds the roving tab stop repairs it and unmounts its popup', async () => {
    const [labels, setLabels] = createSignal(['File', 'Edit', 'View'])
    const view = mount(() => (
      <Menubar aria-label="Editor">
        <For each={labels()}>{(label) => <TopMenu label={label} />}</For>
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    file.focus()
    press(file, 'ArrowRight')
    expect(edit).toHaveFocus()
    expect(edit).toHaveAttribute('tabindex', '0')
    expect(file).toHaveAttribute('tabindex', '-1')

    edit.click()
    await settle()
    expect(edit).toHaveAttribute('aria-expanded', 'true')
    expect(view.getByRole('menuitem', { name: 'Edit action' })).toBeTruthy()

    setLabels(['File', 'View'])
    await settle()
    expect(view.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
    expect(view.queryByRole('menuitem', { name: 'Edit action' })).toBeNull()
    expect(view.queryAllByRole('menu')).toHaveLength(0)

    // The first enabled survivor takes over the stop and keeps the surviving order.
    expect(file).toHaveAttribute('tabindex', '0')
    const viewTrigger = view.getByRole('menuitem', { name: 'View' })
    expect(viewTrigger).toHaveAttribute('tabindex', '-1')
    press(file, 'ArrowRight')
    expect(viewTrigger).toHaveFocus()

    viewTrigger.click()
    await settle()
    expect(viewTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(view.getByRole('menuitem', { name: 'View action' })).toBeTruthy()
  })

  test('reactively disabling a trigger repairs the tab stop, blocks opening, and is skipped in navigation', async () => {
    const [blocked, setBlocked] = createSignal(false)
    const view = mount(() => (
      <Menubar aria-label="Editor">
        <TopMenu label="File" />
        <TopMenu label="View" disabled={blocked()} />
        <TopMenu label="Edit" />
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const viewTrigger = view.getByRole('menuitem', { name: 'View' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    viewTrigger.focus()
    flush()
    expect(viewTrigger).toHaveAttribute('tabindex', '0')
    expect(viewTrigger).not.toHaveAttribute('aria-disabled')

    setBlocked(true)
    await settle()
    expect(viewTrigger).toHaveAttribute('aria-disabled', 'true')
    expect(viewTrigger).toHaveAttribute('data-disabled', '')
    expect(viewTrigger).toHaveAttribute('tabindex', '-1')
    expect(file).toHaveAttribute('tabindex', '0')

    // A newly disabled trigger no longer opens its popup.
    viewTrigger.click()
    await settle()
    expect(view.queryAllByRole('menu')).toHaveLength(0)
    expect(viewTrigger).toHaveAttribute('aria-expanded', 'false')

    // It is skipped by roving navigation that starts from the repaired stop.
    press(file, 'ArrowRight')
    expect(edit).toHaveFocus()
    expect(edit).toHaveAttribute('tabindex', '0')
    expect(viewTrigger).not.toHaveFocus()

    // Re-enabling restores reachability without opening anything on its own.
    setBlocked(false)
    await settle()
    expect(viewTrigger).not.toHaveAttribute('aria-disabled')
    expect(viewTrigger).not.toHaveAttribute('data-disabled')
    expect(edit).toHaveAttribute('tabindex', '0')
    expect(view.queryAllByRole('menu')).toHaveLength(0)

    press(edit, 'ArrowLeft')
    expect(viewTrigger).toHaveFocus()
    viewTrigger.click()
    await settle()
    expect(viewTrigger).toHaveAttribute('aria-expanded', 'true')
    expect(view.getByRole('menuitem', { name: 'View action' })).toBeTruthy()
  })

  test('a controlled menubar reports rejected open and close requests without changing its popup', async () => {
    const changes: (string | null)[] = []
    const view = mount(() => (
      <Menubar aria-label="Editor" value="file" onValueChange={(next) => changes.push(next)}>
        <TopMenu label="File" action="New" />
        <TopMenu label="Edit" action="Copy" />
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    await settle()

    // The controlled identity is already open, and mounting it is not reported.
    expect(changes).toEqual([])
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(view.queryAllByRole('menu')).toHaveLength(1)
    expect(view.getByRole('menuitem', { name: 'New' })).toBeTruthy()

    edit.click()
    await settle()
    expect(changes.at(-1)).toBe('edit')
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(edit).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryAllByRole('menu')).toHaveLength(1)
    expect(view.getByRole('menuitem', { name: 'New' })).toBeTruthy()
    expect(view.queryByRole('menuitem', { name: 'Copy' })).toBeNull()

    file.click()
    await settle()
    expect(changes.at(-1)).toBeNull()
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(view.queryAllByRole('menu')).toHaveLength(1)
    expect(view.getByRole('menuitem', { name: 'New' })).toBeTruthy()
  })

  test('an accepted controlled value mounts, swaps, and unmounts the requested popup silently', async () => {
    const [value, setValue] = createSignal<string | null>(null)
    const changes: (string | null)[] = []
    const view = mount(() => (
      <Menubar aria-label="Editor" value={value()} onValueChange={(next) => changes.push(next)}>
        <TopMenu label="File" action="New" />
        <TopMenu label="Edit" action="Copy" />
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    expect(view.queryAllByRole('menu')).toHaveLength(0)
    expect(file).toHaveAttribute('aria-expanded', 'false')

    setValue('file')
    await settle()
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(edit).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryAllByRole('menu')).toHaveLength(1)
    expect(view.getByRole('menuitem', { name: 'New' })).toBeTruthy()

    setValue('edit')
    await settle()
    expect(edit).toHaveAttribute('aria-expanded', 'true')
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryAllByRole('menu')).toHaveLength(1)
    expect(view.getByRole('menuitem', { name: 'Copy' })).toBeTruthy()
    expect(view.queryByRole('menuitem', { name: 'New' })).toBeNull()

    setValue(null)
    await settle()
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(edit).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryAllByRole('menu')).toHaveLength(0)

    // Parent-driven visibility changes never echo back as change requests.
    expect(changes).toEqual([])
  })

  test('two menubars keep independent tab stops, open menus, and change callbacks', async () => {
    const [showFirstEdit, setShowFirstEdit] = createSignal(true)
    const firstChanges: (string | null)[] = []
    const secondChanges: (string | null)[] = []
    const view = mount(() => (
      <>
        <Menubar aria-label="First" onValueChange={(next) => firstChanges.push(next)}>
          <TopMenu label="File" action="New" />
          <Show when={showFirstEdit()}>
            <TopMenu label="Edit" action="Copy" />
          </Show>
        </Menubar>
        <Menubar aria-label="Second" onValueChange={(next) => secondChanges.push(next)}>
          <TopMenu label="File" action="Open" />
          <TopMenu label="Edit" action="Save" />
        </Menubar>
      </>
    ))
    const menubars = view.getAllByRole('menubar')
    const first = within(menubars[0]!)
    const second = within(menubars[1]!)
    const firstFile = first.getByRole('menuitem', { name: 'File' })
    const secondFile = second.getByRole('menuitem', { name: 'File' })

    // Each bar owns exactly one roving stop.
    expect(firstFile).toHaveAttribute('tabindex', '0')
    expect(first.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabindex', '-1')
    expect(secondFile).toHaveAttribute('tabindex', '0')
    expect(second.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabindex', '-1')

    firstFile.click()
    await settle()
    expect(firstChanges).toEqual(['file'])
    expect(secondChanges).toEqual([])
    expect(first.queryAllByRole('menu')).toHaveLength(1)
    expect(first.getByRole('menuitem', { name: 'New' })).toBeTruthy()
    expect(second.queryAllByRole('menu')).toHaveLength(0)

    // The same identity in the second bar opens independently of the first.
    secondFile.click()
    await settle()
    expect(secondChanges).toEqual(['file'])
    expect(second.getByRole('menuitem', { name: 'Open' })).toBeTruthy()
    expect(first.queryAllByRole('menu')).toHaveLength(1)
    expect(first.getByRole('menuitem', { name: 'New' })).toBeTruthy()

    // Roving inside the second bar leaves the first bar's stop and popup alone.
    press(secondFile, 'ArrowLeft')
    expect(second.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabindex', '0')
    expect(firstFile).toHaveAttribute('tabindex', '0')
    expect(first.queryAllByRole('menu')).toHaveLength(1)

    // Removing a menu from the first bar does not disturb the second bar.
    setShowFirstEdit(false)
    await settle()
    expect(first.queryByRole('menuitem', { name: 'Edit' })).toBeNull()
    expect(second.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabindex', '0')
    expect(second.queryAllByRole('menu')).toHaveLength(1)
    expect(second.getByRole('menuitem', { name: 'Save' })).toBeTruthy()
    expect(secondChanges).toEqual(['file', null, 'edit'])
  })

  test('each top-level menu reports its own open-change transitions across a bar switch', async () => {
    const fileOpens: boolean[] = []
    const editOpens: boolean[] = []
    const view = mount(() => (
      <Menubar aria-label="Editor">
        <TopMenu
          label="File"
          action="New"
          onOpenChange={(open) => {
            fileOpens.push(open)
          }}
        />
        <TopMenu
          label="Edit"
          action="Copy"
          onOpenChange={(open) => {
            editOpens.push(open)
          }}
        />
      </Menubar>
    ))
    const file = view.getByRole('menuitem', { name: 'File' })
    const edit = view.getByRole('menuitem', { name: 'Edit' })
    expect(fileOpens).toEqual([])
    expect(editOpens).toEqual([])

    file.click()
    await settle()
    expect(fileOpens).toEqual([true])
    expect(editOpens).toEqual([])

    // Switching reports the previous menu's close before the new menu's open.
    edit.click()
    await settle()
    expect(editOpens).toEqual([true])
    expect(fileOpens).toEqual([true, false])

    edit.click()
    await settle()
    expect(editOpens).toEqual([true, false])
    expect(fileOpens).toEqual([true, false])
    expect(view.queryAllByRole('menu')).toHaveLength(0)
  })
})
