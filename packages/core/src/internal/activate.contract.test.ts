import { afterEach, expect, test, vi } from 'vitest'
import { activate, type Activation } from './activate'

afterEach(() => vi.unstubAllGlobals())

class Mouse {
  readonly type: string
  readonly init: MouseEventInit
  constructor(type: string, init: MouseEventInit) {
    this.type = type
    this.init = init
  }
}

test('activation dispatches synchronously on the current host using its document constructor', () => {
  const local = vi.fn(function (type: string, init: MouseEventInit) {
    return new Mouse(type, init)
  })
  const global = vi.fn()
  vi.stubGlobal('MouseEvent', global)
  const dispatched: Mouse[] = []
  const host = {
    ownerDocument: { defaultView: { MouseEvent: local } },
    dispatchEvent: (event: Mouse) => {
      dispatched.push(event)
      return false
    },
  }
  const preventDefault = vi.fn()
  activate({
    currentTarget: host,
    shiftKey: true,
    ctrlKey: false,
    altKey: true,
    metaKey: false,
    preventDefault,
  } as unknown as Activation)
  expect(dispatched).toHaveLength(1)
  expect(dispatched[0]).toEqual(
    new Mouse('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      shiftKey: true,
      ctrlKey: false,
      altKey: true,
      metaKey: false,
    })
  )
  expect(local).toHaveBeenCalledTimes(1)
  expect(global).not.toHaveBeenCalled()
  expect(preventDefault).not.toHaveBeenCalled()
})

test.each([null, {}])(
  'activation falls back to global MouseEvent when the document view is %j',
  (defaultView) => {
    vi.stubGlobal('MouseEvent', Mouse)
    const dispatchEvent = vi.fn()
    activate({
      currentTarget: { ownerDocument: { defaultView }, dispatchEvent },
      shiftKey: false,
      ctrlKey: true,
      altKey: false,
      metaKey: true,
    } as unknown as Activation)
    expect(dispatchEvent).toHaveBeenCalledWith(
      new Mouse('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
        shiftKey: false,
        ctrlKey: true,
        altKey: false,
        metaKey: true,
      })
    )
  }
)
