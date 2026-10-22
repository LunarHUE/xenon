import { render } from '@solidjs/web'
import { VirtualList } from '@xenon-ui/solid/virtual-list'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'

/** Fixed-size rows laid out in a bordered native scroll viewport. */
function setup() {
  const container = document.createElement('div')
  document.body.append(container)
  const [height, setHeight] = createSignal(100)
  const dispose = render(
    () => (
      <VirtualList
        count={100}
        size={20}
        gap={3}
        paddingStart={11}
        paddingEnd={17}
        overscan={0}
        style={{ width: '240px', height: `${height()}px`, border: '7px solid' }}
      >
        <VirtualList.Viewport>
          {(item) => <VirtualList.Item item={item}>Row {item.index}</VirtualList.Item>}
        </VirtualList.Viewport>
      </VirtualList>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const root = container.querySelector<HTMLElement>('[data-part="root"]')!
  const rows = () => [...container.querySelectorAll<HTMLElement>('[data-part="item"]')]
  return { root, rows, setHeight }
}

test('real row boxes include start padding and inter-row gaps inside the viewport border', async () => {
  const s = setup()
  await expect.poll(() => s.rows().length).toBeGreaterThan(1)
  const [first, second] = s.rows()
  expect(
    first!.getBoundingClientRect().top - s.root.getBoundingClientRect().top - s.root.clientTop
  ).toBe(11)
  expect(first!.getBoundingClientRect().height).toBe(20)
  expect(second!.getBoundingClientRect().top - first!.getBoundingClientRect().bottom).toBe(3)
  expect(s.root.scrollHeight).toBe(11 + 100 * 20 + 99 * 3 + 17)
})

test('native viewport growth renders additional rows while retaining existing row hosts', async () => {
  const s = setup()
  await expect.poll(() => s.rows().length).toBeGreaterThan(1)
  const before = s.rows(),
    kept = before[1]!
  s.setHeight(200)
  flush()
  await expect.poll(() => s.rows().length).toBeGreaterThan(before.length)
  expect(s.rows()[1]).toBe(kept)
  expect(s.rows().every((row) => row.getBoundingClientRect().height === 20)).toBe(true)
})

test('native scrolling to the end renders the last row above end padding within real viewport bounds', async () => {
  const s = setup()
  await expect.poll(() => s.rows().length).toBeGreaterThan(1)
  s.root.scrollTop = s.root.scrollHeight
  await expect.poll(() => s.rows().at(-1)?.dataset.index).toBe('99')
  const last = s.rows().at(-1)!
  const innerBottom = s.root.getBoundingClientRect().top + s.root.clientTop + s.root.clientHeight
  expect(innerBottom - last.getBoundingClientRect().bottom).toBe(17)
  expect(last.getBoundingClientRect().height).toBe(20)
  expect(s.rows().length).toBeLessThan(10)
})
