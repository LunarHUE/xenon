import { Calendar } from '@xenon-ui/solid/calendar'
import { DateProvider, createDate } from '@xenon-ui/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, q: within(root) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('fixedWeeks renders six complete weeks with today as the initial tab stop', () => {
  const m = mount(() => (
    <DateProvider today={createDate(2024, 2, 15)}>
      <Calendar fixedWeeks>
        <Calendar.Heading />
        <Calendar.Grid />
      </Calendar>
    </DateProvider>
  ))
  expect(m.q.getAllByRole('row')).toHaveLength(7)
  expect(m.root.querySelectorAll('[role="gridcell"]')).toHaveLength(42)
  expect(m.root.querySelector('button[tabindex="0"]')).toHaveAttribute('data-date', '2024-02-15')
})

test('a canceled navigation click leaves the visible month and callback untouched', () => {
  const changed = vi.fn()
  const m = mount(() => (
    <DateProvider today={createDate(2024, 2, 15)}>
      <Calendar onVisibleMonthChange={changed}>
        <Calendar.Header>
          <Calendar.Next onClick={(event) => event.preventDefault()} />
        </Calendar.Header>
        <Calendar.Grid />
      </Calendar>
    </DateProvider>
  ))
  fireEvent.click(m.q.getByRole('button', { name: 'Next month' }))
  flush()
  expect(changed).not.toHaveBeenCalled()
  expect(m.q.getByRole('grid')).toHaveAccessibleName('February 2024')
})
