import { render } from '@solidjs/web'
import { Pagination } from '@xenon/solid/pagination'
import { flush, For } from 'solid-js'
import { fireEvent } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

test('pagination.alpha.1 asserts both disabled boundaries and the changing ellipsis range', () => {
  host = document.createElement('div')
  document.body.append(host)
  const change = vi.fn()
  dispose = render(
    () => (
      <Pagination count={20} siblingCount={2} onPageChange={change}>
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

  const previous = host.querySelector('[aria-label="Previous page"]')!
  const next = host.querySelector('[aria-label="Next page"]')!
  expect(previous).toBeDisabled()
  expect(next).not.toBeDisabled()
  expect(host.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)

  fireEvent.click(host.querySelector('[aria-label="Page 3"]')!)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(3)
  expect(host.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  fireEvent.click(host.querySelector('[aria-label="Page 5"]')!)
  flush()
  expect(change).toHaveBeenLastCalledWith(5)
  expect(host.querySelector('[aria-label="Previous page"]')).not.toBeDisabled()
  fireEvent.click(host.querySelector('[aria-label="Page 7"]')!)
  flush()
  fireEvent.click(host.querySelector('[aria-label="Page 9"]')!)
  flush()
  fireEvent.click(host.querySelector('[aria-label="Page 10"]')!)
  flush()
  expect(host.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  expect(host.querySelector('[aria-current="page"]')).toHaveTextContent('10')

  fireEvent.click(host.querySelector('[aria-label="Page 20"]')!)
  flush()
  expect(change).toHaveBeenLastCalledWith(20)
  expect(host.querySelector('[aria-label="Next page"]')).toBeDisabled()
  expect(host.querySelector('[aria-label="Previous page"]')).not.toBeDisabled()
})
