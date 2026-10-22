import { Collapsible } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'
import { mount } from '../harness/solid'

for (const forceMount of [false, true]) {
  test(`reopening an exiting forceMount=${forceMount} owner preserves identity and publishes the new entry phase`, async () => {
    const m = mount('collapsible', {
      open: true,
      forceMount,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content style={{ height: '60px', width: '180px' }}>
            Contents
          </Collapsible.Content>
        </>
      ),
    })
    const scope = within(m.container)
    const content = scope.getByText('Contents')
    await m.settle()
    const oldExit = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
    m.setProps({ open: false })
    await m.settle()
    expect(content).toHaveAttribute('data-ending-style', '')
    expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('60px')
    m.setProps({ open: true })
    expect(scope.getByText('Contents')).toBe(content)
    expect(content).toHaveAttribute('data-state', 'open')
    expect(content).not.toHaveAttribute('data-ending-style')
    expect(content).toHaveAttribute('data-starting-style')
    expect(content).not.toHaveAttribute('hidden')
    expect(scope.getByRole('button', { name: 'Details' })).toHaveAttribute('aria-expanded', 'true')
    oldExit.finish()
    await oldExit.finished
    await m.settle()
    expect(scope.getByText('Contents')).toBe(content)
    expect(content).toBeVisible()
    expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
    m.setProps({ open: false })
    await m.settle()
    if (forceMount) {
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('hidden')
    } else expect(content).not.toBeInTheDocument()
  })
}
