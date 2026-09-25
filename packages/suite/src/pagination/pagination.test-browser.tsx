import { render } from '@solidjs/web'
import { Pagination } from '@xenon-ui/solid/pagination'
import { flush } from 'solid-js'
import { afterEach, expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { spec } from '../spec'
let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
spec('pagination.alpha.2', async () => {
  host = document.createElement('div')
  document.body.append(host)
  const change = vi.fn()
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  dispose = render(
    () => (
      <form onSubmit={submit}>
        <Pagination count={3} onPageChange={change}>
          <Pagination.Previous>Previous</Pagination.Previous>
          <Pagination.Item page={1}>One</Pagination.Item>
          <Pagination.Item page={2}>Two</Pagination.Item>
          <Pagination.Next>Next</Pagination.Next>
        </Pagination>
      </form>
    ),
    host
  )
  flush()
  const one = host.querySelector('[aria-label="Page 1"]') as HTMLElement
  const two = host.querySelector('[aria-label="Page 2"]') as HTMLElement
  one.focus()
  await userEvent.tab()
  expect(two).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(2)
  expect(two).toHaveAttribute('aria-current', 'page')
  expect(submit).not.toHaveBeenCalled()
  await userEvent.tab()
  expect(host.querySelector('[aria-label="Next page"]')).toHaveFocus()
  await userEvent.keyboard(' ')
  flush()
  expect(change).toHaveBeenLastCalledWith(3)
  expect(submit).not.toHaveBeenCalled()
})
spec('pagination.alpha.3', async () => {
  host = document.createElement('div')
  document.body.append(host)
  const change = vi.fn()
  dispose = render(
    () => (
      <Pagination count={3} onPageChange={change}>
        <Pagination.Previous as="a" href="#previous">
          Previous
        </Pagination.Previous>
        <Pagination.Item as="a" href="#two" page={2}>
          Two
        </Pagination.Item>
      </Pagination>
    ),
    host
  )
  flush()
  const previous = host.querySelector('[aria-label="Previous page"]') as HTMLElement
  const link = host.querySelector('[aria-label="Page 2"]') as HTMLAnchorElement
  expect(previous).not.toHaveAttribute('href')
  expect(link).not.toHaveAttribute('role')
  link.focus()
  await userEvent.keyboard(' ')
  flush()
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('{Enter}')
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(2)
  expect(link).toHaveAttribute('href', '#two')
})
