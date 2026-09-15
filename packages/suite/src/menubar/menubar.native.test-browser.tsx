/**
 * Native menubar boundaries: real RTL traversal, disabled top-level items,
 * submenu return versus top-level switching, and Tab/outside dismissal. Menu
 * registration, controlled open requests and repair stay in the shared and
 * reactive suites; every case here needs a real engine's key and pointer input.
 *
 * @packageDocumentation
 */
import { Menubar } from '@xenon/solid/menubar'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

/** Flushes Solid and one timer turn so native focus and layout work settles. */
async function settle() {
  flush()
  await new Promise((resolve) => setTimeout(resolve, 60))
  flush()
}

/** Renders one fixture into its own host and returns body-scoped queries. */
function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(document.body)
}

/** File menu with a keyed submenu plus a sibling Edit menu, for level handoffs. */
function NestedBar(props: { dir?: 'ltr' | 'rtl' } = {}) {
  return (
    <Menubar aria-label="Editor" dir={props.dir}>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.Sub>
              <Menubar.SubTrigger>More</Menubar.SubTrigger>
              <Menubar.Portal>
                <Menubar.Positioner>
                  <Menubar.Content>
                    <Menubar.Item>Deep</Menubar.Item>
                  </Menubar.Content>
                </Menubar.Positioner>
              </Menubar.Portal>
            </Menubar.Sub>
            <Menubar.Item>Save</Menubar.Item>
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

describe('menubar native keyboard, pointer and level boundaries', () => {
  test('Tab enters a menubar whose first trigger is disabled, and Home/End stop at the enabled endpoints', async () => {
    const query = mount(() => (
      <>
        <button>Before</button>
        <Menubar aria-label="Editor">
          <Menubar.Menu value="blocked">
            <Menubar.Trigger disabled>Blocked</Menubar.Trigger>
          </Menubar.Menu>
          <Menubar.Menu value="file">
            <Menubar.Trigger>File</Menubar.Trigger>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger>Edit</Menubar.Trigger>
          </Menubar.Menu>
          <Menubar.Menu value="last">
            <Menubar.Trigger disabled>Last</Menubar.Trigger>
          </Menubar.Menu>
        </Menubar>
        <button>After</button>
      </>
    ))
    const file = query.getByRole('menuitem', { name: 'File' })
    const edit = query.getByRole('menuitem', { name: 'Edit' })
    // The disabled endpoints stay out of the tab order; the first enabled trigger is the stop.
    expect(query.getByRole('menuitem', { name: 'Blocked' })).toHaveAttribute('tabindex', '-1')
    expect(query.getByRole('menuitem', { name: 'Last' })).toHaveAttribute('tabindex', '-1')
    expect(file).toHaveAttribute('tabindex', '0')

    query.getByRole('button', { name: 'Before' }).focus()
    await userEvent.keyboard('{Tab}')
    expect(file).toHaveFocus()
    expect(file).toHaveAttribute('aria-expanded', 'false')

    // End selects the last enabled trigger before the disabled tail, Home returns.
    await userEvent.keyboard('{End}')
    expect(edit).toHaveFocus()
    expect(edit).toHaveAttribute('tabindex', '0')
    expect(file).toHaveAttribute('tabindex', '-1')
    expect(query.queryByRole('menu')).toBeNull()

    await userEvent.keyboard('{Home}')
    expect(file).toHaveFocus()
    expect(query.queryByRole('menu')).toBeNull()
  })

  test('top-level typeahead moves focus cyclically among enabled triggers without opening a menu', async () => {
    const query = mount(() => (
      <Menubar aria-label="Editor">
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
        </Menubar.Menu>
        <Menubar.Menu value="format">
          <Menubar.Trigger disabled>Format</Menubar.Trigger>
        </Menubar.Menu>
        <Menubar.Menu value="view">
          <Menubar.Trigger>View</Menubar.Trigger>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger>Edit</Menubar.Trigger>
        </Menubar.Menu>
      </Menubar>
    ))
    const file = query.getByRole('menuitem', { name: 'File' })
    const format = query.getByRole('menuitem', { name: 'Format' })
    const view = query.getByRole('menuitem', { name: 'View' })
    const edit = query.getByRole('menuitem', { name: 'Edit' })
    file.focus()

    // 'v' skips disabled Format and lands on View; typing only moves focus.
    await userEvent.keyboard('v')
    expect(view).toHaveFocus()
    expect(format).not.toHaveFocus()
    expect(query.queryByRole('menu')).toBeNull()
    expect(view).toHaveAttribute('aria-expanded', 'false')

    await userEvent.keyboard('e')
    expect(edit).toHaveFocus()

    // The search wraps past the end back to the first match and stays put with no match.
    await userEvent.keyboard('f')
    expect(file).toHaveFocus()
    await userEvent.keyboard('z')
    expect(file).toHaveFocus()
    expect(view).not.toHaveFocus()
    expect(query.queryByRole('menu')).toBeNull()
  })

  test('disabled trigger ignores native click and hover, while hover switches enabled menus without focusing their first item', async () => {
    const query = mount(() => (
      <Menubar aria-label="Editor">
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>New</Menubar.Item>
              <Menubar.Item>Save</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
        <Menubar.Menu value="blocked">
          <Menubar.Trigger disabled>Blocked</Menubar.Trigger>
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
    ))
    const file = query.getByRole('menuitem', { name: 'File' })
    const blocked = query.getByRole('menuitem', { name: 'Blocked' })
    const edit = query.getByRole('menuitem', { name: 'Edit' })
    expect(blocked).toHaveAttribute('aria-disabled', 'true')
    expect(blocked).toHaveAttribute('data-disabled')
    expect(blocked).toHaveAttribute('tabindex', '-1')

    // A disabled trigger opens nothing on its own.
    await userEvent.click(blocked, { force: true })
    await settle()
    expect(query.queryByRole('menu')).toBeNull()
    expect(blocked).toHaveAttribute('aria-expanded', 'false')
    expect(file).toHaveAttribute('aria-expanded', 'false')

    // A click takes the popup surface, not its first item.
    await userEvent.click(file)
    await settle()
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(query.getByRole('menu')).toHaveFocus()
    expect(query.getByRole('menuitem', { name: 'New' })).not.toHaveFocus()

    // Hover over the disabled trigger must not switch the open menu.
    await userEvent.hover(blocked)
    await settle()
    expect(file).toHaveAttribute('aria-expanded', 'true')
    expect(edit).toHaveAttribute('aria-expanded', 'false')

    // Hover over an enabled trigger switches the surface without focusing its first item.
    await userEvent.hover(edit)
    await settle()
    expect(edit).toHaveAttribute('aria-expanded', 'true')
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(query.queryByRole('menuitem', { name: 'New' })).toBeNull()
    expect(query.getByRole('menu')).toHaveFocus()
    expect(query.getByRole('menuitem', { name: 'Copy' })).not.toHaveFocus()
  })

  test('LTR ArrowLeft returns from a nested submenu before a second ArrowLeft traverses to the previous top-level menu', async () => {
    const query = mount(() => <NestedBar />)
    const file = query.getByRole('menuitem', { name: 'File' })
    const edit = query.getByRole('menuitem', { name: 'Edit' })
    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    const more = query.getByRole('menuitem', { name: 'More' })
    expect(more).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Deep' })).toHaveFocus()
    expect(more).toHaveAttribute('aria-expanded', 'true')

    // ArrowLeft inside the submenu only returns to its trigger: the parent menu stays open.
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(more).toHaveFocus()
    expect(query.queryByRole('menuitem', { name: 'Deep' })).toBeNull()
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(file).toHaveAttribute('aria-expanded', 'true')

    // From a root item the same key traverses top-level menus, closing the previous menu.
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
    expect(edit).toHaveAttribute('aria-expanded', 'true')
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(query.queryByRole('menuitem', { name: 'More' })).toBeNull()
  })

  test('Tab and Shift+Tab from a nested submenu close every level and leave the menubar in document order', async () => {
    const query = mount(() => (
      <>
        <button>Before</button>
        <NestedBar />
        <button>After</button>
      </>
    ))
    const file = query.getByRole('menuitem', { name: 'File' })
    const before = query.getByRole('button', { name: 'Before' })
    const after = query.getByRole('button', { name: 'After' })

    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Deep' })).toHaveFocus()

    // Tab leaves the whole chain and proceeds from the restored root trigger.
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(after).toHaveFocus()
    expect(query.queryAllByRole('menu')).toHaveLength(0)
    expect(query.queryByRole('menuitem', { name: 'Deep' })).toBeNull()
    expect(file).toHaveAttribute('aria-expanded', 'false')

    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Deep' })).toHaveFocus()

    // Shift+Tab does the same in the reverse direction.
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await settle()
    expect(before).toHaveFocus()
    expect(query.queryAllByRole('menu')).toHaveLength(0)
    expect(file).toHaveAttribute('aria-expanded', 'false')
  })

  test('an outside pointer press closes the whole open menu chain without stealing focus from the outside target', async () => {
    const query = mount(() => (
      <>
        <Menubar aria-label="Editor">
          <Menubar.Menu value="file">
            <Menubar.Trigger>File</Menubar.Trigger>
            <Menubar.Positioner>
              <Menubar.Content>
                <Menubar.Sub>
                  <Menubar.SubTrigger>More</Menubar.SubTrigger>
                  <Menubar.Portal>
                    <Menubar.Positioner>
                      <Menubar.Content>
                        <Menubar.Item>Deep</Menubar.Item>
                      </Menubar.Content>
                    </Menubar.Positioner>
                  </Menubar.Portal>
                </Menubar.Sub>
              </Menubar.Content>
            </Menubar.Positioner>
          </Menubar.Menu>
        </Menubar>
        <button style={{ position: 'fixed', right: '0', bottom: '0' }}>Outside</button>
      </>
    ))
    const file = query.getByRole('menuitem', { name: 'File' })
    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Deep' })).toHaveFocus()

    const outside = query.getByRole('button', { name: 'Outside' })
    await userEvent.click(outside)
    await settle()
    expect(query.queryAllByRole('menu')).toHaveLength(0)
    expect(file).toHaveAttribute('aria-expanded', 'false')
    expect(outside).toHaveFocus()
    expect(file).not.toHaveFocus()
  })

  test('RTL menubar mirrors closed-bar roving and boundaries and returns from a submenu with ArrowRight', async () => {
    const query = mount(() => <NestedBar dir="rtl" />)
    const file = query.getByRole('menuitem', { name: 'File' })
    const edit = query.getByRole('menuitem', { name: 'Edit' })
    file.focus()

    // In RTL, ArrowLeft is forward and ArrowRight is backward; both wrap.
    await userEvent.keyboard('{ArrowLeft}')
    expect(edit).toHaveFocus()
    expect(query.queryByRole('menu')).toBeNull()
    await userEvent.keyboard('{ArrowLeft}')
    expect(file).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(edit).toHaveFocus()

    // ArrowLeft opens the submenu in RTL and ArrowRight closes only that level.
    file.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    const more = query.getByRole('menuitem', { name: 'More' })
    expect(more).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    await settle()
    expect(query.getByRole('menuitem', { name: 'Deep' })).toHaveFocus()
    expect(more).toHaveAttribute('aria-expanded', 'true')

    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect(more).toHaveFocus()
    expect(query.queryByRole('menuitem', { name: 'Deep' })).toBeNull()
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(file).toHaveAttribute('aria-expanded', 'true')
  })
})
