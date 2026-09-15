import { Accordion } from '@xenon/solid/accordion'
import type { AccordionValue } from '@xenon/solid/accordion'
import type { JSX } from '@solidjs/web'
import { For, createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

const SHIPPING = [
  ['returns', 'Returns', 'Thirty days, unopened, receipt in the box. We pay the postage back.'],
  ['tracking', 'Tracking', 'A number arrives the moment the parcel is scanned, not when it ships.'],
  ['damage', 'Damage', 'Photograph the carton before you unpack it. It settles the claim faster.'],
] as const

export function AccordionDemo(): JSX.Element {
  const [open, setOpen] = createSignal<AccordionValue>('returns')

  return (
    <Section
      index="10"
      title="Accordion"
      blurb="A stack of collapsibles that agree on which are open. It borrows the composite
        engine's arrows and throws away its roving tab stop, because every trigger keeps its own."
    >
      <Bench caption="Single" note="collapsible">
        <Accordion
          class="accordion"
          collapsible
          value={open()}
          onValueChange={(next) => setOpen(next)}
        >
          <For each={SHIPPING}>
            {([value, title, body]) => (
              <Accordion.Item class="accordion__item" value={value}>
                <h3 class="accordion__heading">
                  <Accordion.Trigger class="accordion__trigger">
                    {title}
                    <span class="accordion__arrow" aria-hidden="true" />
                  </Accordion.Trigger>
                </h3>
                <Accordion.Panel class="accordion__panel">
                  <p class="prose accordion__body">{body}</p>
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </For>
        </Accordion>
        <p class="prose">
          Single mode keeps one panel open. Without <code>collapsible</code> the open item ignores
          its own trigger and there is no way back to nothing, which is why the flag exists at all
          and why the payload here can come back <code>undefined</code>. Each panel is a{' '}
          <code>role="region"</code> labelled by its trigger, and the trigger owns the heading's
          content rather than the heading owning the button.
        </p>
        <Readout rows={[['value', open() === undefined ? 'undefined' : String(open())]]} />
      </Bench>

      <Bench caption="Multiple" note="mode='multiple'">
        <Accordion class="accordion" mode="multiple" defaultValue={['axis']}>
          <Accordion.Item class="accordion__item" value="axis">
            <h3 class="accordion__heading">
              <Accordion.Trigger class="accordion__trigger">
                Axis
                <span class="accordion__arrow" aria-hidden="true" />
              </Accordion.Trigger>
            </h3>
            <Accordion.Panel class="accordion__panel">
              <p class="prose accordion__body">
                Vertical by default, so <Keys>↑</Keys> <Keys>↓</Keys> travel the triggers and{' '}
                <Keys>←</Keys> <Keys>→</Keys> are left to the page.
              </p>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item class="accordion__item" value="tabbing">
            <h3 class="accordion__heading">
              <Accordion.Trigger class="accordion__trigger">
                Tabbing
                <span class="accordion__arrow" aria-hidden="true" />
              </Accordion.Trigger>
            </h3>
            <Accordion.Panel class="accordion__panel">
              <p class="prose accordion__body">
                <Keys>Tab</Keys> stops on every trigger in turn. An accordion is a set of
                disclosures that happen to share state, not a single widget, so there is no one tab
                stop to rove.
              </p>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item class="accordion__item" value="locked" disabled>
            <h3 class="accordion__heading">
              <Accordion.Trigger class="accordion__trigger">
                Locked
                <span class="accordion__arrow" aria-hidden="true" />
              </Accordion.Trigger>
            </h3>
            <Accordion.Panel class="accordion__panel">
              <p class="prose accordion__body">Never reached.</p>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <p class="prose">
          Multiple mode reports an array and lets every panel sit open at once. Locked is a disabled
          native button: <Keys>Tab</Keys> and the arrows both step over it, because unlike a toolbar
          item there is no roving ring for it to hold a place in.
        </p>
      </Bench>
    </Section>
  )
}
