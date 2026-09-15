import { Collapsible } from '@xenon/solid/collapsible'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Readout, Section } from '../ui'

export function CollapsibleDemo(): JSX.Element {
  const [open, setOpen] = createSignal(false)

  return (
    <Section
      index="09"
      title="Collapsible"
      blurb="One trigger and one panel, with room for an exit animation.
        The panel is out of the DOM while closed and stays in it until its animation finishes."
    >
      <Bench caption="Open and close" note="data-starting-style · data-ending-style">
        <Collapsible class="disclosure" open={open()} onOpenChange={(next) => setOpen(next)}>
          <Collapsible.Trigger class="disclosure__trigger">
            <span class="disclosure__arrow" aria-hidden="true" />
            Release notes
          </Collapsible.Trigger>
          <Collapsible.Content class="disclosure__panel">
            <div class="disclosure__inner">
              <p class="prose">
                The panel is measured on every status change. While it is coming or going the
                adapter writes a pixel value into <code>--collapsible-panel-height</code>; once it
                has arrived that becomes <code>auto</code>, so the content can reflow afterwards
                without being pinned to the height it happened to have when it opened.
              </p>
            </div>
          </Collapsible.Content>
        </Collapsible>
        <p class="prose">
          The transition is entirely this app's. Opening mounts the panel with{' '}
          <code>data-starting-style</code> for one frame, which is the hook the stylesheet uses for
          the closed end of the animation. Closing sets <code>data-ending-style</code> and then
          waits: the presence primitive asks the element for its running animations and only removes
          it once they have finished, so the panel never disappears mid-slide.
        </p>
        <Readout
          rows={[
            ['open', String(open())],
            ['panel in the DOM', open() ? 'yes' : 'only while it is closing'],
          ]}
        />
      </Bench>

      <Bench caption="Kept in the DOM" note="forceMount">
        <Collapsible class="disclosure" forceMount>
          <Collapsible.Trigger class="disclosure__trigger">
            <span class="disclosure__arrow" aria-hidden="true" />
            Indexed while closed
          </Collapsible.Trigger>
          <Collapsible.Content class="disclosure__panel">
            <div class="disclosure__inner">
              <p class="prose">
                This one is rendered whether or not it is open. Closed, it carries the native{' '}
                <code>hidden</code> attribute, which keeps it out of the accessibility tree and out
                of find-in-page while leaving it where a crawler can still read it.
              </p>
            </div>
          </Collapsible.Content>
        </Collapsible>
        <p class="prose">
          A disabled collapsible is a disabled native button, so there is no click to intercept and
          no key handler to suppress. That is why the trigger, alone among the pressables here, does
          not gate your own handlers.
        </p>
      </Bench>
    </Section>
  )
}
