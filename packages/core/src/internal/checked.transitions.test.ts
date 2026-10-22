import { describe, expect, test, vi } from 'vitest'
import { checkedRoot, checkedState, type CheckedOptions } from './checked'

describe('shared checked-control transitions', () => {
  test.each(['input', 'button', 'generic'] as const)(
    '%s proposes changes without mutating the state snapshot',
    (host) => {
      const onCheckedChange = vi.fn()
      const options = { host, checked: false, onCheckedChange }
      const state = checkedState(options)
      const { root } = checkedRoot(options, state, { role: 'switch' })
      expect(onCheckedChange).not.toHaveBeenCalled()
      if (host === 'input') {
        root.on.change?.({ currentTarget: { checked: true } } as never)
        root.on.change?.({ currentTarget: { checked: false } } as never)
        expect(onCheckedChange.mock.calls).toEqual([[true], [false]])
      } else {
        root.on.click?.({ preventDefault: vi.fn() } as never)
        root.on.click?.({ preventDefault: vi.fn() } as never)
        expect(onCheckedChange.mock.calls).toEqual([[true], [true]])
      }
      expect(state.checked).toBe(false)
      expect(root.attrs['data-state']).toBe('unchecked')
      const nextOptions = { ...options, checked: true }
      const next = checkedRoot(nextOptions, checkedState(nextOptions), { role: 'switch' })
      expect(next.root.attrs['data-state']).toBe('checked')
    }
  )

  test.each([
    { disabled: true, readonly: false },
    { disabled: false, readonly: true },
    { disabled: true, readonly: true },
  ])(
    'blocked state %j suppresses both click proposals and native changes for every host',
    (blocked) => {
      for (const host of ['input', 'button', 'generic'] as const) {
        const onCheckedChange = vi.fn()
        const options = { host, checked: true, onCheckedChange, ...blocked }
        const state = checkedState(options)
        const { root } = checkedRoot(options, state, { role: 'checkbox', indeterminate: true })
        const preventDefault = vi.fn(),
          stopPropagation = vi.fn()
        root.on.click?.({ preventDefault, stopPropagation } as never)
        root.on.change?.({ currentTarget: { checked: false } } as never)
        expect(state.interactive).toBe(false)
        expect(preventDefault).toHaveBeenCalledTimes(1)
        expect(stopPropagation).not.toHaveBeenCalled()
        expect(onCheckedChange).not.toHaveBeenCalled()
      }
    }
  )

  test.each(['button', 'generic'] as const)(
    '%s blocks Enter, activates only on Space release, and copies modifiers',
    (host) => {
      const onCheckedChange = vi.fn()
      const options = { host, checked: true, onCheckedChange }
      const { root } = checkedRoot(options, checkedState(options), {
        role: 'checkbox',
        indeterminate: true,
      })
      class Mouse {
        readonly type: string
        readonly init: MouseEventInit
        constructor(type: string, init: MouseEventInit) {
          this.type = type
          this.init = init
        }
      }
      const dispatchEvent = vi.fn()
      const currentTarget = { ownerDocument: { defaultView: { MouseEvent: Mouse } }, dispatchEvent }
      for (const key of ['Enter', ' ', 'ArrowDown']) {
        const preventDefault = vi.fn()
        root.on.keydown?.({ key, preventDefault, currentTarget } as never)
        expect(preventDefault).toHaveBeenCalledTimes(key === 'ArrowDown' ? 0 : 1)
      }
      expect(dispatchEvent).not.toHaveBeenCalled()
      root.on.keyup?.({ key: 'Enter', preventDefault: vi.fn(), currentTarget } as never)
      expect(dispatchEvent).not.toHaveBeenCalled()
      const preventDefault = vi.fn()
      root.on.keyup?.({
        key: ' ',
        preventDefault,
        currentTarget,
        shiftKey: true,
        ctrlKey: true,
        altKey: false,
        metaKey: false,
      } as never)
      expect(preventDefault).toHaveBeenCalledOnce()
      expect(dispatchEvent).toHaveBeenCalledWith(
        new Mouse('click', {
          bubbles: true,
          cancelable: true,
          composed: true,
          shiftKey: true,
          ctrlKey: true,
          altKey: false,
          metaKey: false,
        })
      )
      expect(onCheckedChange).not.toHaveBeenCalled()
      root.on.click?.({ preventDefault: vi.fn() } as never)
      expect(onCheckedChange).toHaveBeenCalledWith(false)
    }
  )

  test.each(['button', 'generic'] as const)(
    '%s never dispatches keyboard activation while blocked',
    (host) => {
      for (const blocked of [{ disabled: true }, { readonly: true }]) {
        const options = { host, ...blocked }
        const { root } = checkedRoot(options, checkedState(options), { role: 'switch' })
        const dispatchEvent = vi.fn(),
          preventDefault = vi.fn()
        root.on.keyup?.({ key: ' ', preventDefault, currentTarget: { dispatchEvent } } as never)
        expect(preventDefault).toHaveBeenCalledOnce()
        expect(dispatchEvent).not.toHaveBeenCalled()
      }
    }
  )

  test.each([false, true])(
    'mixed checkbox presentation preserves underlying checked=%s',
    (checked) => {
      for (const host of ['input', 'button', 'generic'] as const) {
        const options: CheckedOptions = {
          host,
          checked,
          required: true,
          name: 'agree',
          value: 'yes',
          form: 'form',
        }
        const { root } = checkedRoot(options, checkedState(options), {
          role: 'checkbox',
          indeterminate: true,
        })
        expect(root.attrs).toMatchObject({
          'data-state': 'indeterminate',
          'data-checked': checked ? '' : undefined,
          'data-indeterminate': '',
        })
        if (host === 'input') {
          expect(root.attrs).toMatchObject({
            checked,
            required: true,
            name: 'agree',
            value: 'yes',
            form: 'form',
          })
          expect(root.attrs).not.toHaveProperty('aria-checked')
        } else {
          expect(root.attrs).toMatchObject({ 'aria-checked': 'mixed', 'aria-required': 'true' })
          for (const field of ['name', 'value', 'form', 'required'])
            expect(root.attrs).not.toHaveProperty(field)
        }
      }
    }
  )

  test('generic readonly controls retain focusability while disabled controls leave the tab order', () => {
    for (const blocked of [{ readonly: true }, { disabled: true }]) {
      const options = { host: 'generic' as const, ...blocked }
      const { root } = checkedRoot(options, checkedState(options), { role: 'switch' })
      expect(root.attrs.tabindex).toBe(blocked.disabled ? undefined : 0)
      expect(root.attrs['aria-disabled']).toBe(blocked.disabled ? 'true' : undefined)
      expect(root.attrs['aria-readonly']).toBe(blocked.readonly ? 'true' : undefined)
    }
  })
})
