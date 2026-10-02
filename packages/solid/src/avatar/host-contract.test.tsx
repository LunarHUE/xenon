import { render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Avatar } from './index'

test('forwards selected native host refs and native class values', async () => {
  let first: HTMLDivElement | undefined
  let second: HTMLDivElement | undefined
  const refs = [
    (node: HTMLDivElement) => (first = node),
    [(node: HTMLDivElement) => (second = node)],
  ]
  let fallbackFirst: HTMLButtonElement | undefined
  let fallbackSecond: HTMLButtonElement | undefined
  const fallbackRefs = [
    (node: HTMLButtonElement) => (fallbackFirst = node),
    [(node: HTMLButtonElement) => (fallbackSecond = node)],
  ]
  const { container } = render(() => (
    <Avatar as="div" ref={refs} class={['native', { active: true }]}>
      <Avatar.Fallback as="button" ref={fallbackRefs}>
        Fallback
      </Avatar.Fallback>
    </Avatar>
  ))
  flush()
  await Promise.resolve()
  const host = container.firstElementChild!
  expect(first).toBe(host)
  expect(second).toBe(host)
  expect(host).toHaveClass('native', 'active')
  expect(fallbackFirst).toBe(container.querySelector('button'))
  expect(fallbackSecond).toBe(fallbackFirst)
})
