import { render } from '@solidjs/web'
import { Pagination } from '@tenon/solid/pagination'
import { flush, For } from 'solid-js'
import { fireEvent } from '@testing-library/dom'
import { afterEach, expect, vi } from 'vitest'
import { expectNoViolations } from '../a11y'
import { spec } from '../spec'
let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
spec('pagination.alpha.1', async () => {
  host = document.createElement('div')
  document.body.append(host)
  const change = vi.fn()
  dispose = render(
    () => (
      <Pagination count={10} onPageChange={change}>
        {(state) => (
          <>
            <Pagination.Previous>Previous</Pagination.Previous>
            <For each={state.pages}>
              {(page) =>
                typeof page === 'number' ? (
                  <Pagination.Item page={page}>{page}</Pagination.Item>
                ) : (
                  <Pagination.Ellipsis>…</Pagination.Ellipsis>
                )
              }
            </For>
            <Pagination.Next>Next</Pagination.Next>
          </>
        )}
      </Pagination>
    ),
    host
  )
  flush()
  expect(host.querySelector('nav')).toHaveAttribute('aria-label', 'Pagination')
  expect(host.querySelector('[aria-label="Previous page"]')).toBeDisabled()
  expect(host.querySelector('[aria-current="page"]')).toHaveTextContent('1')
  const next = host.querySelector('[aria-label="Next page"]')!
  fireEvent.click(next)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(2)
  expect(host.querySelector('[aria-current="page"]')).toHaveTextContent('2')
  expect(host.querySelectorAll('[tabindex]')).toHaveLength(0)
  expect(host.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  await expectNoViolations(host)
})
