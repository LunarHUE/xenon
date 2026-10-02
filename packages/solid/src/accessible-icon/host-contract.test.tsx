import { render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { expect, test } from 'vitest'
import { AccessibleIcon } from './index'

test('forwards selected native host refs and native class values', async () => {
  let first: HTMLDivElement | undefined
  let second: HTMLDivElement | undefined
  const refs = [
    (node: HTMLDivElement) => (first = node),
    [(node: HTMLDivElement) => (second = node)],
  ]
  const { container } = render(() => (
    <AccessibleIcon label="Named" as="div" ref={refs} class={['native', { active: true }]}>
      Content
    </AccessibleIcon>
  ))
  flush()
  await Promise.resolve()
  const host = container.firstElementChild!
  expect(first).toBe(host)
  expect(second).toBe(host)
  expect(host).toHaveClass('native', 'active')
})
