import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush, OBSERVE } from 'solid-js'
import { attribution } from 'solid-js/attribution'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { VirtualList, useVirtualList } from './virtual-list'
import type { VirtualListContextValue } from './virtual-list'

type Callback = (entries: { target: Element }[]) => void
const observers: { callback: Callback; targets: Set<Element> }[] = []

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets = new Set<Element>()
      callback: Callback
      constructor(callback: Callback) {
        this.callback = callback
        observers.push(this)
      }
      observe(target: Element) {
        this.targets.add(target)
      }
      unobserve(target: Element) {
        this.targets.delete(target)
      }
      disconnect() {
        this.targets.clear()
      }
    }
  )
})
afterEach(() => {
  cleanup()
  observers.length = 0
  vi.unstubAllGlobals()
})

const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}
/** jsdom has no layout: give the scroll container a 100px viewport. */
const viewport = (element: HTMLElement) =>
  Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true })
const scroll = async (element: HTMLElement, top: number) => {
  element.scrollTop = top
  element.dispatchEvent(new Event('scroll'))
  await settle()
}
const rows = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-part="item"]')].map((row) =>
    Number(row.dataset.index)
  )
const row = (container: HTMLElement, index: number) =>
  container.querySelector<HTMLElement>(`[data-index="${index}"]`)

describe('VirtualList', () => {
  test('renders the visible range with positions, set size and a full-height sizer', async () => {
    const view = render(() => (
      <VirtualList count={1000} size={20} overscan={2} role="list" aria-label="Rows" ref={viewport}>
        <VirtualList.Viewport>
          {(item) => (
            <VirtualList.Item item={item} role="listitem">
              Row {item.index}
            </VirtualList.Item>
          )}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    const root = view.getByRole('list')
    expect(root).toHaveAttribute('data-part', 'root')
    expect(root.style.overflow).toBe('auto')
    expect(root.querySelector<HTMLElement>('[data-part="viewport"]')!.style.height).toBe('20000px')
    expect(rows(view.container)).toEqual([0, 1, 2, 3, 4, 5, 6])
    const third = row(view.container, 3)!
    expect(third).toHaveAttribute('aria-setsize', '1000')
    expect(third).toHaveAttribute('aria-posinset', '4')
    expect(third).toHaveAttribute('data-key', '3')
    expect(third.style.position).toBe('absolute')
    expect(third.style.transform).toBe('translateY(60px)')
    expect(third.style.height).toBe('20px')
    await scroll(root, 10_000)
    expect(rows(view.container)).toEqual([498, 499, 500, 501, 502, 503, 504, 505, 506])
    expect(row(view.container, 500)).toHaveTextContent('Row 500')
  })

  test('scrolling keeps surviving rows instead of re-rendering them', async () => {
    const renders = vi.fn()
    const view = render(() => (
      <VirtualList count={1000} size={20} overscan={2} role="list" aria-label="Rows" ref={viewport}>
        <VirtualList.Viewport>
          {(item) => {
            renders()
            return <VirtualList.Item item={item}>Row {item.index}</VirtualList.Item>
          }}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    expect(renders).toHaveBeenCalledTimes(7)
    const kept = row(view.container, 4)!
    await scroll(view.getByRole('list'), 40)
    expect(rows(view.container)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
    expect(renders).toHaveBeenCalledTimes(9)
    expect(row(view.container, 4)).toBe(kept)
    await scroll(view.getByRole('list'), 60)
    expect(rows(view.container)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(renders).toHaveBeenCalledTimes(10)
    expect(row(view.container, 4)).toBe(kept)
  })

  test('scrollToIndex renders an off-screen row in the same flush for aria-activedescendant', async () => {
    let list!: VirtualListContextValue
    const [active, setActive] = createSignal(0)
    function Owner() {
      list = useVirtualList()
      return null
    }
    const view = render(() => (
      <>
        <VirtualList
          id="options"
          count={1000}
          size={20}
          role="listbox"
          aria-label="Options"
          ref={viewport}
        >
          <Owner />
          <VirtualList.Viewport>
            {(item) => (
              <VirtualList.Item item={item} id={`option-${item.index}`} role="option">
                Option {item.index}
              </VirtualList.Item>
            )}
          </VirtualList.Viewport>
        </VirtualList>
        <input
          role="combobox"
          aria-controls="options"
          aria-expanded="true"
          aria-activedescendant={list.isRendered(active()) ? `option-${active()}` : undefined}
        />
      </>
    ))
    await settle()
    const input = view.getByRole('combobox')
    expect(input).toHaveAttribute('aria-activedescendant', 'option-0')
    setActive(500)
    flush()
    expect(document.getElementById('option-500')).toBeNull()
    expect(input).not.toHaveAttribute('aria-activedescendant')
    list.scrollToIndex(500)
    flush()
    expect(document.getElementById('option-500')).not.toBeNull()
    expect(list.isRendered(500)).toBe(true)
    expect(input).toHaveAttribute('aria-activedescendant', 'option-500')
    expect(view.getByRole('listbox').scrollTop).toBe(500 * 20 + 20 - 100)
  })

  test('focus moves to the root when its row unmounts and back when the row returns', async () => {
    const view = render(() => (
      <VirtualList count={1000} size={20} overscan={1} role="list" aria-label="Rows" ref={viewport}>
        <VirtualList.Viewport>
          {(item) => (
            <VirtualList.Item item={item} role="listitem" tabindex={-1}>
              <button type="button">Open {item.index}</button>
            </VirtualList.Item>
          )}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    const root = view.getByRole('list')
    expect(root).not.toHaveAttribute('tabindex')
    row(view.container, 2)!.focus()
    await scroll(root, 5000)
    expect(row(view.container, 2)).toBeNull()
    expect(document.activeElement).toBe(root)
    expect(root).toHaveAttribute('tabindex', '-1')
    await scroll(root, 0)
    await settle()
    expect(document.activeElement).toBe(row(view.container, 2))
    expect(root).not.toHaveAttribute('tabindex')

    view.getByText('Open 3').focus()
    await scroll(root, 5000)
    expect(document.activeElement).toBe(root)
    await scroll(root, 0)
    await settle()
    expect(document.activeElement).toBe(view.getByText('Open 3'))
  })

  test('focus leaving the root cancels the pending restore', async () => {
    const view = render(() => (
      <>
        <button type="button">Outside</button>
        <VirtualList
          count={100}
          size={20}
          overscan={1}
          role="list"
          aria-label="Rows"
          ref={viewport}
        >
          <VirtualList.Viewport>
            {(item) => (
              <VirtualList.Item item={item} tabindex={-1}>
                Row {item.index}
              </VirtualList.Item>
            )}
          </VirtualList.Viewport>
        </VirtualList>
      </>
    ))
    await settle()
    const root = view.getByRole('list')
    row(view.container, 1)!.focus()
    await scroll(root, 1000)
    expect(document.activeElement).toBe(root)
    view.getByText('Outside').focus()
    await settle()
    expect(root).not.toHaveAttribute('tabindex')
    await scroll(root, 0)
    await settle()
    expect(document.activeElement).toBe(view.getByText('Outside'))
  })

  test('follow mode pins appended rows until the user scrolls up', async () => {
    const [count, setCount] = createSignal(10)
    const change = vi.fn()
    const view = render(() => (
      <VirtualList
        count={count()}
        size={20}
        follow
        onFollowChange={change}
        role="log"
        aria-label="Log"
        ref={viewport}
      >
        <VirtualList.Viewport>
          {(item) => <VirtualList.Item item={item}>Line {item.index}</VirtualList.Item>}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    const root = view.getByRole('log')
    expect(root.scrollTop).toBe(100)
    expect(root).toHaveAttribute('data-following')
    setCount(20)
    await settle()
    expect(root.scrollTop).toBe(300)
    expect(row(view.container, 19)).not.toBeNull()
    await scroll(root, 120)
    expect(change).toHaveBeenLastCalledWith(false)
    expect(root).not.toHaveAttribute('data-following')
    setCount(30)
    await settle()
    expect(root.scrollTop).toBe(120)
    await scroll(root, 500)
    expect(change).toHaveBeenLastCalledWith(true)
    setCount(31)
    await settle()
    expect(root.scrollTop).toBe(520)
  })

  test('appending to a followed list lays the rows out once per write', async () => {
    // EFFECT_RELAY_TEAR comes from Solid's attribution engine, so this test turns it on.
    const stop = attribution.enable()
    const [lines, setLines] = createSignal(Array.from({ length: 10 }, (_, i) => `Line ${i}`))
    const view = render(() => (
      <VirtualList
        count={lines().length}
        size={20}
        follow
        role="log"
        aria-label="Log"
        ref={viewport}
      >
        <VirtualList.Viewport>
          {(item) => <VirtualList.Item item={item}>{lines()[item.index]}</VirtualList.Item>}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    const capture = OBSERVE!.diagnostics.capture()
    try {
      for (let i = 10; i < 15; i++) {
        setLines((previous) => [...previous, `Line ${i}`])
        await settle()
      }
    } finally {
      stop()
    }
    const tears = capture
      .stop()
      .filter((event) => event.code === 'EFFECT_RELAY_TEAR')
      .map((event) => event.message)
    expect(tears).toEqual([])
    const root = view.getByRole('log')
    expect(root.scrollTop).toBe(200)
    expect(row(view.container, 14)).toHaveTextContent('Line 14')
  })

  test('the active sticky heading stays rendered and pinned', async () => {
    const view = render(() => (
      <VirtualList
        count={30}
        size={10}
        overscan={1}
        sticky={(index) => index % 10 === 0}
        role="list"
        aria-label="Groups"
        ref={viewport}
      >
        <VirtualList.Viewport>
          {(item) => (
            <VirtualList.Item
              item={item}
              role={item.sticky ? 'presentation' : 'listitem'}
              aria-setsize={item.sticky ? undefined : 27}
            >
              {item.index}
            </VirtualList.Item>
          )}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    await scroll(view.getByRole('list'), 150)
    expect(rows(view.container)[0]).toBe(10)
    const heading = row(view.container, 10)!
    expect(heading).toHaveAttribute('data-sticky')
    expect(heading).toHaveAttribute('data-pinned')
    expect(heading.style.position).toBe('sticky')
    expect(heading.style.marginTop).toBe('100px')
    expect(heading.style.transform).toBe('')
    expect(row(view.container, 15)).toHaveAttribute('aria-setsize', '27')
    expect(row(view.container, 15)).not.toHaveAttribute('data-pinned')
    await scroll(view.getByRole('list'), 220)
    expect(row(view.container, 10)).toBeNull()
    expect(row(view.container, 20)).toHaveAttribute('data-pinned')
  })

  test('measured rows resize the sizer and move only later rows', async () => {
    let grown = 20
    const view = render(() => (
      <VirtualList
        count={50}
        estimateSize={() => 20}
        overscan={0}
        role="list"
        aria-label="Rows"
        ref={viewport}
      >
        <VirtualList.Viewport>
          {(item) => (
            <VirtualList.Item
              item={item}
              ref={(element: HTMLElement) => {
                Object.defineProperty(element, 'offsetHeight', {
                  get: () => (Number(element.dataset.index) === 1 ? grown : 20),
                  configurable: true,
                })
              }}
            >
              Row {item.index}
            </VirtualList.Item>
          )}
        </VirtualList.Viewport>
      </VirtualList>
    ))
    await settle()
    const sizer = view.container.querySelector<HTMLElement>('[data-part="viewport"]')!
    expect(sizer.style.height).toBe('1000px')
    const first = row(view.container, 0)!
    const second = row(view.container, 1)!
    const third = row(view.container, 2)!
    expect(third.style.height).toBe('')
    expect(third.style.transform).toBe('translateY(40px)')
    grown = 45
    for (const observer of observers)
      if (observer.targets.has(second)) observer.callback([{ target: second }])
    await settle()
    expect(sizer.style.height).toBe('1025px')
    expect(row(view.container, 2)).toBe(third)
    expect(third.style.transform).toBe('translateY(65px)')
    expect(first.style.transform).toBe('translateY(0px)')
  })

  test('useVirtualList requires a root', () => {
    function Orphan() {
      useVirtualList()
      return null
    }
    expect(() => render(() => <Orphan />)).toThrow(/inside VirtualList/)
  })
})
