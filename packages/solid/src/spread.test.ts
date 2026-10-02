import type { AnyPart } from '@xenon-ui/core'
import { describe, expect, test, vi } from 'vitest'
import { spread } from './spread'
import { gate } from './internal/gate'

function dispatch(props: Record<string, unknown>, type = 'click', key?: string) {
  const node = document.createElement('button')
  const prop = Object.keys(props).find((name) => name.toLowerCase() === `on${type}`)!
  node.addEventListener(type, props[prop] as EventListener)
  const event =
    key === undefined
      ? new Event(type, { cancelable: true })
      : new KeyboardEvent(type, { key, cancelable: true })
  node.dispatchEvent(event)
  return { node, event }
}

describe('Solid event composition', () => {
  test('an explicitly undefined handler retains core behavior', () => {
    const core = vi.fn()
    const part: AnyPart = { attrs: {}, on: { click: core } }
    dispatch(spread(part, { onClick: undefined }))
    expect(core).toHaveBeenCalledOnce()
  })

  test('an optional core entry leaves the consumer handler working', () => {
    const consumer = vi.fn()
    const part: AnyPart = { attrs: {}, on: { click: undefined } }
    dispatch(spread(part, { onClick: consumer }))
    expect(consumer).toHaveBeenCalledOnce()
  })

  test.each([undefined, false, 0, ''])(
    'bound handlers preserve data %s, order, and receiver',
    (data) => {
      const order: string[] = []
      let receiver: unknown
      const consumer = vi.fn(function (this: HTMLElement, value: unknown, event: Event) {
        receiver = this
        expect(value).toBe(data)
        expect(event.currentTarget).toBe(this)
        order.push('consumer')
      })
      const part: AnyPart = {
        attrs: {},
        on: {
          click: () => {
            order.push('core')
          },
        },
      }
      const { node } = dispatch(spread(part, { onclick: [consumer, data] }))
      expect(receiver).toBe(node)
      expect(order).toEqual(['consumer', 'core'])
    }
  )

  test('bound handler cancellation skips core', () => {
    const core = vi.fn()
    dispatch(
      spread(
        { attrs: {}, on: { click: core } },
        {
          onClick: [(_data: unknown, event: Event) => event.preventDefault(), undefined],
        }
      )
    )
    expect(core).not.toHaveBeenCalled()
  })

  test('plain functions preserve the native receiver', () => {
    let receiver: unknown
    const { node } = dispatch(
      spread(
        { attrs: {}, on: { click: () => {} } },
        {
          onClick: function (this: HTMLElement) {
            receiver = this
          },
        }
      )
    )
    expect(receiver).toBe(node)
  })

  test('runtime listener objects retain their receiver', () => {
    const handler = {
      handleEvent: vi.fn(function (this: unknown) {
        expect(this).toBe(handler)
      }),
    }
    dispatch(spread({ attrs: {}, on: { click: () => {} } }, { onClick: handler }))
    expect(handler.handleEvent).toHaveBeenCalledOnce()
  })

  test('runtime listener options survive gating and composition', () => {
    const node = document.createElement('button')
    const consumer = vi.fn()
    const core = vi.fn()
    const props = { onMouseDown: { handleEvent: consumer, once: true, capture: true } }
    gate(props, () => true)
    const merged = spread({ attrs: {}, on: { mousedown: core } }, props)
    const handler = merged.onMouseDown as EventListenerObject & AddEventListenerOptions
    node.addEventListener('mousedown', handler, handler)
    node.dispatchEvent(new Event('mousedown'))
    node.dispatchEvent(new Event('mousedown'))
    expect(consumer).toHaveBeenCalledOnce()
    expect(core).toHaveBeenCalledOnce()
    expect(handler.capture).toBe(true)
  })

  test.each(['onClick', 'onclick', 'onCLICK'])(
    'gates %s tuples against live interaction state',
    (name) => {
      let interactive = false
      const consumer = vi.fn()
      const props = { [name]: [consumer, 'payload'] }
      gate(props, () => interactive)
      dispatch(props)
      expect(consumer).not.toHaveBeenCalled()
      interactive = true
      dispatch(props)
      expect(consumer).toHaveBeenCalledOnce()
      expect(consumer.mock.calls[0]![0]).toBe('payload')
    }
  )

  test('gates activation keys but delivers other keys to bound handlers', () => {
    const consumer = vi.fn()
    const props = { onkeydown: [consumer, 0] }
    gate(props, () => false)
    dispatch(props, 'keydown', 'Enter')
    dispatch(props, 'keydown', ' ')
    expect(consumer).not.toHaveBeenCalled()
    dispatch(props, 'keydown', 'ArrowDown')
    expect(consumer).toHaveBeenCalledOnce()
  })
})
