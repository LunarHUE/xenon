import { describe, expect, test, vi } from 'vitest'

import { button } from './button'

function key(name: string) {
  const event = { key: name, preventDefault: vi.fn(), currentTarget: { click: vi.fn() } }
  return event as unknown as KeyboardEvent & typeof event
}

describe('button', () => {
  test('native: defaults type to button and sets nothing else', () => {
    expect(button()).toEqual({
      attrs: { type: 'button', disabled: undefined, 'data-disabled': undefined },
      on: {},
    })
  })

  test('native: disabled sets the attribute and a data hook', () => {
    expect(button({ disabled: true }).attrs).toMatchObject({ disabled: true, 'data-disabled': '' })
  })

  test('non-native: role, tab stop, no aria-disabled', () => {
    expect(button({ native: false }).attrs).toEqual({
      role: 'button',
      tabindex: 0,
      'aria-disabled': undefined,
      'data-disabled': undefined,
    })
  })

  test('non-native disabled: aria-disabled, removed from tab order, no handlers', () => {
    const part = button({ native: false, disabled: true })
    expect(part.attrs).toMatchObject({ 'aria-disabled': 'true', tabindex: undefined })
    expect(part.on).toEqual({})
  })

  test('non-native: Enter clicks on keydown', () => {
    const event = key('Enter')
    button({ native: false }).on.keydown?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.currentTarget.click).toHaveBeenCalledOnce()
  })

  test('non-native: Space cancels keydown and clicks on keyup', () => {
    const part = button({ native: false })
    const down = key(' ')
    part.on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.currentTarget.click).not.toHaveBeenCalled()

    const up = key(' ')
    part.on.keyup?.(up)
    expect(up.currentTarget.click).toHaveBeenCalledOnce()
  })

  test('non-native: other keys are ignored', () => {
    const event = key('a')
    button({ native: false }).on.keydown?.(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
