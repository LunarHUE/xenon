import { Accordion } from '@kit/solid'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('accordion.a11y.8', async () => {
  for (const props of [
    {},
    { defaultValue: 'a' },
    { mode: 'multiple', defaultValue: ['a'] },
    { orientation: 'vertical', forceMount: true },
  ]) {
    const m = mount('accordion', {
      ...props,
      children: () => (
        <>
          <Accordion.Item value="a">
            <h3>
              <Accordion.Trigger>Section</Accordion.Trigger>
            </h3>
            <Accordion.Panel>
              <button>Inside</button>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="b">
            <h3>
              <Accordion.Trigger>Another</Accordion.Trigger>
            </h3>
            <Accordion.Panel>More</Accordion.Panel>
          </Accordion.Item>
        </>
      ),
    })
    await expectNoViolations(m.container)
    m.unmount()
  }
})
