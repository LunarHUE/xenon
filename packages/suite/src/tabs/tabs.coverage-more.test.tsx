import { Menu, Tabs } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { expect, vi } from 'vitest'
import axe from 'axe-core'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('tabs.a11y.1', () => {
  for (const [index, props] of [
    { 'aria-label': 'Named' },
    { title: 'Titled' },
    { 'aria-labelledby': 'label-2' },
  ].entries()) {
    const m = mount('tabs', {
      children: () => (
        <>
          <span id={`label-${index}`}>Label</span>
          <Tabs.List>
            <Tabs.Tab value="a" {...props}>
              {props.title ? undefined : 'Visible'}
            </Tabs.Tab>
          </Tabs.List>
        </>
      ),
    })
    expect(within(m.container).getByRole('tab')).toHaveAccessibleName(
      props['aria-label'] ?? (props['aria-labelledby'] ? 'Label' : 'Titled')
    )
  }
})

spec('tabs.a11y.3', async () => {
  const m = mount('tabs', { children: () => <Tabs.Tab value="a">Orphan</Tabs.Tab> })
  const result = await axe.run(m.container)
  expect(
    result.violations.some(
      (violation) => violation.id === 'aria-required-parent' && violation.impact === 'critical'
    )
  ).toBe(true)
})

spec('tabs.focus.14', async () => {
  const [show, setShow] = createSignal(true)
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          {show() && <Tabs.Tab value="a">A</Tabs.Tab>}
          <Tabs.Tab value="b" disabled>
            B
          </Tabs.Tab>
          <Tabs.Tab value="c">C</Tabs.Tab>
        </Tabs.List>
        {show() && <Tabs.Panel value="a">A</Tabs.Panel>}
        <Tabs.Panel value="b">B</Tabs.Panel>
        <Tabs.Panel value="c">C</Tabs.Panel>
      </>
    ),
  })
  const tabs = within(m.container).getAllByRole('tab')
  tabs[0]!.focus()
  setShow(false)
  await m.settle()
  expect(within(m.container).getByRole('tab', { name: 'B' })).toHaveAttribute('tabindex', '-1')
  expect(within(m.container).getByRole('tab', { name: 'C' })).toHaveAttribute('tabindex', '0')
})

spec('tabs.notes.3', () => {
  const refs = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]
  const clicks = [vi.fn(), vi.fn(), vi.fn(), vi.fn()]
  const m = mount('tabs', {
    ref: refs[0],
    onClick: clicks[0],
    children: () => (
      <>
        <Tabs.List ref={refs[1]} onClick={clicks[1]}>
          <Tabs.Tab ref={refs[2]} onClick={clicks[2]} value="a">
            A
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel ref={refs[3]} onClick={clicks[3]} value="a">
          A
        </Tabs.Panel>
      </>
    ),
  })
  fireEvent.click(within(m.container).getByRole('tab'))
  fireEvent.click(within(m.container).getByRole('tabpanel'))
  expect(refs[0]).toHaveBeenCalledWith(m.container.firstElementChild)
  expect(refs[1]).toHaveBeenCalledWith(within(m.container).getByRole('tablist'))
  expect(refs[2]).toHaveBeenCalledWith(within(m.container).getByRole('tab'))
  expect(refs[3]).toHaveBeenCalledWith(within(m.container).getByRole('tabpanel'))
  for (const click of clicks) expect(click).toHaveBeenCalled()
})

spec('tabs.roles.8', () => {
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a" aria-haspopup="menu">
            Actions
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <Menu aria-label="Actions">
            <Menu.Trigger>Open</Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>Item</Menu.Content>
            </Menu.Positioner>
          </Menu>
        </Tabs.Panel>
      </>
    ),
  })
  const actionTab = within(m.container).getByRole('tab', { name: 'Actions' })
  expect(actionTab).toHaveAccessibleName('Actions')
  expect(actionTab).toHaveAttribute('aria-haspopup', 'menu')
  expect(within(m.container).getByRole('button', { name: 'Open' })).toBeVisible()
})

spec('tabs.state.10', async () => {
  const [showA, setShowA] = createSignal(true)
  const [showB, setShowB] = createSignal(true)
  const changed = vi.fn()
  const m = mount('tabs', {
    onValueChange: changed,
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          {showA() && <Tabs.Tab value="a">A</Tabs.Tab>}
          {showB() && <Tabs.Tab value="b">B</Tabs.Tab>}
        </Tabs.List>
        <Tabs.Panel value="a">A</Tabs.Panel>
        <Tabs.Panel value="b">B</Tabs.Panel>
      </>
    ),
  })
  const panel = within(m.container).getAllByRole('tabpanel', { hidden: true })[1]!
  const labelledBy = panel.getAttribute('aria-labelledby')
  expect(labelledBy).toBeTruthy()

  setShowA(false)
  await m.settle()
  expect(within(m.container).getByRole('tab', { name: 'B' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(changed).not.toHaveBeenCalled()

  setShowB(false)
  await m.settle()
  expect(within(m.container).queryAllByRole('tab')).toHaveLength(0)
  expect(panel).toHaveAttribute('hidden')
  expect(panel).toHaveAttribute('aria-labelledby', labelledBy)
  expect(changed).not.toHaveBeenCalled()
})

spec('tabs.state.20', async () => {
  const [inner, setInner] = createSignal(true)
  const m = mount('tabs', {
    onValueChange: () => setInner(false),
    children: () => (
      <>
        <Tabs.List aria-label="Outer">
          <Tabs.Tab value="outer">Outer</Tabs.Tab>
          <Tabs.Tab value="other">Other</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="outer">
          {inner() && (
            <Tabs>
              <Tabs.List aria-label="Inner">
                <Tabs.Tab value="one">One</Tabs.Tab>
                <Tabs.Tab value="two">Two</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="one">One</Tabs.Panel>
              <Tabs.Panel value="two">Two</Tabs.Panel>
            </Tabs>
          )}
        </Tabs.Panel>
        <Tabs.Panel value="other">Other</Tabs.Panel>
      </>
    ),
  })
  const outer = within(m.container).getByRole('tab', { name: 'Outer' })
  fireEvent.click(within(m.container).getByRole('tab', { name: 'Two' }))
  await m.settle()
  expect(outer).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(within(m.container).getByRole('tab', { name: 'Other' }))
  await m.settle()
  expect(within(m.container).queryByRole('tab', { name: 'Two' })).toBeNull()
})
