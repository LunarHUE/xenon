import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { VisuallyHidden } from './index'

test('moving focus between descendants stays revealed until focus leaves the subtree', () => {
  const view = render(() => (
    <VisuallyHidden focusable>
      <button>First</button>
      <button>Second</button>
    </VisuallyHidden>
  ))
  const host = view.container.firstElementChild as HTMLElement
  const first = view.getByRole('button', { name: 'First' })
  const second = view.getByRole('button', { name: 'Second' })
  fireEvent.focusIn(first)
  flush()
  expect(host.style.clipPath).toBe('')
  fireEvent.focusOut(first, { relatedTarget: second })
  flush()
  expect(host.style.clipPath).toBe('')
  fireEvent.focusIn(second, { relatedTarget: first })
  fireEvent.focusOut(second, { relatedTarget: document.body })
  flush()
  expect(host.style.clipPath).toBe('inset(50%)')
  expect(host).not.toHaveAttribute('tabindex')
})

test('reactive focusable changes reveal an already focused host and reapply clipping', () => {
  const [focusable, setFocusable] = createSignal(false)
  const view = render(() => (
    <VisuallyHidden as="a" href="#content" focusable={focusable()}>
      Skip
    </VisuallyHidden>
  ))
  const link = view.getByRole('link')
  fireEvent.focusIn(link)
  flush()
  expect(link.style.position).toBe('absolute')
  setFocusable(true)
  flush()
  expect(view.getByRole('link')).toBe(link)
  expect(link.style.position).toBe('')
  expect(link).toHaveAttribute('href', '#content')
  setFocusable(false)
  flush()
  expect(link.style.position).toBe('absolute')
  expect(link).not.toHaveAttribute('focusable')
})

test('reactive author object styles override clipping before, during and after focus', () => {
  const [style, setStyle] = createSignal({ width: '12px', color: 'red' })
  const view = render(() => (
    <VisuallyHidden focusable style={style()}>
      <button>Action</button>
    </VisuallyHidden>
  ))
  const host = view.container.firstElementChild as HTMLElement
  expect(host.style.width).toBe('12px')
  fireEvent.focusIn(view.getByRole('button'))
  flush()
  setStyle({ width: '24px', color: 'blue' })
  flush()
  expect(host.style.width).toBe('24px')
  expect(host.style.color).toBe('blue')
  expect(host.style.clipPath).toBe('')
  fireEvent.focusOut(view.getByRole('button'), { relatedTarget: null })
  flush()
  expect(host.style.width).toBe('24px')
  expect(host.style.color).toBe('blue')
  expect(host.style.clipPath).toBe('inset(50%)')
})

test('focus handlers run once while the library retains focus reveal behavior', () => {
  const enter = vi.fn()
  const leave = vi.fn()
  const view = render(() => (
    <VisuallyHidden focusable onFocusIn={enter} onFocusOut={leave}>
      <button>Go</button>
    </VisuallyHidden>
  ))
  const host = view.container.firstElementChild as HTMLElement
  fireEvent.focusIn(view.getByRole('button'))
  flush()
  expect(enter).toHaveBeenCalledOnce()
  expect(host.style.position).toBe('')
  fireEvent.focusOut(view.getByRole('button'))
  flush()
  expect(leave).toHaveBeenCalledOnce()
  expect(host.style.position).toBe('absolute')
})

test('reactive hidden text updates the name of its containing button', () => {
  const [text, setText] = createSignal('Save draft')
  const view = render(() => (
    <button>
      <VisuallyHidden>{text()}</VisuallyHidden>
    </button>
  ))
  const button = view.getByRole('button', { name: 'Save draft' })
  setText('Save changes')
  flush()
  expect(view.getByRole('button', { name: 'Save changes' })).toBe(button)
  expect(button.firstElementChild).not.toHaveAttribute('aria-hidden')
})
