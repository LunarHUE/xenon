import { Collapsible } from '@tenon/solid'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('presence.a11y.2', async () => {
  const m = mount('collapsible', {
    forceMount: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>
          <button>Hidden action</button>
        </Collapsible.Content>
      </>
    ),
  })
  await expectNoViolations(m.container)
})
