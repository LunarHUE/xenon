// Regressions reported while wrapping Xenon in Abstract's solid-ui (0.2.0 on Solid rc.14).
// vitest-setup.ts also fails any test here that logs LOWERCASE_EVENT_ATTRIBUTE or
// STRICT_READ_UNTRACKED, which covers the event-prop and RangeCalendar.Heading reports.
import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Button } from '../button'
import { Calendar } from '../calendar'
import { createDate } from '../date'
import { Editable } from '../editable'
import { Pagination } from '../pagination'
import { RangeCalendar } from '../range-calendar'
import { Slider } from '../slider'

afterEach(cleanup)

test('clicks on spread parts reach their core handlers', () => {
  const page = vi.fn()
  const pressed = vi.fn()
  const date = vi.fn()
  const view = render(() => (
    <>
      <Button as="span" onClick={pressed}>
        Span button
      </Button>
      <Pagination count={5} defaultPage={1} onPageChange={page}>
        <Pagination.Item page={2}>Two</Pagination.Item>
        <Pagination.Next>Next</Pagination.Next>
      </Pagination>
      <Editable defaultValue="Title">
        <Editable.Preview />
        <Editable.Input />
      </Editable>
      <Calendar today={createDate(2024, 2, 15)} onValueChange={date}>
        <Calendar.Grid />
      </Calendar>
    </>
  ))
  flush()
  fireEvent.click(view.getByText('Span button'))
  fireEvent.click(view.getByText('Two'))
  flush()
  fireEvent.click(view.getByRole('button', { name: 'Next page' }))
  fireEvent.click(view.getByRole('button', { name: 'Title' }))
  fireEvent.click(
    view.container.querySelector('button[data-date="2024-02-20"]:not([data-outside-month])')!
  )
  flush()
  expect(pressed).toHaveBeenCalledOnce()
  expect(page.mock.calls).toEqual([[2], [3]])
  expect(view.container.querySelector('input')).not.toHaveAttribute('hidden')
  expect(date).toHaveBeenCalledOnce()
})

test('RangeCalendar with a Heading mounts without strict-read warnings or rerenders', async () => {
  const view = render(() => (
    <RangeCalendar
      today={createDate(2026, 10, 12)}
      defaultValue={{ start: createDate(2026, 10, 5), end: createDate(2026, 10, 9) }}
    >
      <RangeCalendar.Header>
        <RangeCalendar.Heading />
      </RangeCalendar.Header>
      <RangeCalendar.Grid />
    </RangeCalendar>
  ))
  flush()
  const root = view.container.firstElementChild!
  const heading = document.getElementById(root.getAttribute('aria-labelledby')!)
  expect(heading).toHaveTextContent('October 2026')
  await new Promise((resolve) => setTimeout(resolve, 50))
  flush()
  // The 0.2.0 loop rebuilt the heading host on every registration.
  expect(document.getElementById(root.getAttribute('aria-labelledby')!)).toBe(heading)
})

test('only the focused slider thumb gets data-focus', () => {
  const view = render(() => (
    <Slider defaultValue={[20, 70]}>
      <Slider.Control>
        <Slider.Thumb index={0} aria-label="Lower" />
        <Slider.Thumb index={1} aria-label="Upper" />
      </Slider.Control>
    </Slider>
  ))
  flush()
  const lower = view.getByLabelText('Lower')
  const upper = view.getByLabelText('Upper')
  const thumb = (input: HTMLElement) => input.closest('[data-index]') ?? input
  lower.focus()
  flush()
  expect(thumb(lower)).toHaveAttribute('data-focus')
  expect(thumb(upper)).not.toHaveAttribute('data-focus')
  expect(view.getByRole('group')).toHaveAttribute('data-focus')
  upper.focus()
  flush()
  expect(thumb(lower)).not.toHaveAttribute('data-focus')
  expect(thumb(upper)).toHaveAttribute('data-focus')
  upper.blur()
  flush()
  expect(view.container.querySelector('[data-focus]')).toBeNull()
})

test('Editable textarea has no type and an empty preview is named Edit', () => {
  const view = render(() => (
    <Editable>
      <Editable.Preview data-testid="preview" />
      <Editable.Input as="textarea" />
    </Editable>
  ))
  flush()
  const preview = view.getByTestId('preview')
  expect(view.container.querySelector('textarea')).not.toHaveAttribute('type')
  expect(preview).toHaveTextContent('')
  expect(preview).toHaveAttribute('aria-label', 'Edit')
  expect(preview).toHaveAttribute('data-empty')
  cleanup()
  const named = render(() => (
    <Editable placeholder="Untitled">
      <Editable.Preview data-testid="preview" />
      <Editable.Input />
    </Editable>
  ))
  flush()
  expect(named.getByTestId('preview')).toHaveTextContent('Untitled')
  expect(named.getByTestId('preview')).not.toHaveAttribute('aria-label')
  expect(named.getByTestId('preview')).toHaveAttribute('data-empty')
  expect(named.container.querySelector('input')).toHaveAttribute('type', 'text')
})
