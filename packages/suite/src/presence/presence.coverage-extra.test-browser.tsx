import { Collapsible } from '@xenon-ui/solid'
import { waitForExit } from '@xenon-ui/dom'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { mount } from '../harness/solid'

const mounts: Array<{ unmount: () => void }> = []
afterEach(() => mounts.splice(0).forEach((m) => m.unmount()))

async function fixture() {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  mounts.push(m)
  await m.settle()
  return { ...m, content: within(m.container).getByText('Contents') }
}

async function settle(m: ReturnType<typeof mount>) {
  await m.settle()
}

test('presence.animation.17 mutating one running animation restarts its completion boundary', async () => {
  const m = await fixture()
  const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  const done = vi.fn()
  const cancel = waitForExit(m.content, done)
  mounts.push({ unmount: cancel })
  m.setProps({ open: false })
  await settle(m)
  expect(m.content).toBeInTheDocument()
  expect(done).not.toHaveBeenCalled()
  expect(m.content).toHaveAttribute('data-ending-style', '')

  animation.currentTime = 9999
  const effect = animation.effect as KeyframeEffect
  effect.setKeyframes([{ opacity: 0.8 }, { opacity: 0 }])
  animation.currentTime = 0
  animation.play()
  await settle(m)
  expect(m.content).toBeInTheDocument()
  expect(done).not.toHaveBeenCalled()
  animation.finish()
  await settle(m)
  expect(m.content).not.toBeInTheDocument()
  expect(done).toHaveBeenCalledTimes(1)
  await settle(m)
  expect(done).toHaveBeenCalledTimes(1)
})

test('presence.animation.9 animation-name none exits after the documented frame query', async () => {
  const m = await fixture()
  m.content.style.animationDuration = '100s'
  m.content.style.animationName = 'none'
  m.setProps({ open: false })
  expect(m.content).toBeInTheDocument()
  await settle(m)
  expect(m.content).not.toBeInTheDocument()
})
