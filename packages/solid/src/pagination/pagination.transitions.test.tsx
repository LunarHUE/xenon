import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { Pagination } from './pagination'

test('controlled pagination proposals stay pending until the parent accepts them', () => {
  const [page, setPage] = createSignal(2)
  const change = vi.fn()
  const view = render(() => (
    <Pagination count={4} page={page()} onPageChange={change}>
      <Pagination.Item page={2}>Two</Pagination.Item>
      <Pagination.Item page={3}>Three</Pagination.Item>
      <Pagination.Next>Next</Pagination.Next>
    </Pagination>
  ))
  const next = view.getByRole('button', { name: 'Next page' })

  fireEvent.click(next)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(3)
  expect(view.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  expect(view.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute('aria-current')
  setPage(3)
  flush()
  expect(view.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
  expect(change).toHaveBeenCalledTimes(1)

  setPage(2)
  flush()
  expect(view.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  expect(view.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute('aria-current')
})

test('pagination returns to its stored page when controlled input becomes undefined', () => {
  const [page, setPage] = createSignal<number | undefined>(3)
  const view = render(() => (
    <Pagination count={5} page={page()} defaultPage={2}>
      <Pagination.Item page={2}>Two</Pagination.Item>
      <Pagination.Item page={3}>Three</Pagination.Item>
    </Pagination>
  ))

  expect(view.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
  setPage(undefined)
  flush()
  expect(view.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  expect(view.getByRole('button', { name: 'Page 3' })).not.toHaveAttribute('aria-current')
})

test('a pagination count below one still exposes one usable page', () => {
  const view = render(() => (
    <Pagination count={0}>
      <Pagination.Item page={1}>Only page</Pagination.Item>
      <Pagination.Previous>Previous</Pagination.Previous>
      <Pagination.Next>Next</Pagination.Next>
    </Pagination>
  ))

  expect(view.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page')
  expect(view.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  expect(view.getByRole('button', { name: 'Next page' })).toBeDisabled()
})
