import { render } from '@solidjs/web'
import { VisuallyHidden } from '../../../solid/src/visually-hidden'
import { flush } from 'solid-js'
import { within } from '@testing-library/dom'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

test('visually-hidden.roles.1 visually-hidden.roles.3: accessible text uses the complete clipping recipe', () => {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(
    () => (
      <button>
        <VisuallyHidden>Save</VisuallyHidden>
      </button>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()

  const hidden = within(root).getByText('Save') as HTMLElement
  expect(within(root).getByRole('button')).toHaveAccessibleName('Save')
  expect(hidden).toHaveStyle({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0px',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0px',
  })
})

test('visually-hidden.focus.2 preserves the author style while focus reveal removes clipping and restores it', () => {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(
    () => (
      // eslint-disable-next-line solid/style-prop -- verifies string style merging.
      <VisuallyHidden focusable style="color:red">
        <button>Save</button>
      </VisuallyHidden>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  const hidden = root.firstElementChild as HTMLElement
  const child = hidden.firstElementChild as HTMLElement
  expect(hidden.style.position).toBe('absolute')
  child.focus()
  flush()
  expect(hidden.style.position).toBe('')
  expect(hidden.style.clipPath).toBe('')
  expect(hidden.style.color).toBe('red')
  child.blur()
  flush()
  expect(child).not.toHaveFocus()
  expect(hidden.style.position).toBe('absolute')
  expect(hidden.style.clipPath).toBe('inset(50%)')
})
