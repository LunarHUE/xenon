import { render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Separator } from './separator'

const ForwardedRule = (props: ComponentProps<'hr'>) => <hr {...props} />

test('a forwarding hr component uses explicit generic-host semantics and forwards its ref', () => {
  let ref: HTMLHRElement | undefined
  const view = render(() => (
    <Separator
      as={ForwardedRule}
      ref={(node) => {
        ref = node
      }}
    />
  ))
  expect(view.getByRole('separator')).toBe(ref)
  expect(ref?.tagName).toBe('HR')
  expect(ref).toHaveAttribute('role', 'separator')
})

test.each(['div', ForwardedRule] as const)(
  'generic host %s restores its role after decorative axis updates',
  (as) => {
    const [decorative, setDecorative] = createSignal(false)
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('vertical')
    const view = render(() => (
      <Separator as={as} decorative={decorative()} orientation={orientation()} />
    ))
    const host = view.getByRole('separator')
    setDecorative(true)
    flush()
    expect(host).toHaveAttribute('role', 'none')
    expect(host).not.toHaveAttribute('aria-orientation')
    setOrientation('horizontal')
    flush()
    expect(host).toHaveAttribute('data-orientation', 'horizontal')
    expect(host).toHaveAttribute('role', 'none')
    setDecorative(false)
    flush()
    expect(view.getByRole('separator')).toBe(host)
    expect(host).toHaveAttribute('role', 'separator')
    expect(host).not.toHaveAttribute('aria-orientation')
    expect(host).not.toHaveAttribute('tabindex')
  }
)

test('reactive author orientation overrides generated orientation in every state', () => {
  const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('vertical')
  const [author, setAuthor] = createSignal<'horizontal' | 'vertical' | undefined>('horizontal')
  const view = render(() => <Separator orientation={orientation()} aria-orientation={author()} />)
  const host = view.getByRole('separator')
  expect(host).toHaveAttribute('aria-orientation', 'horizontal')
  setOrientation('horizontal')
  setAuthor('vertical')
  flush()
  expect(host).toHaveAttribute('aria-orientation', 'vertical')
  expect(host).toHaveAttribute('data-orientation', 'horizontal')
  setAuthor(undefined)
  flush()
  expect(host).not.toHaveAttribute('aria-orientation')
})
