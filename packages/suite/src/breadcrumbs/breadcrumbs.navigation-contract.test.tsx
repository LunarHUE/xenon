import { render as renderSolid } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Breadcrumbs } from '@xenon-ui/solid/breadcrumbs'

const cleanups: (() => void)[] = []
afterEach(() =>
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
)
function render(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = renderSolid(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return within(root)
}

test('moving the current route clears the old marker and preserves native links and their focus', async () => {
  const user = userEvent.setup()
  const [route, setRoute] = createSignal('home')
  const view = render(() => (
    <Breadcrumbs>
      <Breadcrumbs.List>
        <Breadcrumbs.Item>
          <Breadcrumbs.Link href="#home" current={route() === 'home'}>
            Home
          </Breadcrumbs.Link>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>
          <Breadcrumbs.Link href="#settings" current={route() === 'settings'}>
            Settings
          </Breadcrumbs.Link>
        </Breadcrumbs.Item>
      </Breadcrumbs.List>
    </Breadcrumbs>
  ))
  const home = view.getByRole('link', { name: 'Home' })
  const settings = view.getByRole('link', { name: 'Settings' })
  await user.tab()
  expect(home).toHaveFocus()
  setRoute('settings')
  flush()
  expect(view.getByRole('link', { name: 'Home' })).toBe(home)
  expect(home).toHaveFocus()
  expect(home).not.toHaveAttribute('aria-current')
  expect(settings).toHaveAttribute('aria-current', 'page')
  expect(settings).toHaveAttribute('href', '#settings')
  await user.tab()
  expect(settings).toHaveFocus()
  setRoute('elsewhere')
  flush()
  expect(home).not.toHaveAttribute('aria-current')
  expect(settings).not.toHaveAttribute('aria-current')
  expect(settings).toHaveFocus()
})

test.each([false, true])(
  'modifier click reaches the author once and retains cancellation=%s',
  (cancel) => {
    const click = vi.fn((event: MouseEvent) => {
      if (cancel) event.preventDefault()
    })
    const view = render(() => (
      <Breadcrumbs>
        <Breadcrumbs.Link href="#reports" current target="_blank" rel="noopener" onClick={click}>
          Reports
        </Breadcrumbs.Link>
      </Breadcrumbs>
    ))
    const link = view.getByRole('link', { name: 'Reports' })
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ctrlKey: true,
      shiftKey: true,
    })
    fireEvent(link, event)
    expect(click).toHaveBeenCalledExactlyOnceWith(event)
    expect(event.ctrlKey).toBe(true)
    expect(event.shiftKey).toBe(true)
    expect(event.defaultPrevented).toBe(cancel)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener')
    expect(link).toHaveAttribute('aria-current', 'page')
  }
)

test('separate breadcrumb landmarks retain independent names and decorative separators through updates', () => {
  const [name, setName] = createSignal('Project location')
  const [title, setTitle] = createSignal('Overview')
  const view = render(() => (
    <>
      <span id="project-trail-name">{name()}</span>
      <Breadcrumbs aria-labelledby="project-trail-name">
        <Breadcrumbs.List>
          <Breadcrumbs.Item>
            <Breadcrumbs.Link href="#project">Project</Breadcrumbs.Link>
            <Breadcrumbs.Separator>
              <svg role="img" aria-label="Chevron">
                <title>Chevron</title>
              </svg>
            </Breadcrumbs.Separator>
            <Breadcrumbs.Current>{title()}</Breadcrumbs.Current>
          </Breadcrumbs.Item>
        </Breadcrumbs.List>
      </Breadcrumbs>
      <Breadcrumbs aria-label="Account location">
        <Breadcrumbs.Current>Account</Breadcrumbs.Current>
      </Breadcrumbs>
    </>
  ))
  const project = view.getByRole('navigation', { name: 'Project location' })
  const account = view.getByRole('navigation', { name: 'Account location' })
  expect(view.queryByRole('img')).toBeNull()
  const current = view.getByText('Overview')
  setName('Workspace location')
  setTitle('Activity')
  flush()
  expect(view.getByRole('navigation', { name: 'Workspace location' })).toBe(project)
  expect(view.getByRole('navigation', { name: 'Account location' })).toBe(account)
  expect(view.getByText('Activity')).toBe(current)
  expect(current).toHaveAttribute('aria-current', 'page')
  expect(current).not.toHaveAttribute('role')
  expect(current).not.toHaveAttribute('tabindex')
  expect(view.queryByRole('img')).toBeNull()
})
