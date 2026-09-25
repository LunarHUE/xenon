// Presence is internal to adapters. Exercise its DOM contract through the public disclosure.
import { Collapsible } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
    ...props,
  })
  return { ...m, content: () => within(m.container).queryByText('Contents') }
}

describe('presence conformance through collapsible', () => {
  spec('presence.roles.1', () => {
    const m = fixture({ open: true })
    const el = m.content()!
    expect(el).not.toHaveAttribute('role')
    expect(el.getAttributeNames().filter((name) => name.startsWith('aria-'))).toEqual([])
  })
  spec('presence.roles.7', async () => {
    const m = fixture({ forceMount: true })
    expect(m.content()).toHaveAttribute('hidden')
    m.setProps({ open: true })
    await m.settle()
    expect(m.content()).not.toHaveAttribute('hidden')
    m.setProps({ open: false })
    await m.settle()
    expect(m.content()).toHaveAttribute('hidden')
  })
  spec('presence.state.5', () => {
    const m = fixture()
    expect(m.content()).toBeNull()
    m.setProps({ open: true })
    expect(m.content()).toHaveAttribute('data-starting-style', '')
    expect(m.content()).toHaveAttribute('data-state', 'open')
  })
  spec('presence.animation.21', () => {
    const m = fixture({ forceMount: true })
    expect(m.content()).toBeInTheDocument()
    expect(m.content()).toHaveAttribute('hidden')
  })
  spec('presence.notes.1', async () => {
    const m = fixture({ open: true })
    m.setProps({ open: false })
    await m.settle()
    expect(m.content()).toBeNull()
  })
  spec('presence.notes.13', () => {
    const m = fixture({
      open: true,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content as="section" class="author">
            Contents
          </Collapsible.Content>
        </>
      ),
    })
    expect(m.content()!.tagName).toBe('SECTION')
    expect(m.content()).toHaveClass('author')
    expect(m.content()).toHaveAttribute('data-state', 'open')
  })
})

spec('presence.rtl.1', async () => {
  const m = fixture({ dir: 'rtl', forceMount: true })
  expect(m.content()).not.toHaveAttribute('dir')
  m.setProps({ open: true })
  await m.settle()
  expect(m.content()).toHaveAttribute('data-state', 'open')
  m.setProps({ dir: 'ltr', open: false })
  await m.settle()
  expect(m.content()).toHaveAttribute('hidden')
  expect(m.content()).not.toHaveAttribute('dir')
})

spec('presence.notes.9', async () => {
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  const attached = vi.fn()
  const changingRef = () => {
    const staticRevision = revision()
    return (node: HTMLElement) => {
      attached(node)
      setRevision(staticRevision + 1)
    }
  }
  const m = fixture({
    forceMount: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content ref={changingRef()} data-revision={revision()}>
          Contents
        </Collapsible.Content>
      </>
    ),
  })
  const node = m.content()
  await m.settle()
  expect(attached).toHaveBeenCalledWith(node)
  const initialCalls = attached.mock.calls.length
  await m.settle()
  expect(attached).toHaveBeenCalledTimes(initialCalls)
  m.setProps({ open: true })
  await m.settle()
  expect(m.content()).toBe(node)
  const openCalls = attached.mock.calls.length
  await m.settle()
  expect(attached).toHaveBeenCalledTimes(openCalls)
})
