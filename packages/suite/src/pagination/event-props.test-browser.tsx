// Solid rc.14 treats lowercase on* props as attributes, so a handler spread as
// `onclick` lands in the DOM as text and never runs. Check that real clicks reach
// the core handlers, and that no control carries an on* attribute.
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Button } from '@xenon-ui/solid/button'
import { Calendar } from '@xenon-ui/solid/calendar'
import { createDate } from '@xenon-ui/solid/date'
import { Pagination } from '@xenon-ui/solid/pagination'
import { Slider } from '@xenon-ui/solid/slider'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
function mount(view: () => JSX.Element): HTMLDivElement {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(view, host)
  flush()
  return host
}
const handlerAttributes = (root: Element) =>
  [...root.querySelectorAll('*')].flatMap((node) =>
    [...node.attributes].filter((attr) => /^on[a-z]/.test(attr.name)).map((attr) => attr.name)
  )

test('Pagination controls run their core handlers on click', async () => {
  const [page, setPage] = createSignal(1)
  const change = vi.fn((next: number) => setPage(next))
  const root = mount(() => (
    <Pagination count={5} page={page()} onPageChange={change}>
      <Pagination.First>First</Pagination.First>
      <Pagination.Previous>Previous</Pagination.Previous>
      <Pagination.Item page={2}>Two</Pagination.Item>
      <Pagination.Next>Next</Pagination.Next>
      <Pagination.Last>Last</Pagination.Last>
    </Pagination>
  ))
  expect(handlerAttributes(root)).toEqual([])
  await userEvent.click(root.querySelector('[aria-label="Next page"]')!)
  flush()
  expect(change).toHaveBeenLastCalledWith(2)
  await userEvent.click(root.querySelector('[aria-label="Last page"]')!)
  flush()
  expect(change).toHaveBeenLastCalledWith(5)
})

test('Button with a custom host runs its click handler', async () => {
  let pressed = 0
  const root = mount(() => (
    <Button as="span" onClick={() => pressed++}>
      Span
    </Button>
  ))
  expect(handlerAttributes(root)).toEqual([])
  const span = root.querySelector('span')!
  // Text-only spans get a zero-size box in the test frame, so Playwright won't click them.
  span.click()
  expect(pressed).toBe(1)
})

test('Slider and Calendar bind their handlers', async () => {
  let picked: unknown
  const root = mount(() => (
    <>
      <Slider defaultValue={[20]}>
        <Slider.Control>
          <Slider.Thumb index={0} aria-label="Volume" />
        </Slider.Control>
      </Slider>
      <Calendar today={createDate(2024, 2, 15)} onValueChange={(value) => (picked = value)}>
        <Calendar.Grid />
      </Calendar>
    </>
  ))
  expect(handlerAttributes(root)).toEqual([])
  await userEvent.click(
    root.querySelector('button[data-date="2024-02-20"]:not([data-outside-month])')!
  )
  flush()
  expect(picked).toBeDefined()
})
