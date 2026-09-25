import { Collapsible } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(forceMount = false) {
  const m = mount('collapsible', {
    open: true,
    forceMount,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content style={{ width: '200px', padding: '20px' }}>
          Contents
        </Collapsible.Content>
      </>
    ),
  })
  return { ...m, content: within(m.container).getByText('Contents') }
}

async function finish(animation: Animation) {
  animation.finish()
  await animation.finished
}

describe('presence browser lifecycle', () => {
  spec('presence.animation.7', async () => {
    const m = fixture()
    const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
    m.setProps({ open: false })
    await m.settle()
    expect(m.content).toBeInTheDocument()
    expect(m.content).toHaveAttribute('data-ending-style', '')
    await finish(animation)
    await m.settle()
    expect(m.content).not.toBeInTheDocument()
  })
  spec('presence.animation.16', async () => {
    const m = fixture()
    const first = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
    m.setProps({ open: false })
    await m.settle()
    const replacement = m.content.animate([{ opacity: 0.5 }, { opacity: 0 }], { duration: 10000 })
    first.cancel()
    await m.settle()
    expect(m.content).toBeInTheDocument()
    expect(m.content).toHaveAttribute('data-ending-style', '')
    await finish(replacement)
    await m.settle()
    expect(m.content).not.toBeInTheDocument()
    const canceled = fixture()
    const last = canceled.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
    canceled.setProps({ open: false })
    await canceled.settle()
    last.cancel()
    await canceled.settle()
    expect(canceled.content).not.toBeInTheDocument()
  })

  spec('collapsible.animation.14', async () => {
    const m = fixture(true)
    expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
    const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
    m.setProps({ open: false })
    await m.settle()
    expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe(
      `${m.content.scrollHeight}px`
    )
    expect(m.content.style.getPropertyValue('--collapsible-panel-width')).toBe(
      `${m.content.scrollWidth}px`
    )
    await finish(animation)
    await m.settle()
    expect(m.content).toHaveAttribute('hidden')
    // Architecture requires clearing measured properties in exited state.
    expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe('')
    expect(m.content.style.getPropertyValue('--collapsible-panel-width')).toBe('')
  })
})

spec('presence.animation.2', async () => {
  const m = fixture()
  const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  m.setProps({ open: true })
  await m.settle()
  expect(within(m.container).getByText('Contents')).toBe(m.content)
  expect(m.content).not.toHaveAttribute('data-ending-style')
  await finish(animation)
  await m.settle()
  expect(m.content).toBeInTheDocument()
  expect(m.content).not.toHaveAttribute('data-starting-style')
  m.setProps({ open: false })
  await m.settle()
  expect(m.content).not.toBeInTheDocument()
})

spec('presence.animation.5', async () => {
  const m = fixture()
  const first = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  const last = m.content.animate([{ transform: 'scale(1)' }, { transform: 'scale(.5)' }], {
    duration: 10000,
  })
  m.setProps({ open: false })
  await m.settle()
  await finish(first)
  await m.settle()
  expect(m.content).toBeInTheDocument()
  await finish(last)
  await m.settle()
  expect(m.content).not.toBeInTheDocument()
})

spec('presence.animation.9', async () => {
  const m = fixture()
  m.content.style.animationDuration = '100s'
  m.content.style.animationName = 'none'
  m.setProps({ open: false })
  await m.settle()
  expect(m.content).not.toBeInTheDocument()
})

spec('presence.roles.4', async () => {
  const m = fixture(true)
  expect(m.content).not.toHaveAttribute('data-starting-style')
  expect(m.content).not.toHaveAttribute('data-ending-style')
  m.setProps({ open: false })
  await m.settle()
  m.setProps({ open: true })
  expect(m.content).toHaveAttribute('data-starting-style', '')
  await m.settle()
  expect(m.content).not.toHaveAttribute('data-starting-style')
  const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  expect(m.content).toHaveAttribute('data-ending-style', '')
  await finish(animation)
  await m.settle()
  expect(m.content).not.toHaveAttribute('data-ending-style')
})

spec('presence.a11y.3', async () => {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>
          <button>Leaving action</button>
        </Collapsible.Content>
        <button>Survivor</button>
      </>
    ),
  })
  const action = within(m.container).getByRole('button', { name: 'Leaving action' })
  const content = action.parentElement!
  const animation = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  expect(content).toBeInTheDocument()
  expect(content).toHaveAttribute('inert')
  within(m.container).getByRole('button', { name: 'Details' }).focus()
  await userEvent.tab()
  expect(within(m.container).getByRole('button', { name: 'Survivor' })).toHaveFocus()
  await finish(animation)
  await m.settle()
  expect(content).not.toBeInTheDocument()
})

spec('collapsible.animation.10', async () => {
  const style = document.createElement('style')
  style.textContent =
    '@keyframes suite-disclosure-exit { from { opacity: 1; } to { opacity: 0; } } [data-suite-motion][data-ending-style] { animation: suite-disclosure-exit 10s linear; }'
  document.head.append(style)
  onTestFinished(() => style.remove())
  const m = mount('collapsible', {
    forceMount: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content data-suite-motion="">Contents</Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Contents')
  m.setProps({ open: true })
  expect(content).toHaveAttribute('data-starting-style', '')
  await m.settle()
  expect(content).not.toHaveAttribute('data-starting-style')
  m.setProps({ open: false })
  await m.settle()
  expect(content).toHaveAttribute('data-ending-style', '')
  expect(content).not.toHaveAttribute('hidden')
  const animations = content.getAnimations()
  expect(animations).toHaveLength(1)
  await finish(animations[0]!)
  await m.settle()
  expect(content).toHaveAttribute('hidden')
  expect(content).not.toHaveAttribute('data-ending-style')
})

spec('presence.animation.31', async () => {
  const m = fixture()
  expect(m.content.style.height).toBe('')
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
  const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  expect(m.content.style.height).toBe('')
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe(
    `${m.content.scrollHeight}px`
  )
  await finish(animation)
  await m.settle()
})

spec('collapsible.animation.12', async () => {
  const m = fixture(true)
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
  const animation = m.content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe(
    `${m.content.scrollHeight}px`
  )
  await m.settle()
  await finish(animation)
  await m.settle()
  m.setProps({ open: true })
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toMatch(/^\d+px$/)
  await m.settle()
  expect(m.content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
})
