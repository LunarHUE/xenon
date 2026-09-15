import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush, For } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { Pagination } from './pagination'
test('uncontrolled controls update render ranges and boundary disabling', () => {
  const change = vi.fn()
  const { getByRole, queryByRole } = render(() => (
    <Pagination count={10} onPageChange={change}>
      {(state) => (
        <>
          <Pagination.Previous>Previous</Pagination.Previous>
          <For each={state.pages}>
            {(item) =>
              typeof item === 'number' ? (
                <Pagination.Item page={item}>{item}</Pagination.Item>
              ) : (
                <Pagination.Ellipsis>…</Pagination.Ellipsis>
              )
            }
          </For>
          <Pagination.Next>Next</Pagination.Next>
        </>
      )}
    </Pagination>
  ))
  const next = getByRole('button', { name: 'Next page' })
  expect(getByRole('navigation', { name: 'Pagination' })).toBeTruthy()
  expect(getByRole('button', { name: 'Previous page' })).toBeDisabled()
  expect(queryByRole('button', { name: 'Page 3' })).toBeNull()
  fireEvent.click(next)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(2)
  expect(getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page')
  expect(getByRole('button', { name: 'Page 3' })).toBeTruthy()
  expect(getByRole('button', { name: 'Next page' })).toBe(next)
})
test('controlled state stays owner-driven and count clamps silently', () => {
  const [count, setCount] = createSignal(5)
  const change = vi.fn()
  const { getByRole } = render(() => (
    <Pagination count={count()} page={4} onPageChange={change}>
      <Pagination.Item page={4}>Four</Pagination.Item>
      <Pagination.Next>Next</Pagination.Next>
    </Pagination>
  ))
  fireEvent.click(getByRole('button', { name: 'Next page' }))
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(5)
  expect(getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page')
  setCount(2)
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(getByRole('button', { name: 'Next page' })).toBeDisabled()
})
test('author cancellation blocks selection and disabled links lose navigation', () => {
  const change = vi.fn()
  const author = vi.fn()
  const { getByRole, getByText } = render(() => (
    <Pagination count={3} onPageChange={change}>
      <Pagination.Item page={2} onClick={(event) => event.preventDefault()}>
        Two
      </Pagination.Item>
      <Pagination.Next as="a" href="#next">
        Next
      </Pagination.Next>
      <Pagination.Previous as="a" href="#previous" onClick={author}>
        Previous
      </Pagination.Previous>
    </Pagination>
  ))
  fireEvent.click(getByRole('button', { name: 'Page 2' }))
  expect(change).not.toHaveBeenCalled()
  expect(getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '#next')
  const previous = getByText('Previous')
  expect(previous).not.toHaveAttribute('href')
  expect(previous).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(previous)
  expect(author).not.toHaveBeenCalled()
})
