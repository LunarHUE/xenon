import { render } from '@solidjs/web'
import { VisuallyHidden } from '../../../solid/src/visually-hidden'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

let dispose: (() => void) | undefined
let root: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  root?.remove()
  dispose = undefined
  root = undefined
})

test('visually-hidden.focus.1 keeps the wrapper clipped when Tab focuses its child', async () => {
  root = document.createElement('div')
  document.body.append(root)
  dispose = render(
    () => (
      <>
        <button>Before</button>
        <VisuallyHidden>
          <button>Hidden action</button>
        </VisuallyHidden>
        <button>After</button>
      </>
    ),
    root
  )
  flush()
  const before = root.querySelector('button')!
  const hidden = root.querySelector('span') as HTMLElement
  const child = root.querySelectorAll('button')[1]!
  before.focus()
  await userEvent.tab()
  expect(child).toHaveFocus()
  expect(hidden.style.position).toBe('absolute')
  expect(hidden.style.clipPath).toBe('inset(50%)')
  expect(hidden.getBoundingClientRect().width).toBe(1)
  expect(hidden.getBoundingClientRect().height).toBe(1)
})
