import type { AnyPart } from '@xenon-ui/core'
import { createMemo, createRoot, createSignal, flush, untrack } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { spread } from './spread'

const roots: (() => void)[] = []
afterEach(() => roots.splice(0).forEach((dispose) => dispose()))

function click(snapshot: Record<string, unknown>) {
  const element = document.createElement('button')
  const handler = snapshot.onClick as EventListenerOrEventListenerObject & AddEventListenerOptions
  element.addEventListener('click', handler, typeof handler === 'object' ? handler : undefined)
  const event = new MouseEvent('click', { cancelable: true })
  element.dispatchEvent(event)
  return { event, element }
}

describe('spread reactive inputs and event snapshots', () => {
  test('a tracked merge updates attributes and both handlers without changing earlier snapshots', () => {
    const firstCore = vi.fn()
    const nextCore = vi.fn()
    const firstAuthor = vi.fn()
    const nextAuthor = vi.fn()
    const view = createRoot((dispose) => {
      roots.push(dispose)
      const [revision, setRevision] = createSignal(false)
      const merged = createMemo(() =>
        spread(
          {
            attrs: {
              'aria-expanded': revision() ? 'true' : 'false',
              'data-state': revision() ? 'open' : 'closed',
            },
            on: { click: revision() ? nextCore : firstCore },
          },
          { onClick: revision() ? nextAuthor : firstAuthor }
        )
      )
      return { merged, setRevision }
    })
    const before = untrack(view.merged)
    click(before)
    expect(firstAuthor).toHaveBeenCalledOnce()
    expect(firstCore).toHaveBeenCalledOnce()
    view.setRevision(true)
    flush()
    const after = untrack(view.merged)
    expect(after).toMatchObject({ 'aria-expanded': 'true', 'data-state': 'open' })
    expect(before).toMatchObject({ 'aria-expanded': 'false', 'data-state': 'closed' })
    click(after)
    expect(nextAuthor).toHaveBeenCalledOnce()
    expect(nextCore).toHaveBeenCalledOnce()
    click(before)
    expect(firstAuthor).toHaveBeenCalledTimes(2)
    expect(firstCore).toHaveBeenCalledTimes(2)
    expect(nextAuthor).toHaveBeenCalledOnce()
  })

  test('removing an author handler in a later merge restores core activation', () => {
    const core = vi.fn()
    const author = vi.fn((event: Event) => event.preventDefault())
    const view = createRoot((dispose) => {
      roots.push(dispose)
      const [blocked, setBlocked] = createSignal(true)
      const merged = createMemo(() =>
        spread(
          { attrs: {}, on: { click: core } },
          {
            onClick: blocked() ? author : undefined,
          }
        )
      )
      return { merged, setBlocked }
    })
    expect(click(untrack(view.merged)).event.defaultPrevented).toBe(true)
    expect(core).not.toHaveBeenCalled()
    view.setBlocked(false)
    flush()
    expect(click(untrack(view.merged)).event.defaultPrevented).toBe(false)
    expect(core).toHaveBeenCalledOnce()
    expect(author).toHaveBeenCalledOnce()
  })

  test('explicit undefined author attributes remove core defaults without mutating frozen inputs', () => {
    const attrs = Object.freeze({ tabindex: 0, 'aria-label': 'Core', 'data-state': 'ready' })
    const core = vi.fn()
    const part = Object.freeze({ attrs, on: Object.freeze({ click: core }) })
    const author = Object.freeze({ tabindex: undefined, 'aria-label': 'Author' })
    const result = spread(part, author)
    expect(result).toMatchObject({
      tabindex: undefined,
      'aria-label': 'Author',
      'data-state': 'ready',
    })
    expect(Object.hasOwn(result, 'tabindex')).toBe(true)
    expect(attrs.tabindex).toBe(0)
    expect(attrs['aria-label']).toBe('Core')
    expect(Object.keys(author)).toEqual(['tabindex', 'aria-label'])
    expect(part.on.click).toBe(core)
  })

  test('an already canceled native event still reaches the author but skips core behavior', () => {
    const core = vi.fn()
    const author = vi.fn()
    const element = document.createElement('button')
    element.addEventListener('click', (event) => event.preventDefault())
    element.addEventListener(
      'click',
      spread(
        { attrs: {}, on: { click: core } },
        {
          onClick: author,
        }
      ).onClick as EventListener
    )
    element.click()
    expect(author).toHaveBeenCalledOnce()
    expect(core).not.toHaveBeenCalled()
  })

  test('stopping propagation alone still allows the core handler for the same event', () => {
    const order: string[] = []
    const { event } = click(
      spread(
        { attrs: {}, on: { click: () => order.push('core') } },
        {
          onClick: (event: Event) => {
            order.push('author')
            event.stopPropagation()
          },
        }
      )
    )
    expect(order).toEqual(['author', 'core'])
    expect(event.defaultPrevented).toBe(false)
  })

  test('a composed listener respects AbortSignal for both author and core behavior', () => {
    const controller = new AbortController()
    const core = vi.fn()
    const author = vi.fn()
    const listener = { handleEvent: author, signal: controller.signal, capture: true }
    const props = spread({ attrs: {}, on: { click: core } }, { onClick: listener })
    const { element } = click(props)
    expect(author).toHaveBeenCalledOnce()
    expect(core).toHaveBeenCalledOnce()
    controller.abort()
    element.click()
    expect(author).toHaveBeenCalledOnce()
    expect(core).toHaveBeenCalledOnce()
    expect(listener.handleEvent).toBe(author)
  })

  test('independent merges do not share cancellation or handler state', () => {
    const core = vi.fn()
    const part: AnyPart = { attrs: {}, on: { click: core } }
    const cancel = spread(part, { onClick: (event: Event) => event.preventDefault() })
    const proceed = spread(part, { onClick: undefined })
    click(cancel)
    click(proceed)
    click(cancel)
    click(proceed)
    expect(core).toHaveBeenCalledTimes(2)
  })
})
