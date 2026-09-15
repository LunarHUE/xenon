import { Collapsible } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect, onTestFinished } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('collapsible.animation.10', async () => {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content data-motion="">Content</Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Content')
  const animation = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  expect(content).toHaveAttribute('data-ending-style', '')
  expect(content).toBeInTheDocument()
  animation.finish()
  await animation.finished
  await m.settle()
  expect(content).not.toBeInTheDocument()
})

spec('collapsible.animation.21', async () => {
  const style = document.createElement('style')
  style.textContent =
    '[data-multi] { opacity: 1; transform: scale(1); } [data-multi][data-ending-style] { opacity: 0; transform: scale(.9); transition-property: opacity, transform; transition-duration: 200ms, 50ms; transition-delay: 0ms, 100ms; }'
  document.head.append(style)
  onTestFinished(() => style.remove())
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content data-multi="">Content</Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Content')
  await m.settle()
  m.setProps({ open: false })
  await m.settle()
  expect(content).toBeInTheDocument()
  expect(content.getAnimations()).toHaveLength(2)
  await new Promise((resolve) => setTimeout(resolve, 150))
  expect(content).toBeInTheDocument()
  await new Promise((resolve) => setTimeout(resolve, 100))
  await m.settle()
  expect(content).not.toBeInTheDocument()
})

spec('collapsible.animation.22', async () => {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content style={{ 'animation-name': 'none', 'animation-duration': '10s' }}>
          Content
        </Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Content')
  await m.settle()
  m.setProps({ open: false })
  await m.settle()
  expect(content).not.toBeInTheDocument()
})

spec('collapsible.animation.24', async () => {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Content')
  const stale = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  await m.settle()
  m.setProps({ open: true })
  await m.settle()
  expect(within(m.container).getByText('Content')).toBe(content)
  expect(content).not.toHaveAttribute('data-starting-style')
  stale.finish()
  await stale.finished
  await m.settle()
  expect(within(m.container).getByText('Content')).toBe(content)
  m.setProps({ open: false })
  expect(content).toHaveAttribute('data-ending-style', '')
  await m.settle()
  expect(content).not.toBeInTheDocument()
})

spec('collapsible.animation.25', async () => {
  const m = mount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content style={{ width: '120px', height: '30px' }}>
          Content
        </Collapsible.Content>
      </>
    ),
  })
  const content = within(m.container).getByText('Content')
  const opening = content.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 10000 })
  m.setProps({ open: false })
  opening.finish()
  expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('30px')
  expect(content.style.getPropertyValue('--collapsible-panel-width')).toBe('120px')
})
