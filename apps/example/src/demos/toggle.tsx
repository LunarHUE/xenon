import { Toggle } from '@xenon/solid/toggle'
import type { JSX } from '@solidjs/web'
import { createSignal } from 'solid-js'

import { Bench, Keys, Readout, Section } from '../ui'

export function ToggleDemo(): JSX.Element {
  const [muted, setMuted] = createSignal(false)

  return (
    <Section
      index="06"
      title="Toggle"
      blurb="A button that stays down. It is the button controller with one more bit of state, so
        disabled, pending and the four hosts all still behave the way they did."
    >
      <Bench caption="Pressed" note="aria-pressed · data-state">
        <div class="row">
          <Toggle
            class="toggle"
            pressed={muted()}
            onPressedChange={(next) => setMuted(next)}
            aria-label="Mute"
          >
            mute
          </Toggle>
          <Toggle class="toggle" defaultPressed>
            pin
          </Toggle>
          <Toggle class="toggle" disabled>
            crop
          </Toggle>
          <Toggle class="toggle" defaultPressed disabled>
            grid
          </Toggle>
        </div>
        <p class="prose">
          Nothing here is a checkbox. A toggle answers <code>aria-pressed</code>, which is what a
          screen reader reads as "pressed", and the fill you see is a plain attribute selector on{' '}
          <code>data-state</code>. The last two are disabled and still report the state they are in,
          because a disabled control that lies about its value is worse than one you cannot press.
        </p>
        <Readout
          rows={[
            ['aria-pressed', String(muted())],
            ['data-state', muted() ? 'on' : 'off'],
          ]}
        />
      </Bench>

      <Bench caption="Other hosts" note="as">
        <div class="row">
          <Toggle class="toggle" as="div" defaultPressed>
            div
          </Toggle>
          <Toggle class="toggle" as="input" value="input" />
        </div>
        <p class="prose">
          The div host borrows everything the button already worked out: <code>role="button"</code>,
          a tab stop, and a real click synthesized from <Keys>Enter</Keys> and <Keys>Space</Keys>.
          The input host is an <code>input[type=button]</code>, so the label rides in{' '}
          <code>value</code> and there is nowhere to put children. Both read the same{' '}
          <code>data-state</code>, which is the only thing this stylesheet knows about them.
        </p>
      </Bench>
    </Section>
  )
}
