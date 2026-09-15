import { render } from '@solidjs/web'
import { VisuallyHidden } from '../../../solid/src/visually-hidden'
import { flush } from 'solid-js'
import { fireEvent, within } from '@testing-library/dom'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

test('clipped text names a button and forwards host props, style and ref', () => {
  const root = document.createElement('div')
  document.body.append(root)
  let node: HTMLElement | undefined
  const dispose = render(
    () => (
      <button>
        <VisuallyHidden
          ref={(el) => {
            node = el
          }}
          class="label"
          style={{ color: 'red' }}
        >
          Save
        </VisuallyHidden>
      </button>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  expect(within(root).getByRole('button')).toHaveAccessibleName('Save')
  expect(node?.tagName).toBe('SPAN')
  expect(node).toHaveClass('label')
  expect(node?.style.position).toBe('absolute')
  expect(node?.style.color).toBe('red')
  expect(node?.style.clipPath).toBe('inset(50%)')
})

test('focus reveal preserves author string style and hides after subtree blur', () => {
  const root = document.createElement('div')
  const dispose = render(
    () => (
      // eslint-disable-next-line solid/style-prop -- Regression for author string-style support.
      <VisuallyHidden focusable style="color:red">
        <a href="#main">Skip</a>
      </VisuallyHidden>
    ),
    root
  )
  cleanups.push(dispose)
  flush()
  const host = root.firstElementChild as HTMLElement
  fireEvent.focusIn(host.firstElementChild!)
  flush()
  expect(host.style.position).toBe('')
  expect(host.style.color).toBe('red')
  fireEvent.focusOut(host.firstElementChild!, { relatedTarget: null })
  flush()
  expect(host.style.position).toBe('absolute')
})
