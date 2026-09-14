import { Tabs } from '@tenon/solid/tabs'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function TabsDemo(): JSX.Element {
  const [picked, setPicked] = createSignal('core')

  return (
    <Section
      index="11"
      title="Tabs"
      blurb="The composite engine again, this time with a panel hanging off each stop. The only
        argument worth having is whether arrowing to a tab should also open it."
    >
      <Bench caption="Automatic" note="activationMode">
        <Tabs class="tabs" value={picked()} onValueChange={(next) => setPicked(next)}>
          <Tabs.List class="tablist" aria-label="Packages">
            <Tabs.Tab class="tab" value="core">
              core
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="solid">
              solid
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="dom">
              dom
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel class="tabpanel" value="core">
            <p class="prose">
              Plain TypeScript, one function per component, no DOM globals. It is tested in Node,
              which is the cheapest way to keep it honest.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="solid">
            <p class="prose">
              Components that call core inside a memo and spread the result. Nothing from core
              reaches your code.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="dom">
            <p class="prose">
              The framework-free half that needs a live document. Right now it holds exactly one
              thing: waiting for an exit animation to finish.
            </p>
          </Tabs.Panel>
        </Tabs>
        <p class="prose">
          Automatic is the default, so <Keys>←</Keys> <Keys>→</Keys> select as they move. The
          horizontal list carries no <code>aria-orientation</code>, because horizontal is already
          what a tablist is taken to be, and a panel with nothing focusable inside it takes a{' '}
          <code>tabindex</code> of its own so <Keys>Tab</Keys> out of the list reaches the content.
        </p>
        <Readout
          rows={[
            ['value', picked()],
            ['data-state', `active on ${picked()}, inactive on the rest`],
          ]}
        />
      </Bench>

      <Bench caption="Manual" note="activationMode='manual'">
        <Tabs class="tabs" activationMode="manual" defaultValue="draft">
          <Tabs.List class="tablist" aria-label="Stage">
            <Tabs.Tab class="tab" value="draft">
              draft
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="review">
              review
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="published" disabled>
              published
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="archived">
              archived
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel class="tabpanel" value="draft">
            <p class="prose">
              Arrow across this list and the panels stay put. The selection only moves when you
              press <Keys>Enter</Keys> or <Keys>Space</Keys>, or click.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="review">
            <p class="prose">
              Manual earns its keep when opening a tab costs something, a fetch or a scroll
              position, and arrowing past four of them would fire all four.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="published">
            <p class="prose">Never reached.</p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="archived">
            <p class="prose">
              <a class="link" href="#tabs">
                A focusable child
              </a>{' '}
              means this panel gives up its own tab stop and lets you reach the link instead. The
              adapter watches the subtree for that with a mutation observer.
            </p>
          </Tabs.Panel>
        </Tabs>
        <p class="prose">
          The published tab is disabled and leaves the ring, so arrowing from review lands on
          archived. Move focus out of the list entirely and the tab stop snaps back to the selected
          tab, which is what <Keys>Shift</Keys> <Keys>Tab</Keys> into the list should find.
        </p>
      </Bench>

      <Bench caption="Vertical" note="orientation">
        <Tabs class="tabs tabs--vertical" orientation="vertical" defaultValue="rules">
          <Tabs.List class="tablist tablist--vertical" aria-label="Round one">
            <Tabs.Tab class="tab" value="rules">
              rules
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="ids">
              ids
            </Tabs.Tab>
            <Tabs.Tab class="tab" value="exits">
              exits
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel class="tabpanel" value="rules">
            <p class="prose">
              A vertical list is the one case that does announce itself, with{' '}
              <code>aria-orientation="vertical"</code>, because that is the value a tablist is not
              assumed to have.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="ids">
            <p class="prose">
              Core never generates an id. The adapter mints one base and derives the rest, and an id
              you write yourself wins and is registered back so <code>aria-controls</code> follows
              it.
            </p>
          </Tabs.Panel>
          <Tabs.Panel class="tabpanel" value="exits">
            <p class="prose">
              <Keys>↑</Keys> <Keys>↓</Keys> move here and the horizontal arrows are left alone, so a
              vertical tablist beside a scrolling panel does not fight the page.
            </p>
          </Tabs.Panel>
        </Tabs>
      </Bench>
    </Section>
  )
}
