import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Breadcrumbs } from './breadcrumbs'
test('renders named navigation, native ordered entries and current text', () => {
  const { getByRole, getAllByRole, getByText } = render(() => (
    <Breadcrumbs aria-label="Location">
      <Breadcrumbs.List>
        <Breadcrumbs.Item>
          <Breadcrumbs.Link href="/">Home</Breadcrumbs.Link>
          <Breadcrumbs.Separator>/</Breadcrumbs.Separator>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>
          <Breadcrumbs.Current>Settings</Breadcrumbs.Current>
        </Breadcrumbs.Item>
      </Breadcrumbs.List>
    </Breadcrumbs>
  ))
  expect(getByRole('navigation', { name: 'Location' }).tagName).toBe('NAV')
  expect(getByRole('list').tagName).toBe('OL')
  expect(getAllByRole('listitem')).toHaveLength(2)
  expect(getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  expect(getByText('Settings')).toHaveAttribute('aria-current', 'page')
  expect(getByText('Settings')).not.toHaveAttribute('tabindex')
  expect(getByText('/')).toHaveAttribute('aria-hidden', 'true')
})
test('current links remain navigable and update without replacing children', () => {
  const [current, setCurrent] = createSignal(false)
  const { getByRole } = render(() => (
    <Breadcrumbs>
      <Breadcrumbs.Link current={current()} href="/settings">
        Settings
      </Breadcrumbs.Link>
    </Breadcrumbs>
  ))
  const link = getByRole('link')
  expect(link).not.toHaveAttribute('aria-current')
  setCurrent(true)
  flush()
  expect(getByRole('link')).toBe(link)
  expect(link).toHaveAttribute('aria-current', 'page')
  expect(link).toHaveAttribute('href', '/settings')
  expect(link).not.toHaveAttribute('tabindex')
})
