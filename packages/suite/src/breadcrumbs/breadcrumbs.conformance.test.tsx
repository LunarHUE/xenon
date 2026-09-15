import { render } from '@solidjs/web'
import { Breadcrumbs } from '@tenon/solid/breadcrumbs'
import { flush } from 'solid-js'
import { afterEach, expect } from 'vitest'
import { expectNoViolations } from '../a11y'
import { spec } from '../spec'
let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
spec('breadcrumbs.alpha.1', async () => {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <Breadcrumbs>
        <Breadcrumbs.List>
          <Breadcrumbs.Item>
            <Breadcrumbs.Link href="#home">Home</Breadcrumbs.Link>
            <Breadcrumbs.Separator>/</Breadcrumbs.Separator>
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>
            <Breadcrumbs.Current>Settings</Breadcrumbs.Current>
          </Breadcrumbs.Item>
        </Breadcrumbs.List>
      </Breadcrumbs>
    ),
    host
  )
  flush()
  expect(host.querySelector('nav')).toHaveAttribute('aria-label', 'Breadcrumbs')
  expect(host.querySelectorAll('ol > li')).toHaveLength(2)
  const link = host.querySelector('a')!
  link.focus()
  expect(link).toHaveFocus()
  expect(link).toHaveAttribute('href', '#home')
  const current = host.querySelector('[aria-current]') as HTMLElement
  expect(current.tagName).toBe('SPAN')
  current.focus()
  expect(current).not.toHaveFocus()
  expect(host.querySelector('[aria-hidden]')).toHaveTextContent('/')
  await expectNoViolations(host)
})
