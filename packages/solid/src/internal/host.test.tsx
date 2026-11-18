import { render } from '@solidjs/testing-library'
import { getOwner } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'
import { booleanAttribute, setRef } from './host'

describe('Solid host boundary', () => {
  test.each([
    [true, true],
    ['', true],
    [false, false],
    [undefined, false],
  ] as const)('normalizes native boolean attribute %s to %s', (value, expected) => {
    expect(booleanAttribute(value)).toBe(expected)
  })

  test('composes nested refs with the native owner and disposal behavior', () => {
    const cleanup = vi.fn()
    const first = vi.fn(() => {
      expect(getOwner()).not.toBeNull()
      return cleanup
    })
    const second = vi.fn()
    const refs = [first, [undefined, second]]
    const native = render(() => <button ref={refs}>Native</button>)
    const adapted = render(() => <button ref={(node) => setRef(() => refs, node)}>Adapted</button>)
    expect(first).toHaveBeenCalledTimes(2)
    expect(second).toHaveBeenCalledTimes(2)
    expect(first.mock.calls).toEqual(second.mock.calls)
    native.unmount()
    adapted.unmount()
    expect(cleanup).not.toHaveBeenCalled()
    expect(first).toHaveBeenCalledTimes(2)
    expect(second).toHaveBeenCalledTimes(2)
  })

  test('absent consumer refs do not interfere with internal attachment', () => {
    const internal = vi.fn((node: HTMLButtonElement) => setRef(() => undefined, node))
    const view = render(() => <button ref={internal}>Button</button>)
    expect(internal).toHaveBeenCalledWith(view.getByText('Button'))
  })
})
