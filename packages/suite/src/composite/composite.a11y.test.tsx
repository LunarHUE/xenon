import { Toolbar } from '@tenon/solid'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function item(name: string): HTMLElement {
  return screen.getByRole('button', { name })
}

function tabindexes(root: HTMLElement): (string | null)[] {
  return [...root.querySelectorAll('[tabindex]')].map((el) => el.getAttribute('tabindex'))
}

describe('composite a11y', () => {
  spec('composite.a11y.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Toolbar.Button disabled>italic</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            underline
          </Toolbar.Button>
          <Toolbar.Link href="#help">help</Toolbar.Link>
        </>
      ),
    })

    for (const value of tabindexes(m.container)) expect(['0', '-1']).toContain(value)
    await expectNoViolations(m.container, ['tabindex'])

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()

    for (const value of tabindexes(m.container)) expect(['0', '-1']).toContain(value)
    await expectNoViolations(m.container, ['tabindex'])
  })
})
