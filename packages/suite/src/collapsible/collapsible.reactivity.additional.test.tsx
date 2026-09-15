import { Collapsible } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'

describe('collapsible reactive state', () => {
  test('removing open control preserves the internal state accumulated before control', async () => {
    const changed = vi.fn()
    const m = mount('collapsible', {
      defaultOpen: false,
      onOpenChange: changed,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>Contents</Collapsible.Content>
        </>
      ),
    })
    const trigger = within(m.container).getByRole('button')
    fireEvent.click(trigger)
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith(true)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    m.setProps({ open: false })
    await m.settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(trigger)
    await m.settle()
    expect(changed).toHaveBeenCalledTimes(2)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    m.setProps({ open: undefined })
    await m.settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(within(m.container).getByText('Contents')).toBeVisible()
    expect(changed).toHaveBeenCalledTimes(2)
  })

  test('a live disabled change updates the trigger and blocks activation', async () => {
    const changed = vi.fn()
    const m = mount('collapsible', {
      onOpenChange: changed,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>Contents</Collapsible.Content>
        </>
      ),
    })
    const trigger = within(m.container).getByRole('button')
    m.setProps({ disabled: true })
    await m.settle()
    expect(trigger).toBeDisabled()
    fireEvent.click(trigger)
    await m.settle()
    expect(within(m.container).queryByText('Contents')).toBeNull()
    expect(changed).not.toHaveBeenCalled()
  })
})
